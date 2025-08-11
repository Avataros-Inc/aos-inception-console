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

  // Update muted ref whenever muted state changes
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Initialize VAD
  useEffect(() => {
    const initVAD = async () => {
      try {
        vadRef.current = await MicVAD.new({
          startOnLoad: false, // Don't start immediately, we'll control it manually
          redemptionFrames: 8,
          onSpeechStart: () => {
            // More flexible condition: allow if not muted and websocket is either OPEN or CONNECTING
            const isWebSocketReady = wsReadyState === ReadyState.OPEN || wsReadyState === ReadyState.CONNECTING;
            const currentMuted = mutedRef.current; // Use ref to get current value

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
      } catch (error) {
        console.error('[VAD] Failed to initialize VAD:', error);
      }
    };

    initVAD();

    return () => {
      if (vadRef.current) {
        vadRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setHasPermission(false);
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
      // About to unmute - start VAD
      if (vadRef.current) {
        try {
          await vadRef.current.start();
          setVadRunning(true);
        } catch (error) {
          console.error('[VAD] Failed to start VAD:', error);
        }
      }
      setMuted(false);
    } else {
      // About to mute - pause VAD
      if (vadRef.current) {
        try {
          vadRef.current.pause();
          setVadRunning(false);
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
  }));

  useEffect(() => {
    checkMicrophonePermission();
    return () => {
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
        Microphone access denied. Please enable permissions.
      </Alert>
    );
  }

  return (
    <div className="d-flex justify-content-center mb-2">
      <Button
        variant={userTalking ? 'danger' : 'outline-primary'}
        onClick={handleButton}
        disabled={wsReadyState !== ReadyState.OPEN || hasPermission === false}
      >
        {muted ? <MicMute /> : <Mic />}
        {AvatarTalking ? <ChatDots /> : ''}
        {/* {isRecording ? ' Stop Mic' : ' Start Mic'} */}
      </Button>
      {/* {AvatarTalking ? "yapping": "not yapping"} */}
    </div>
  );
});

export default MicrophoneStreamer;
