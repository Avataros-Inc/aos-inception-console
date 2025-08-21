import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, MicMute, ChatDots } from 'react-bootstrap-icons';
import { Button, Alert } from 'react-bootstrap';
import { MicVAD } from '@ricky0123/vad-web';

const MicrophoneStreamer = forwardRef(({ wsReadyState, sendMessage, ReadyState }, ref) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [userTalking, setUserTalking] = useState(false);
  const [AvatarTalking, setAvatarTalking] = useState(false);
  const [muted, setMuted] = useState(true); // Start muted by default
  const [vadRunning, setVadRunning] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioChunksRef = useRef([]);
  const vadRef = useRef(null);
  const mutedRef = useRef(true); // Track muted state for VAD callbacks
  const vadInitializingRef = useRef(false); // Prevent multiple initialization attempts
  const volumeCallbackRef = useRef(null); // Volume callback function
  const analyserRef = useRef(null); // Audio analyser for volume detection
  const volumeMonitoringRef = useRef(false); // Track if volume monitoring is active

  // Centralized VAD initialization function
  const initializeVAD = async () => {
    // Prevent multiple initialization attempts
    if (vadRef.current || vadInitializingRef.current) {
      return vadRef.current;
    }

    vadInitializingRef.current = true;
    try {
      console.log('[VAD] Requesting microphone permissions...');

      // First, request microphone permissions explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the stream as we just needed permissions
      stream.getTracks().forEach((track) => track.stop());

      setHasPermission(true);
      console.log('[VAD] Microphone permissions granted, initializing VAD...');

      // Try different initialization approaches
      try {
        // First attempt: Let library auto-detect URLs
        console.log('[VAD] Attempting auto-detection initialization...');
        vadRef.current = await MicVAD.new({
          startOnLoad: false,
          redemptionFrames: 8,
          onSpeechStart: () => {
            const isWebSocketReady = wsReadyState === ReadyState.OPEN || wsReadyState === ReadyState.CONNECTING;
            const currentMuted = mutedRef.current;
            if (!currentMuted && isWebSocketReady) {
              setUserTalking(true);
              startRecording();
            }
          },
          onSpeechEnd: () => {
            setUserTalking(false);
            stopRecording();
          },
        });

        // Start continuous volume monitoring when VAD is initialized
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        startVolumeMonitoring(stream);
      } catch (autoError) {
        console.warn('[VAD] Auto-detection failed, trying with explicit URLs:', autoError);

        // Second attempt: Use explicit URLs
        vadRef.current = await MicVAD.new({
          startOnLoad: false,
          redemptionFrames: 8,
          modelURL: '/silero_vad_v5.onnx',
          workletURL: '/vad.worklet.bundle.min.js',
          onSpeechStart: () => {
            const isWebSocketReady = wsReadyState === ReadyState.OPEN || wsReadyState === ReadyState.CONNECTING;
            const currentMuted = mutedRef.current;
            if (!currentMuted && isWebSocketReady) {
              setUserTalking(true);
              startRecording();
            }
          },
          onSpeechEnd: () => {
            setUserTalking(false);
            stopRecording();
          },
        });

        // Start continuous volume monitoring for fallback VAD as well
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        startVolumeMonitoring(stream);
      }

      console.log('[VAD] VAD initialized successfully');
      return vadRef.current;
    } catch (error) {
      console.error('[VAD] Failed to initialize VAD:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setHasPermission(false);
        console.error('[VAD] Microphone permission denied');
      }
      throw error;
    } finally {
      vadInitializingRef.current = false;
    }
  };

  // Update muted ref whenever muted state changes
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Initialize VAD only when needed - removed automatic initialization
  // VAD will be initialized on first use to avoid permission issues

  // Start VAD when WebSocket is ready
  useEffect(() => {
    if (wsReadyState === ReadyState.OPEN && vadRef.current && !muted) {
      vadRef.current.start();
    }
  }, [wsReadyState, muted, ReadyState.OPEN]);

  // Monitor avatar audio volume for interruption detection
  const setupAvatarVolumeMonitoring = () => {
    // Placeholder for future avatar volume monitoring
  };

  // Volume monitoring for microphone input
  const startVolumeMonitoring = (stream) => {
    if (!audioContextRef.current || volumeMonitoringRef.current) return;

    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();

      // Configure analyser for real-time volume detection
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      volumeMonitoringRef.current = true;

      const updateVolume = () => {
        if (!volumeMonitoringRef.current || !analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS (Root Mean Square) for better volume representation
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Normalize to 0-1 range with better sensitivity for voice
        const normalizedVolume = Math.min(1, rms / 128);

        // Apply exponential smoothing for more natural volume changes
        const smoothedVolume = normalizedVolume * 0.3 + (volumeCallbackRef.current?.lastVolume || 0) * 0.7;

        if (volumeCallbackRef.current?.callback) {
          volumeCallbackRef.current.callback(smoothedVolume);
          volumeCallbackRef.current.lastVolume = smoothedVolume;
        }

        requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (error) {
      console.error('[Volume] Error setting up volume monitoring:', error);
    }
  };

  const stopVolumeMonitoring = () => {
    volumeMonitoringRef.current = false;
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      // Just check permissions without requesting - non-intrusive
      const permission = await navigator.permissions.query({ name: 'microphone' });
      if (permission.state === 'granted') {
        setHasPermission(true);
      } else if (permission.state === 'denied') {
        setHasPermission(false);
      } else {
        setHasPermission(null); // Prompt state - will ask when needed
      }
    } catch {
      // Fallback for browsers that don't support permissions API
      setHasPermission(null); // Will request on first use
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      audioContextRef.current = new AudioContext({ sampleRate: 16000 });

      // Start volume monitoring
      startVolumeMonitoring(stream);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const reader = new FileReader();
          reader.onload = () => {
            const audioData = reader.result;

            // Try to send if WebSocket is OPEN, or if it's CONNECTING but sendMessage is available
            const canSend = wsReadyState === ReadyState.OPEN || (sendMessage && typeof sendMessage === 'function');

            if (canSend) {
              // Send audio data with additional metadata
              const message = {
                type: 'audioin',
                time: Date.now(),
                content: audioData,
                format: 'webm',
                codec: 'opus',
                sampleRate: 16000,
                channels: 1,
                encoding: 'dataurl',
              };
              sendMessage(JSON.stringify(message));
            }
          };
          reader.onerror = (error) => {
            console.error('Error reading audio data:', error);
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorderRef.current.start(100); // Send data every 100ms
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    // Stop volume monitoring
    stopVolumeMonitoring();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      mediaRecorderRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Send stop message
    const canSend = wsReadyState === ReadyState.OPEN || (sendMessage && typeof sendMessage === 'function');
    if (canSend) {
      sendMessage(
        JSON.stringify({
          type: 'audioin',
          content: 'stop',
        })
      );
    }
  };

  const handleButton = async () => {
    if (AvatarTalking) {
      sendMessage(JSON.stringify({ type: 'cmd', content: 'audio=stop' }));
      handleAvatarTalking(false);
      return;
    }

    if (muted) {
      // About to unmute - initialize VAD if needed and start
      try {
        const vad = await initializeVAD();
        if (vad) {
          await vad.start();
          setVadRunning(true);
          console.log('[VAD] VAD started successfully');
        }
        setMuted(false);
      } catch (error) {
        console.error('[VAD] Failed to initialize or start VAD:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.error('[VAD] Please allow microphone access and try again');
        }
        return;
      }
    } else {
      // About to mute - pause VAD
      if (vadRef.current) {
        try {
          vadRef.current.pause();
          setVadRunning(false);
          console.log('[VAD] VAD paused');
        } catch (error) {
          console.error('[VAD] Failed to pause VAD:', error);
        }
      }
      setMuted(true);

      // Stop any ongoing recording
      setUserTalking(false);
      stopRecording();
    }
  };

  const handleAvatarTalking = (isTalking) => {
    setAvatarTalking(isTalking);
    if (isTalking) {
      if (vadRef.current && vadRunning) {
        vadRef.current.pause();
        setVadRunning(false);
      }
      setupAvatarVolumeMonitoring();
    } else {
      if (!muted && vadRef.current) {
        vadRef.current.start();
        setVadRunning(true);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    handleAvatarTalking,
    setVADMode: async (enabled) => {
      if (enabled) {
        try {
          const vad = await initializeVAD();
          if (vad && wsReadyState === ReadyState.OPEN) {
            await vad.start();
            setVadRunning(true);
            console.log('[VAD] VAD mode enabled successfully');
          }
          setMuted(false);
        } catch {
          console.error('[VAD] Cannot enable VAD mode: VAD initialization failed');
          return;
        }
      } else {
        // Disable VAD mode
        setMuted(true);
        setUserTalking(false);
        stopRecording();
        if (vadRef.current && vadRunning) {
          try {
            vadRef.current.pause();
            setVadRunning(false);
            console.log('[VAD] VAD mode disabled');
          } catch {
            console.error('[VAD] Failed to pause VAD');
          }
        }
      }
    },
    toggleMute: async (shouldMute) => {
      if (!shouldMute) {
        try {
          const vad = await initializeVAD();
          if (vad && wsReadyState === ReadyState.OPEN) {
            await vad.start();
            setVadRunning(true);
          }
        } catch {
          console.error('[VAD] Cannot unmute: VAD initialization failed');
          return;
        }
      }

      setMuted(shouldMute);
      if (shouldMute) {
        setUserTalking(false);
        stopRecording();
        if (vadRef.current && vadRunning) {
          try {
            vadRef.current.pause();
            setVadRunning(false);
          } catch {
            console.error('[VAD] Failed to pause VAD');
          }
        }
      }
    },
    setVADStateCallback: () => {
      // This will be implemented when we add the callback refs
    },
    setVolumeCallback: (callback) => {
      // Store the volume callback function
      volumeCallbackRef.current = {
        callback: callback,
        lastVolume: 0,
      };
    },
  }));

  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      // Cleanup volume monitoring
      stopVolumeMonitoring();

      // Cleanup VAD and media resources
      if (vadRef.current) {
        try {
          vadRef.current.destroy();
        } catch (error) {
          console.error('[VAD] Error destroying VAD:', error);
        }
        vadRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  if (hasPermission === false) {
    return (
      <Alert variant="warning" className="mb-2">
        Microphone access denied. Please enable microphone permissions in your browser settings and refresh the page.
      </Alert>
    );
  }

  return (
    <div className="d-flex justify-content-center mb-2">
      <Button
        variant={userTalking ? 'danger' : 'outline-primary'}
        onClick={handleButton}
        disabled={wsReadyState !== ReadyState.OPEN}
        title={muted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {muted ? <MicMute /> : <Mic />}
        {AvatarTalking ? <ChatDots /> : ''}
      </Button>
    </div>
  );
});

export default MicrophoneStreamer;
