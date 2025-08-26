import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
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
  const volumeMonitoringRef = useRef(false); // Track if volume monitoring is active
  const sharedStreamRef = useRef(null); // Shared media stream to avoid conflicts
  const preTriggerRef = useRef(false); // Track if pre-trigger is active
  const volumeHistoryRef = useRef([]); // Volume history for trend analysis
  const preRecordingTimeoutRef = useRef(null); // Timeout for pre-recording cleanup

  // Get or create a shared media stream to avoid conflicts
  const getSharedStream = useCallback(async () => {
    if (sharedStreamRef.current && sharedStreamRef.current.active) {
      return sharedStreamRef.current;
    }

    try {
      sharedStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      return sharedStreamRef.current;
    } catch (error) {
      console.error('[Stream] Error creating shared stream:', error);
      throw error;
    }
  }, []);

  const cleanupSharedStream = () => {
    if (sharedStreamRef.current) {
      sharedStreamRef.current.getTracks().forEach((track) => track.stop());
      sharedStreamRef.current = null;
    }
  };

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
              // Clear any pre-recording timeout since VAD has confirmed speech
              if (preRecordingTimeoutRef.current) {
                clearTimeout(preRecordingTimeoutRef.current);
                preRecordingTimeoutRef.current = null;
              }

              setUserTalking(true);
              // Start recording if not already started by pre-trigger
              if (!preTriggerRef.current) {
                startRecording();
              }
              preTriggerRef.current = false; // Reset pre-trigger flag
            }
          },
          onSpeechEnd: () => {
            setUserTalking(false);
            stopRecording();
            preTriggerRef.current = false; // Reset pre-trigger flag
            volumeHistoryRef.current = []; // Clear volume history for clean start
          },
        });

        // Don't start volume monitoring here - let MicVAD handle its own audio processing
        // Volume monitoring will be started only when we begin recording
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
              // Clear any pre-recording timeout since VAD has confirmed speech
              if (preRecordingTimeoutRef.current) {
                clearTimeout(preRecordingTimeoutRef.current);
                preRecordingTimeoutRef.current = null;
              }

              setUserTalking(true);
              // Start recording if not already started by pre-trigger
              if (!preTriggerRef.current) {
                startRecording();
              }
              preTriggerRef.current = false; // Reset pre-trigger flag
            }
          },
          onSpeechEnd: () => {
            setUserTalking(false);
            stopRecording();
            preTriggerRef.current = false; // Reset pre-trigger flag
            volumeHistoryRef.current = []; // Clear volume history for clean start
          },
        });

        // Don't start volume monitoring here either - avoid conflicts with MicVAD's AudioContext
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

  // Volume-based pre-trigger to start recording before VAD detects speech
  const handleVolumePreTrigger = useCallback(
    (volume, bandIntensities) => {
      // Only process pre-trigger if not muted, VAD is running, and we're not already recording
      if (muted || !vadRunning || userTalking || preTriggerRef.current) {
        return;
      }

      // Add current volume to history for trend analysis
      volumeHistoryRef.current.push(volume);

      // Keep only the last 10 volume readings (about 0.5-1 second of history)
      if (volumeHistoryRef.current.length > 10) {
        volumeHistoryRef.current.shift();
      }

      // Calculate volume trend (is volume increasing?)
      let trend = 0;
      if (volumeHistoryRef.current.length >= 3) {
        const recent = volumeHistoryRef.current.slice(-3);
        for (let i = 1; i < recent.length; i++) {
          trend += recent[i] - recent[i - 1];
        }
      }

      // Pre-trigger thresholds
      const volumeThreshold = 0.15; // Lower threshold for volume detection
      const trendThreshold = 0.05; // Positive trend indicating rising volume
      const voiceFrequencyThreshold = 0.08; // Activity in voice-relevant frequencies

      // Check if we have voice-like frequency activity (bands 1-6 are most important for speech)
      const voiceActivity = bandIntensities.slice(1, 7).reduce((sum, intensity) => sum + intensity, 0) / 6;

      // Trigger pre-recording if:
      // 1. Volume exceeds threshold AND shows rising trend, OR
      // 2. Strong voice frequency activity is detected
      const shouldPreTrigger =
        (volume > volumeThreshold && trend > trendThreshold) || voiceActivity > voiceFrequencyThreshold;

      if (shouldPreTrigger) {
        preTriggerRef.current = true;

        // Call startRecording asynchronously to avoid dependency issues
        setTimeout(() => {
          if (mediaRecorderRef.current === null || mediaRecorderRef.current.state === 'inactive') {
            // Trigger recording start by simulating the same logic as startRecording
            getSharedStream()
              .then((stream) => {
                if (preTriggerRef.current) {
                  mediaRecorderRef.current = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus',
                  });
                  audioChunksRef.current = [];

                  mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        const audioData = reader.result;
                        const canSend =
                          wsReadyState === ReadyState.OPEN || (sendMessage && typeof sendMessage === 'function');

                        if (canSend) {
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

                  mediaRecorderRef.current.start(100);
                }
              })
              .catch((err) => {
                console.error('Error starting pre-trigger recording:', err);
              });
          }
        }, 0);

        // Set a timeout to stop pre-recording if VAD doesn't confirm speech within reasonable time
        preRecordingTimeoutRef.current = setTimeout(() => {
          if (preTriggerRef.current && !userTalking) {
            preTriggerRef.current = false;
            volumeHistoryRef.current = []; // Clear volume history

            // Stop recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
              mediaRecorderRef.current = null;
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
          }
        }, 3000); // 3 second timeout
      }
    },
    [muted, vadRunning, userTalking, wsReadyState, sendMessage, getSharedStream, ReadyState.OPEN]
  );

  // Alternative volume monitoring that doesn't use AudioContext (for VAD compatibility)
  const startSimpleVolumeMonitoring = useCallback(() => {
    // Simplified volume monitoring that doesn't conflict with VAD
    // This can be used when VAD is active and we still want basic volume feedback
    if (volumeCallbackRef.current?.callback) {
      const mockVolume = userTalking ? Math.random() * 0.3 + 0.2 : 0.05; // Reduced mock noise

      // Create realistic voice-like frequency band patterns instead of random
      const mockBands = new Array(12).fill(0).map((_, i) => {
        if (!userTalking) return 0.02; // Very low baseline when not talking

        // Create voice-like frequency distribution
        // Lower frequencies (0-3) should be stronger for fundamental/harmonics
        // Mid frequencies (4-7) moderate for formants
        // Higher frequencies (8-11) weaker but present
        const voicePattern = [0.8, 0.9, 0.7, 0.6, 0.5, 0.4, 0.3, 0.4, 0.2, 0.15, 0.1, 0.05];
        const baseIntensity = voicePattern[i] || 0.1;

        // Add slight variation but keep it stable
        const variation = (Math.random() - 0.5) * 0.1;
        return Math.max(0.02, baseIntensity * mockVolume + variation);
      });

      volumeCallbackRef.current.callback(mockVolume, mockBands);
    }
  }, [userTalking]);

  // Real-time volume monitoring using a separate AudioContext for display purposes only
  const startRealVolumeMonitoring = useCallback(async () => {
    if (volumeMonitoringRef.current) return;

    try {
      // Create a separate stream just for volume monitoring to avoid conflicts
      const volumeStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // Disable processing to get raw volume levels
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create a separate AudioContext specifically for volume monitoring
      const volumeAudioContext = new AudioContext();
      const source = volumeAudioContext.createMediaStreamSource(volumeStream);
      const analyser = volumeAudioContext.createAnalyser();

      // Configure analyser for real-time volume detection with heavy noise reduction
      analyser.fftSize = 512; // Increased for better frequency resolution
      analyser.smoothingTimeConstant = 0.9; // Maximum smoothing

      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      volumeMonitoringRef.current = true;

      const updateVolume = () => {
        if (!volumeMonitoringRef.current) {
          // Cleanup when stopping
          volumeStream.getTracks().forEach((track) => track.stop());
          volumeAudioContext.close();
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        analyser.getByteFrequencyData(frequencyData);

        // Calculate RMS (Root Mean Square) for better volume representation
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Normalize to 0-1 range with noise gate and better sensitivity for voice
        const noiseGate = 25; // Increased noise gate threshold even more
        const adjustedRms = Math.max(0, rms - noiseGate);
        const normalizedVolume = Math.min(1, adjustedRms / 95); // Further reduced sensitivity

        // Apply very heavy exponential smoothing for more natural volume changes
        const smoothedVolume = normalizedVolume * 0.05 + (volumeCallbackRef.current?.lastVolume || 0) * 0.95;

        // Process frequency data for voice visualization
        const sampleRate = volumeAudioContext.sampleRate;
        const nyquist = sampleRate / 2;
        const frequencyBinSize = nyquist / frequencyData.length;

        // Define voice-relevant frequency ranges
        const frequencyBands = [
          { min: 80, max: 150, weight: 1.2 }, // Fundamental frequency (bass)
          { min: 150, max: 300, weight: 1.4 }, // Low harmonics
          { min: 300, max: 600, weight: 1.5 }, // Mid-low harmonics
          { min: 600, max: 1200, weight: 1.6 }, // Mid harmonics
          { min: 1200, max: 2000, weight: 1.4 }, // Upper mid
          { min: 2000, max: 3000, weight: 1.3 }, // Formant region
          { min: 3000, max: 4000, weight: 1.2 }, // Upper formants
          { min: 4000, max: 6000, weight: 1.0 }, // Brightness
          { min: 6000, max: 8000, weight: 0.9 }, // High frequencies
          { min: 8000, max: 12000, weight: 0.8 }, // Very high frequencies
          { min: 12000, max: 16000, weight: 0.7 }, // Ultra high
          { min: 16000, max: 20000, weight: 0.6 }, // Top range
        ];

        // Calculate intensity for each frequency band
        const bandIntensities = frequencyBands.map((band) => {
          const startBin = Math.floor(band.min / frequencyBinSize);
          const endBin = Math.floor(band.max / frequencyBinSize);

          let bandSum = 0;
          let count = 0;

          for (let i = startBin; i <= endBin && i < frequencyData.length; i++) {
            bandSum += frequencyData[i];
            count++;
          }

          const avgIntensity = count > 0 ? bandSum / count : 0;
          const noiseThreshold = 12; // Higher noise threshold for frequency bands
          const adjustedIntensity = Math.max(0, avgIntensity - noiseThreshold);
          const normalized = Math.min(1, (adjustedIntensity / 220) * band.weight); // Further reduced sensitivity

          // Apply very heavy smoothing per band
          const prevIntensity = volumeCallbackRef.current?.bandIntensities?.[frequencyBands.indexOf(band)] || 0;
          return normalized * 0.08 + prevIntensity * 0.92;
        });

        if (volumeCallbackRef.current?.callback) {
          volumeCallbackRef.current.callback(smoothedVolume, bandIntensities);
          volumeCallbackRef.current.lastVolume = smoothedVolume;
          volumeCallbackRef.current.bandIntensities = bandIntensities;
        }

        // Volume-based pre-trigger for faster speech detection
        handleVolumePreTrigger(smoothedVolume, bandIntensities);

        requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (error) {
      console.error('[Volume] Error setting up real volume monitoring:', error);
      // Fall back to simple monitoring if real monitoring fails
      startSimpleVolumeMonitoring();
    }
  }, [startSimpleVolumeMonitoring, handleVolumePreTrigger]);

  const stopVolumeMonitoring = () => {
    volumeMonitoringRef.current = false;
    // The cleanup will be handled by the updateVolume function when volumeMonitoringRef becomes false
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

  const startRecording = useCallback(async () => {
    try {
      // Use the shared stream instead of creating a new one
      const stream = await getSharedStream();

      // Skip volume monitoring setup when VAD is running to avoid AudioContext conflicts
      // VAD handles its own audio processing, so we don't need duplicate monitoring
      console.log('[Recording] Starting recording with separate volume monitoring');

      // Use real volume monitoring with a separate stream/context to avoid conflicts
      await startRealVolumeMonitoring();

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
  }, [wsReadyState, ReadyState.OPEN, sendMessage, getSharedStream, startRealVolumeMonitoring]);

  const stopRecording = useCallback(() => {
    // Don't stop volume monitoring here as it's shared
    // Volume monitoring will be stopped when the component unmounts

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Don't stop the stream tracks as they're shared
      mediaRecorderRef.current = null;
    }
    // Don't close AudioContext here as it might be used for volume monitoring
    // AudioContext will be cleaned up in the component unmount

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
  }, [wsReadyState, ReadyState.OPEN, sendMessage]);

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
        bandIntensities: new Array(12).fill(0),
      };
    },
  }));

  useEffect(() => {
    checkMicrophonePermission();

    // Store refs at the start of the effect to avoid stale closures
    const audioContextRefCurrent = audioContextRef;

    return () => {
      // Cleanup pre-trigger timeout
      if (preRecordingTimeoutRef.current) {
        clearTimeout(preRecordingTimeoutRef.current);
        preRecordingTimeoutRef.current = null;
      }

      // Cleanup volume monitoring
      stopVolumeMonitoring();

      // Cleanup shared stream
      cleanupSharedStream();

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
        // Don't stop stream tracks here as they're handled by cleanupSharedStream
      }

      // Use stored reference to avoid stale closure
      if (audioContextRefCurrent.current) {
        audioContextRefCurrent.current.close();
      }
    };
  }, []);

  // Start volume monitoring when not muted (for UI feedback)
  useEffect(() => {
    if (!muted && !volumeMonitoringRef.current) {
      startRealVolumeMonitoring().catch((error) => {
        console.error('[Volume] Failed to start volume monitoring:', error);
      });
    } else if (muted && volumeMonitoringRef.current) {
      stopVolumeMonitoring();
    }
  }, [muted, startRealVolumeMonitoring]);

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
