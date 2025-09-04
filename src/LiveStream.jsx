import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Wifi, WifiOff, Broadcast, Plus, Mic, MicMute, X, Send } from 'react-bootstrap-icons';
import { getSessionToken, API_BASE_URL } from './postgrestAPI';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { useAvatarLivestream } from './contexts/AvatarLivestreamContext';
import { PixelStreamingWrapper } from './Components/PixelStreamingWrapper';
// import { WebSocketService } from './websocketService';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Button } from '@/Components/Button';
import { githubDarkTheme, JsonEditor } from 'json-edit-react';
import { Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import MicrophoneStreamer from './Components/MicStreamer';

// UIOverlay Component
const UIOverlay = ({
  messageInput,
  setMessageInput,
  handleClickSendMessage,
  readyState,
  ReadyState,
  sendMessage,
  MicRef,
}) => {
  const [isVADMode, setIsVADMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [microphoneVolume, setMicrophoneVolume] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState(new Array(12).fill(0));

  const handleVADToggle = useCallback(async () => {
    const newVADMode = !isVADMode;
    setIsVADMode(newVADMode);

    if (newVADMode) {
      // Entering VAD mode - activate microphone
      setIsMuted(false);
      if (MicRef.current) {
        await MicRef.current.setVADMode?.(true);
      }
    } else {
      // Exiting VAD mode - deactivate microphone
      setIsMuted(false);
      if (MicRef.current) {
        await MicRef.current.setVADMode?.(false);
      }
    }
  }, [isVADMode, MicRef]);

  const handleExitVAD = useCallback(async () => {
    setIsVADMode(false);
    setIsMuted(false);
    if (MicRef.current) {
      await MicRef.current.setVADMode?.(false);
    }
  }, [MicRef]);

  const handleMicClick = async () => {
    if (isVADMode) {
      // In VAD mode, toggle mute state
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (MicRef.current) {
        await MicRef.current.toggleMute?.(newMuted);
      }
    } else {
      // In typing mode, enable VAD mode and start listening
      await handleVADToggle();
    }
  };

  // Listen for VAD state changes from MicrophoneStreamer
  useEffect(() => {
    if (MicRef?.current) {
      MicRef.current.setVolumeCallback?.((volume, bands) => {
        setMicrophoneVolume(volume);
        if (bands) {
          setFrequencyBands(bands);
        }
      });
    }
  }, [MicRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape key to exit VAD mode
      if (e.key === 'Escape' && isVADMode) {
        handleExitVAD();
      }
      // Ctrl/Cmd + M to toggle VAD mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        handleVADToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVADMode, handleExitVAD, handleVADToggle]);

  // Sound wave animation component
  const SoundWaveAnimation = () => {
    const [animationFrame, setAnimationFrame] = useState(0);

    // More bars for better voice representation
    const numberOfBars = 12;
    const baseHeights = [6, 10, 14, 18, 22, 26, 28, 26, 22, 18, 14, 10];

    // Animation loop for very smooth wave movement
    useEffect(() => {
      const interval = setInterval(() => {
        setAnimationFrame((prev) => prev + 1);
      }, 150); // Much slower update for very smooth animation

      return () => clearInterval(interval);
    }, []);

    // Calculate wave heights based on frequency data and microphone volume
    const getWaveHeights = () => {
      if (isMuted) {
        // When muted, show minimal flat waves
        return new Array(numberOfBars).fill(3);
      }

      // Enhanced volume calculation with strong noise gate
      const volumeLevel = Math.max(0.02, Math.min(1, microphoneVolume * 1.8));

      // Use real frequency data when available, fallback to patterns
      return baseHeights.map((baseHeight, i) => {
        let heightMultiplier = volumeLevel;

        // Use real frequency band data if available
        if (frequencyBands && frequencyBands.length >= numberOfBars) {
          const bandIntensity = frequencyBands[i] || 0;
          // Only respond to significant frequency activity, heavily suppress noise
          const significantActivity = bandIntensity > 0.2 ? bandIntensity : bandIntensity * 0.1;
          heightMultiplier = Math.max(0.05, volumeLevel * 0.8 + significantActivity * 0.8);
        } else {
          // Fallback to stable voice-like synthetic patterns
          // Create frequency-specific patterns that mimic voice characteristics
          const lowFreqPattern = Math.sin(animationFrame * 0.06 + i * 0.4) * 0.1;
          const midFreqPattern = Math.sin(animationFrame * 0.08 + i * 0.6) * 0.08;
          const highFreqPattern = Math.sin(animationFrame * 0.04 + i * 0.3) * 0.05;

          // Weight patterns based on typical voice frequency distribution
          const voiceWeights = [0.8, 0.9, 0.7, 0.6, 0.5, 0.4, 0.3, 0.4, 0.2, 0.15, 0.1, 0.05];
          const voiceWeight = voiceWeights[i] || 0.1;

          heightMultiplier = volumeLevel * (voiceWeight + lowFreqPattern + midFreqPattern + highFreqPattern);
        }

        // Reduce random variation for much smoother appearance
        const randomVariation = (Math.random() - 0.5) * 0.02;
        const finalHeight = Math.max(3, baseHeight * (heightMultiplier + randomVariation));

        return Math.min(24, finalHeight); // Keep original max height
      });
    };

    const waveHeights = getWaveHeights();

    return (
      <div className="flex items-center justify-center gap-1.5 px-4">
        {waveHeights.map((height, i) => (
          <div
            key={i}
            className={`w-2.5 rounded-full transition-all duration-300 ease-out ${
              isMuted
                ? 'bg-white/25'
                : 'bg-gradient-to-t from-green-400/70 to-green-300/90 shadow-sm shadow-green-400/30'
            }`}
            style={{
              height: height + 'px',
              animationDelay: `${i * 50}ms`,
              transform: `scaleY(${0.98 + (frequencyBands[i] || 0) * 0.1})`,
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Floating Input Bar */}
      <div className="absolute bottom-6 w-full z-20 flex items-center justify-center">
        <div className="w-[60%] max-w-2xl">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-4 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-4">
              {/* Plus Icon */}
              <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <Plus size={18} className="text-white/70" />
              </button>

              {/* Text Input / VAD Display */}
              <div className="flex-1 relative">
                {isVADMode ? (
                  <div className="flex items-center justify-center py-1">
                    <SoundWaveAnimation />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleClickSendMessage()}
                    placeholder="Ask anything"
                    className="w-full bg-transparent text-white placeholder-white/50 focus:outline-none text-base"
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                  />
                )}
              </div>

              {/* Microphone Button */}
              <button
                onClick={handleMicClick}
                className={`p-2 rounded-full transition-colors relative ${
                  isVADMode
                    ? isMuted
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'hover:bg-white/10 text-white/70'
                }`}
                title={isVADMode ? (isMuted ? 'Unmute microphone' : 'Mute microphone') : 'Switch to voice mode'}
              >
                {isVADMode && isMuted ? <MicMute size={18} /> : <Mic size={18} />}
                {isVADMode && isMuted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-red-400 rotate-45 rounded"></div>
                  </div>
                )}
              </button>

              {/* Send Button - Only show when not in VAD mode */}
              {!isVADMode && (
                <button
                  onClick={handleClickSendMessage}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors text-white/70 hover:bg-white/20"
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              )}

              {/* Exit VAD Mode Button */}
              {isVADMode && (
                <button
                  onClick={handleExitVAD}
                  className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-colors"
                  title="Exit voice mode"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden MicrophoneStreamer for VAD functionality */}
        <div style={{ display: 'none' }}>
          <MicrophoneStreamer
            ref={MicRef}
            wsReadyState={readyState}
            sendMessage={sendMessage}
            ReadyState={ReadyState}
          />
        </div>
      </div>
    </>
  );
};

const LiveStreamInner = ({ livestreamId, onEndSession }) => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isAgentReady, setIsAgentReady] = useState(false);
  const [_avatarTalking, setAvatarTalking] = useState('');
  const [sessionValid, setSessionValid] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  const MicRef = useRef(null);

  // Get endLivestream function from context
  const { endLivestream } = useAvatarLivestream();

  // Check if the session exists and is valid before connecting
  useEffect(() => {
    const validateSession = async () => {
      if (!livestreamId) {
        setSessionError('No livestream ID provided');
        return;
      }

      try {
        console.log('Validating session:', livestreamId);
        // First check if the session exists via your API
        const response = await fetch(`${API_BASE_URL}/api/v1/live/${livestreamId}`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const sessionData = await response.json();
          console.log('Session data:', sessionData);

          // Check if session is ended
          if (sessionData.ended_at && sessionData.ended_at !== '0001-01-01T00:00:00Z') {
            setSessionError(`Session ended at ${new Date(sessionData.ended_at).toLocaleString()}`);
            setSessionValid(false);
            return;
          }

          // Check jobstatus - should be 1 for active
          if (sessionData.jobstatus !== 1) {
            setSessionError(`Session is not active (status: ${sessionData.jobstatus})`);
            setSessionValid(false);
            return;
          }

          setSessionValid(true);
          setSessionError(null);
        } else {
          const errorText = await response.text();
          console.error('Session validation failed:', response.status, errorText);
          setSessionError(`Session validation failed: ${response.status}`);
        }
      } catch (error) {
        console.error('Error validating session:', error);
        setSessionError(`Validation error: ${error.message}`);
      }
    };

    validateSession();
  }, [livestreamId]);

  // Auto-hide loading after a timeout as fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Agent ready timeout - hiding loading screen');
      setIsAgentReady(true);
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, []);

  // const socketUrl = 'http://192.168.4.118:8080/ws/'+livestreamId;
  // const socketUrl = 'ws://192.168.4.118:8082/ws';
  const token = getSessionToken();
  const socketUrl = `${API_BASE_URL.replace('https:', 'wss:').replace(
    'http:',
    'ws:'
  )}/api/v1/livestream/${livestreamId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

  // For PixelStreaming, keep this separate if needed
  const liveStreamUrl = `${API_BASE_URL.replace('https:', 'wss:').replace(
    'http:',
    'ws:'
  )}/api/v1/livestream/${livestreamId}`;

  const { sendMessage, readyState } = useWebSocket(
    sessionValid ? socketUrl : null, // Only connect if session is valid
    {
      // protocols: [`auth-${getSessionToken()}`],
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      onOpen: () => {
        console.log('WebSocket connected to:', socketUrl);
        console.log('Using token:', token ? 'Present' : 'Missing');
        console.log('Livestream ID:', livestreamId);
        // The authentication should now be handled via query parameter or headers
        // If the server expects a specific message format, send it
        // sendMessage(JSON.stringify({
        //   type: 'auth',
        //   token: token,
        //   session: livestreamId
        // }));
      },
      onClose: (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        console.log('Close event details:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type,
        });

        // Handle backend reporting job ended (status code 400)
        if (event.code === 400) {
          console.log('Backend reported job ended, clearing active job...');
          endLivestream().catch((error) => {
            console.error('Error clearing active job:', error);
          });
        } else if (event.code !== 1000) {
          console.warn('WebSocket closed unexpectedly. Code:', event.code, 'Reason:', event.reason);
        }
      },
      onError: (event) => {
        console.error('WebSocket error:', event);
        console.error('WebSocket error details:', {
          type: event.type,
          target: event.target,
          currentTarget: event.currentTarget,
          readyState: event.target?.readyState,
          url: event.target?.url,
        });

        setSessionError(`WebSocket connection failed`);
      },
      onMessage: (message) => {
        try {
          const data = JSON.parse(message.data);

          if (data.type === 'error') {
            console.log('Error: ', data.content);
            return;
          }

          // Set agent as ready on first meaningful message from server
          if (!isAgentReady && data.type !== 'error') {
            setIsAgentReady(true);
          }

          if (data.type === 'textout') {
            setMessages((prevMessages) => [...prevMessages, { user: 'assistant', text: data.content }]);
          } else if (data.type === 'textin') {
            setMessages((prevMessages) => [...prevMessages, { user: 'You', text: data.content }]);
          } else if (data.type === 'audioout') {
            // Handle audio output from server (avatar speech)
            // This might contain audio data for the avatar to speak
            // You might need to play this audio or trigger avatar animation
          } else if (data.type === 'audioin_processed') {
            // Handle processed audio input (speech-to-text result)
            setMessages((prevMessages) => [...prevMessages, { user: 'You (voice)', text: data.content }]);
          } else if (data.type === 'avatarTalking') {
            setAvatarTalking(data.content);
            if (MicRef.current) {
              MicRef.current.handleAvatarTalking(data.content);
            }
          } else {
            console.log('Unknown message type: ', data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, 'Raw message:', message.data);
        }
      },

      shouldReconnect: (closeEvent) => {
        // Don't reconnect if backend reported job ended (status code 400)
        if (closeEvent.code === 400) {
          return false;
        }
        // Only reconnect if it wasn't a normal closure
        return closeEvent.code !== 1000;
      },
      reconnectAttempts: 5,
      reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 30000), // Exponential backoff, max 30s
      heartbeat: {
        message: 'ping',
        returnMessage: 'pong',
        timeout: 60000,
        interval: 25000,
      },
    }
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  // Also set agent ready when websocket connection is stable
  useEffect(() => {
    if (readyState === ReadyState.OPEN && !isAgentReady) {
      // Wait a short moment for potential messages, then show as ready
      const timer = setTimeout(() => {
        setIsAgentReady(true);
      }, 3000); // 3 seconds after connection opens

      return () => clearTimeout(timer);
    }
  }, [readyState, isAgentReady]);

  const handleClickSendMessage = () => {
    sendMessage(JSON.stringify({ type: 'textin', content: messageInput }));
    setMessages((prevState) => [...prevState, { user: 'You', text: messageInput }]);
    setMessageInput('');
  };

  // Remove auto-scroll to bottom of messages - let user control scrolling
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  // Memoize the initialSettings to prevent unnecessary re-renders of PixelStreamingWrapper
  const pixelStreamingSettings = useMemo(() => {
    if (!sessionValid || sessionError) {
      return null;
    }

    return {
      ss: liveStreamUrl,
      AutoPlayVideo: true,
      AutoConnect: true,
      HoveringMouse: false,
      StartVideoMuted: false,
      WaitForStreamer: false,
      KeyboardInput: false,
      MouseInput: false,
      TouchInput: false,
      GamepadInput: false,
      XRControllerInput: false,
      MatchViewportRes: true,
      // Let PixelStreamingWrapper handle codec selection
      PreferredCodec: 'VP8', // Default to VP8 for compatibility
      WebRTCMinBitrate: 1000,
      WebRTCMaxBitrate: 20000,
      WebRTCFPS: 60,
      SuppressBrowserKeys: true,
      UseMic: false,
      OfferToReceive: false,
      HideUI: true,
      // Force TURN usage if direct connection fails
      ForceTURN: false, // Start with false, can enable if needed
      // Additional WebRTC configuration
      WebRTCIceTimeout: 10000, // 10 second timeout for ICE
      WebRTCDisconnectionTimeout: 5000, // 5 second timeout for disconnection
    };
  }, [liveStreamUrl, sessionValid, sessionError]);

  return (
    <>
      <Container fluid className="vh-100 p-0 d-flex flex-column">
        {/* Video Stream */}
        <Row className="flex-grow-1 m-0" style={{ position: 'relative', width: '100%', minHeight: '50vh' }}>
          <Col className="p-0 d-flex justify-content-center">
            <div className="w-full relative mb-6 h-full">
              <div
                className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative w-full h-full"
                style={{ minHeight: '60vh', aspectRatio: '16/9' }}
              >
                <div className="absolute z-20 p-4 w-full flex justify-between">
                  <div
                    className={`d-flex align-items-center gap-2 px-3 py-2 rounded-lg text-sm fw-medium ${
                      readyState === ReadyState.OPEN
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : readyState === ReadyState.CONNECTING
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {readyState === ReadyState.OPEN ? <Wifi size={16} /> : <WifiOff size={16} />}
                    <span>{connectionStatus}</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={onEndSession}>
                    End Session
                  </Button>
                </div>

                {pixelStreamingSettings ? (
                  <PixelStreamingWrapper
                    initialSettings={pixelStreamingSettings}
                    style={{
                      position: 'relative',
                      top: 0,
                      left: 0,
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800/50" />
                )}

                {(!sessionValid || sessionError) && (
                  <div
                    className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm d-flex align-items-center justify-content-center"
                    style={{ zIndex: 5 }}
                  >
                    <div className="text-center text-slate-300">
                      <div className="text-slate-400 mb-3">📺</div>
                      <p className="fs-6 fw-medium">Video Stream Unavailable</p>
                      <p className="small text-slate-400">
                        {sessionError ? 'Session has ended' : 'Validating session...'}
                      </p>
                    </div>
                  </div>
                )}

                {!isAgentReady && (
                  <div
                    className="absolute inset-0 top-0 start-0 w-100 h-100 bg-slate-900/80 backdrop-blur-sm d-flex align-items-center justify-content-center"
                    style={{ zIndex: 10 }}
                  >
                    <div className="text-center text-slate-300">
                      {sessionError ? (
                        <>
                          <div className="text-red-400 mb-3">⚠️</div>
                          <p className="fs-5 fw-medium text-red-400">Session Error</p>
                          <p className="small text-red-300">{sessionError}</p>
                          <p className="small text-slate-400 mt-2">WebSocket connection status: {connectionStatus}</p>
                          <div className="mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => (window.location.hash = '/console/conversational-ai')}
                            >
                              Create New Session
                            </Button>
                          </div>
                        </>
                      ) : !sessionValid ? (
                        <>
                          <Loader2 className="animate-spin text-accent-mint mb-3 mx-auto" size={32} />
                          <p className="fs-5 fw-medium">Validating Session...</p>
                          <p className="small text-slate-400">Checking session: {livestreamId}</p>
                        </>
                      ) : (
                        <>
                          <Loader2 className="animate-spin text-accent-mint mb-3 mx-auto" size={32} />
                          <p className="fs-5 fw-medium">Initializing Interactive Agent...</p>
                          <p className="small text-slate-400">Waiting for agent connection</p>
                          {readyState !== ReadyState.OPEN && (
                            <p className="text-red-400 small mt-2">Connection Status: {connectionStatus}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* UI Overlay - Floating Input */}
                <UIOverlay
                  messageInput={messageInput}
                  setMessageInput={setMessageInput}
                  handleClickSendMessage={handleClickSendMessage}
                  readyState={readyState}
                  ReadyState={ReadyState}
                  sendMessage={sendMessage}
                  MicRef={MicRef}
                />
              </div>
            </div>
          </Col>
        </Row>

        {/* Chat History Below Video */}
        <Row className="m-0" style={{ height: '25vh' }}>
          <Col className="p-1">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 h-100">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="text-white mb-0 fw-medium">Chat History</h5>
                <div className="d-flex align-items-center gap-2 small">
                  <div
                    className={`rounded-circle ${readyState === ReadyState.OPEN ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ width: '8px', height: '8px' }}
                  ></div>
                  <span className="text-white/60">{readyState === ReadyState.OPEN ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              <div className="overflow-auto pe-2" style={{ height: 'calc(100% - 60px)' }}>
                {messages.map((msg, index) => (
                  <div key={index} className="small mb-2">
                    <span className="text-white/60 fw-medium">{msg.user}:</span>
                    <span className="text-white/90 ms-2">{msg.text}</span>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-white/40 small fst-italic text-center py-4">
                    No messages yet. Start a conversation!
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <ConfigSidebar visual voice a2f llm isLiveSession sendMessage={sendMessage} />
    </>
  );
};

const LiveStreamWithSidebar = ({ livestreamId, onEndSession }) => {
  return (
    <div className="relative w-full h-full">
      <div className="relative w-full">
        <LiveStreamInner livestreamId={livestreamId} onEndSession={onEndSession} />
      </div>
      {/* End Session button now handled inside video area */}
    </div>
  );
};

const LiveStreamPage = () => {
  const { config } = useConfig();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const {
    activeLivestream,
    endLivestream,
    livestreamStatus,
    livestreamId,
    loadingMessage,
    launchLivestream,
    connectToExistingSession,
  } = useAvatarLivestream();
  const selectedAvatar = activeLivestream?.config?.avatar;

  // Effect to handle URL-based session connection
  useEffect(() => {
    console.log('LiveStream: URL effect triggered - sessionId:', sessionId, 'livestreamId:', livestreamId);

    if (sessionId && sessionId !== livestreamId) {
      // Try to connect to the session specified in the URL
      console.log('LiveStream: Connecting to existing session from URL:', sessionId);
      connectToExistingSession(sessionId);
    } else if (!sessionId && activeLivestream) {
      // If we're on base route but have an active session, clear it
      console.log('LiveStream: On base route with active session, clearing it');
      endLivestream();
    } else if (!sessionId) {
      console.log('LiveStream: On base route with no active session - ready to create new session');
    }
  }, [sessionId, livestreamId, connectToExistingSession, activeLivestream, endLivestream]);

  // Effect to update URL when session changes
  useEffect(() => {
    if (livestreamId && !sessionId) {
      // Update URL to include the session ID as soon as we have one
      navigate(`/console/conversational-ai/${livestreamId}`, { replace: true });
    }
  }, [livestreamId, sessionId, navigate]);

  const handleRequestLivestream = () => {
    console.log('LiveStream: Requesting new livestream with config:', config);
    launchLivestream(config);
  };

  const handleCreateNewSession = () => {
    console.log('LiveStream: Creating new session - navigating to base route');
    // Navigate to base route without session ID to allow creating new sessions
    navigate('/console/conversational-ai');
  };

  const handleEndSession = async () => {
    console.log('LiveStream: Ending session and navigating to base route');
    await endLivestream();
    // Navigate back to base route to allow creating new sessions
    navigate('/console/conversational-ai');
  };

  // Always show sidebar except when in active streaming mode
  const showSidebar = livestreamStatus !== 'ready';
  const isInStreamingMode = livestreamStatus === 'ready';

  if (isInStreamingMode) {
    return <LiveStreamWithSidebar livestreamId={livestreamId} onEndSession={handleEndSession} />;
  }

  // For loading/waiting states, show full width with sidebar space when sidebar is visible
  return (
    <div className={`relative ${showSidebar ? 'pr-[480px]' : ''} overflow-hidden w-full h-full`}>
      <div className="relative w-full overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="gradient-text text-3xl font-bold">Interactive Agent</h2>
              {selectedAvatar && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent-mint rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-text-secondary">
                      Active Session: <span className="text-accent-mint font-medium">{selectedAvatar.name}</span>
                    </p>
                    {activeLivestream && (
                      <>
                        <p className="text-slate-400 text-xs">
                          Started: {new Date(activeLivestream.created_at).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-400 text-xs">Session ID: {livestreamId}</p>
                          <button
                            onClick={() => {
                              const sessionUrl = `${window.location.origin}${window.location.pathname}#/console/conversational-ai/${livestreamId}`;
                              navigator.clipboard.writeText(sessionUrl);
                            }}
                            className="text-xs text-slate-400 hover:text-accent-mint transition-colors"
                            title="Copy session URL"
                          >
                            📋
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {activeLivestream && (
              <Button variant="secondary" onClick={handleEndSession}>
                End Session
              </Button>
            )}
          </div>
        </div>

        {/* Empty window placeholder for livestream */}
        <div className="w-full relative mb-6">
          <div
            className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative overflow-hidden transition-all duration-300"
            style={{ paddingBottom: '56.25%' }} // 16:9 Aspect Ratio
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400 flex items-center gap-6">
                <Broadcast
                  size={48}
                  className={
                    livestreamStatus === 'session_ended'
                      ? 'text-red-400'
                      : livestreamStatus === 'session_not_found'
                      ? 'text-yellow-400'
                      : livestreamStatus === 'connection_error'
                      ? 'text-red-400'
                      : 'text-slate-400'
                  }
                />
                <div className="text-left">
                  <p
                    className={`text-lg mb-2 ${
                      livestreamStatus === 'session_ended'
                        ? 'text-red-300'
                        : livestreamStatus === 'session_not_found'
                        ? 'text-yellow-300'
                        : livestreamStatus === 'connection_error'
                        ? 'text-red-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {!sessionId && livestreamStatus === 'needs_request'
                      ? 'Ready to create a new session'
                      : loadingMessage}
                  </p>
                  <div className="flex items-center gap-3">
                    {livestreamStatus === 'needs_request' && (
                      <Button
                        variant="primary"
                        onClick={handleRequestLivestream}
                        disabled={livestreamStatus === 'requesting'}
                      >
                        {livestreamStatus === 'requesting' ? 'Requesting...' : 'Create Livestream'}
                      </Button>
                    )}
                    {(livestreamStatus === 'session_ended' ||
                      livestreamStatus === 'session_not_found' ||
                      livestreamStatus === 'connection_error') &&
                      sessionId && (
                        <>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm text-slate-500 mb-0">Session: {sessionId}</p>
                            {livestreamStatus === 'session_ended' && (
                              <p className="text-xs text-red-400">This session has ended</p>
                            )}
                            {livestreamStatus === 'session_not_found' && (
                              <p className="text-xs text-yellow-400">Session not found or invalid</p>
                            )}
                            {livestreamStatus === 'connection_error' && (
                              <p className="text-xs text-red-400">Connection error occurred</p>
                            )}
                          </div>
                          <Button variant="primary" onClick={handleCreateNewSession} size="sm">
                            Create New Session
                          </Button>
                        </>
                      )}
                    {(livestreamStatus === 'session_ended' ||
                      livestreamStatus === 'session_not_found' ||
                      livestreamStatus === 'connection_error') &&
                      !sessionId && (
                        <Button variant="primary" onClick={handleRequestLivestream}>
                          Create Livestream
                        </Button>
                      )}
                    {livestreamStatus !== 'needs_request' &&
                      livestreamStatus !== 'session_ended' &&
                      livestreamStatus !== 'session_not_found' &&
                      livestreamStatus !== 'connection_error' && (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-500 mb-0">Session: {livestreamId}</p>
                            <button
                              onClick={() => {
                                const sessionUrl = `${window.location.origin}${window.location.pathname}#/console/conversational-ai/${livestreamId}`;
                                navigator.clipboard.writeText(sessionUrl);
                                // You could add a toast notification here
                              }}
                              className="text-xs text-slate-400 hover:text-accent-mint transition-colors"
                              title="Copy session URL"
                            >
                              📋
                            </button>
                          </div>
                          <Button onClick={handleEndSession} variant="secondary" size="sm">
                            End Session
                          </Button>
                        </>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-4">
          <h3 className="text-slate-300 text-xl font-bold mb-2">Configuration</h3>
          <JsonEditor
            data={config}
            collapse={false}
            rootName={false}
            restrictEdit={true}
            restrictDelete={true}
            enableClipboard={false}
            restrictAdd={true}
            theme={githubDarkTheme}
            maxWidth={'100%'}
            className="w-full"
          />
        </div>
      </div>
      {/* Show sidebar only when not waiting for streaming client */}
      {showSidebar && <ConfigSidebar visual voice a2f llm isLiveSession={false} />}
    </div>
  );
};

export default LiveStreamPage;
