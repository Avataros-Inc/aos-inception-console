import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col, Form, Card, Spinner, Alert, Modal } from 'react-bootstrap';
import { SendFill, Wifi, WifiOff, Broadcast } from 'react-bootstrap-icons';
import { getRenderJob, insertRenderJob, getSessionToken, API_BASE_URL } from './postgrestAPI';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { useAvatarSession } from './contexts/AvatarSessionContext';
import { PixelStreamingWrapper } from './Components/PixelStreamingWrapper';
// import { WebSocketService } from './websocketService';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Button } from '@/Components/Button';
import { githubDarkTheme, JsonEditor } from 'json-edit-react';
import { Loader2 } from 'lucide-react';

import MicrophoneStreamer from './Components/MicStreamer';
import CameraControls from './Components/CameraControls';

const LiveStream = ({ livestreamId }) => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isAgentReady, setIsAgentReady] = useState(false);
  const [avatarTalking, setAvatarTalking] = useState('');
  const messagesEndRef = useRef(null);
  const MicRef = useRef(null);
  const { endSession } = useAvatarSession();

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
  const socketUrl = `${API_BASE_URL.replace('https:', 'wss:').replace('http:', 'ws:')}/ws`;

  // const liveStreamUrl = `ws://192.168.4.118:8080/livestream/${livestreamId}`;
  const liveStreamUrl = `${API_BASE_URL.replace('https:', 'wss:').replace('http:', 'ws:')}/livestream/${livestreamId}`;

  const { sendMessage, readyState } = useWebSocket(socketUrl, {
    // protocols: [`auth-${getSessionToken()}`, "test"],
    onOpen: () => {
      console.log('WebSocket connected to:', socketUrl);
      sendMessage(JSON.stringify({ type: 'connect', token: getSessionToken(), session: livestreamId }));
    },
    onClose: (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (event.code !== 1000) {
        console.warn('WebSocket closed unexpectedly. Code:', event.code, 'Reason:', event.reason);
      }
    },
    onError: (event) => {
      console.error('WebSocket error:', event);
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
  });

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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Memoize the initialSettings to prevent unnecessary re-renders of PixelStreamingWrapper
  const pixelStreamingSettings = useMemo(() => {
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
  }, [liveStreamUrl]);

  return (
    <Container fluid className="vh-100 p-0 d-flex flex-column">
      {/* Video Stream */}
      <Row className="flex-grow-1 m-0" style={{ position: 'relative', width: '100%', minHeight: '50vh' }}>
        <Col className="p-0 d-flex justify-content-center">
          <div className="w-full relative mb-6" style={{ aspectRatio: '16/9' }}>
            <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative overflow-hidden w-full h-full">
              {/* Connection Status Indicator */}
              <div className="absolute top-4 right-4 z-20">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
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
              </div>

              <PixelStreamingWrapper
                initialSettings={pixelStreamingSettings}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
              {!isAgentReady && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="text-center text-slate-300">
                    <Loader2 className="animate-spin text-accent-mint mb-3 mx-auto" size={32} />
                    <p className="text-lg font-medium">Initializing Interactive Agent...</p>
                    <p className="text-sm text-slate-400">Waiting for agent connection</p>
                    {readyState !== ReadyState.OPEN && (
                      <p className="text-xs text-red-400 mt-2">Connection Status: {connectionStatus}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
      <Row className="" style={{ position: 'relative' }}>
        <h2>{livestreamId}</h2>
        <CameraControls sendMessage={sendMessage} />
      </Row>

      {/* Chat Area */}
      <Row className="m-0" style={{ height: '250px' }}>
        <Col className="p-0 d-flex flex-column border-top">
          <Card.Body className="flex-grow-1 overflow-auto p-2">
            {messages.map((msg, index) => (
              <div key={index} className="mb-1">
                <small className="text-muted">{msg.user}:</small> {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </Card.Body>

          <Card.Footer className="p-2">
            <div onKeyDown={(e) => e.stopPropagation()} onKeyUp={(e) => e.stopPropagation()}>
              <Form.Group className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleClickSendMessage()}
                  placeholder="Type a message..."
                />
                <Button variant="primary" onClick={handleClickSendMessage} disabled={readyState !== ReadyState.OPEN}>
                  <SendFill />
                </Button>
                <MicrophoneStreamer
                  ref={MicRef}
                  wsReadyState={readyState}
                  sendMessage={sendMessage}
                  ReadyState={ReadyState}
                />
              </Form.Group>

              <div className="text-end mt-1">
                <small
                  className={`flex items-center gap-1 justify-end ${
                    readyState === ReadyState.OPEN ? 'text-success' : 'text-danger'
                  }`}
                >
                  {readyState === ReadyState.OPEN ? <Wifi size={14} /> : <WifiOff size={14} />}
                  <span>{connectionStatus}</span>
                </small>
                &nbsp;
                <Button onClick={() => endSession()} variant="secondary" size="sm">
                  End Session
                </Button>
              </div>
            </div>
          </Card.Footer>
        </Col>
      </Row>
    </Container>
  );
};

const LiveStreamPage = () => {
  const { config } = useConfig();
  const { activeSession, endSession } = useAvatarSession();
  const selectedAvatar = activeSession?.avatar;
  const [status, setStatus] = useState('checking_storage');
  const [livestreamId, setLivestreamId] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Checking for existing livestream...');

  const recheckTime = 500;

  // Check for existing livestream on mount
  useEffect(() => {
    const storedLivestream = localStorage.getItem('current_livestream');

    if (
      storedLivestream &&
      typeof storedLivestream === 'string' &&
      storedLivestream !== 'undefined' &&
      storedLivestream.includes('-')
    ) {
      setLivestreamId(storedLivestream);
      setStatus('checking_readiness');
      setLoadingMessage('Verifying livestream status...');
    } else {
      setStatus('needs_request');
      setLoadingMessage('No active livestream found');
    }
  }, []);

  // Poll livestream readiness when we have an ID
  useEffect(() => {
    if (status !== 'checking_readiness' || !livestreamId) return;

    const checkLivestream = async () => {
      try {
        const renderjob = await getRenderJob(livestreamId);
        if (renderjob === undefined) {
          localStorage.removeItem('current_livestream');
          window.location.reload();
        } else if (renderjob.ended_at !== null) {
          localStorage.removeItem('current_livestream');
          window.location;
        } else if (renderjob.jobstatus === 1) {
          setStatus('ready');
        } else if (renderjob.jobstatus >= 6) {
          setLoadingMessage('Waiting streaming client');
          setTimeout(checkLivestream, recheckTime);
        } else if (renderjob.jobstatus === 2 || renderjob.jobstatus === 4) {
          setLoadingMessage('Streaming finished');
          localStorage.removeItem('current_livestream');
          setStatus('needs_request');
        } else {
          setTimeout(checkLivestream, recheckTime);
        }
      } catch (error) {
        console.error('Error checking livestream:', error);
        setTimeout(checkLivestream, recheckTime);
      }
    };

    const timer = setTimeout(checkLivestream, recheckTime);
    return () => clearTimeout(timer);
  }, [status, livestreamId]);

  const requestLivestream = async () => {
    setStatus('requesting');
    setLoadingMessage('Requesting new livestream...');

    try {
      const renderJob = await insertRenderJob('live', config);

      localStorage.setItem('current_livestream', renderJob);
      setLivestreamId(renderJob);
      setStatus('checking_readiness');
      setLoadingMessage('Livestream created, verifying status...');
    } catch (error) {
      console.error('Error requesting livestream:', error);
      setStatus('needs_request');
      setLoadingMessage('Failed to create livestream. Please try again.');
    }
  };

  if (status === 'ready') {
    // return <Alert variant="success">Ready!</Alert>;
    return <LiveStream livestreamId={livestreamId} />;
  }

  return (
    <div className="relative mr-[480px] overflow-hidden">
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
                    {activeSession && (
                      <p className="text-slate-400 text-xs">
                        Started: {new Date(activeSession.startTime).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {activeSession && (
              <Button
                variant="secondary"
                onClick={async () => {
                  if (confirm('Are you sure you want to end the current session?')) {
                    try {
                      await endSession();
                    } catch (error) {
                      console.error('Failed to end session:', error);
                      alert('Failed to end session. Please try again.');
                    }
                  }
                }}
              >
                End Session
              </Button>
            )}
          </div>
        </div>

        {/* Empty window placeholder for livestream */}
        <div className="w-full relative mb-6">
          <div
            className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative overflow-hidden"
            style={{ paddingBottom: '56.25%' }} // 16:9 Aspect Ratio
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400 flex items-center gap-6">
                <Broadcast size={48} />
                <div className="text-left">
                  <p className="text-lg mb-2">{loadingMessage}</p>
                  <div className="flex items-center gap-3">
                    {status === 'needs_request' && (
                      <Button variant="primary" onClick={requestLivestream} disabled={status === 'requesting'}>
                        {status === 'requesting' ? 'Requesting...' : 'Create Livestream'}
                      </Button>
                    )}
                    {status !== 'needs_request' && (
                      <>
                        <p className="text-sm text-slate-500 mb-0">Session: {livestreamId}</p>
                        <Button onClick={() => endSession()} variant="secondary" size="sm">
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
      <ConfigSidebar visual voice a2f llm />
    </div>
  );
};

// const LiveStreamPage = () => {

// };

export default LiveStreamPage;
