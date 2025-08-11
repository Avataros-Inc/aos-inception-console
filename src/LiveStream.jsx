import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col, Form, Card, Spinner, Alert } from 'react-bootstrap';
import { SendFill, Wifi, WifiOff, Broadcast } from 'react-bootstrap-icons';
import { getRenderJob, insertRenderJob, getSessionToken, updateRenderJob, API_BASE_URL } from './postgrestAPI';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { PixelStreamingWrapper } from './Components/PixelStreamingWrapper';
// import { WebSocketService } from './websocketService';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Button } from '@/Components/Button';
import { githubDarkTheme, JsonEditor } from 'json-edit-react';
import { Loader2 } from 'lucide-react';

import MicrophoneStreamer from './Components/MicStreamer';
import CameraControls from './Components/CameraControls';

const handleEndSession = async (jobId) => {
  try {
    await updateRenderJob(jobId, { jobstatus: 2, ended_at: 'NOW()' });
    localStorage.removeItem('current_livestream');
    window.location.reload();
  } catch (error) {
    alert(`Failed to end session: ${error.message}`);
  }
};

const LiveStream = ({ livestreamId }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [AvatarTalking, setAvatarTalking] = useState(false);
  const [isAgentReady, setIsAgentReady] = useState(false);
  const messagesEndRef = useRef(null);

  const MicRef = useRef();

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
      sendMessage(JSON.stringify({ type: 'connect', token: getSessionToken(), session: livestreamId }));
    },
    onMessage: (message) => {
      const data = JSON.parse(message.data);
      if (data.type === 'error') {
        console.log('Error: ', data.content);
        return;
      }
      console.log('Message: ', data);

      // Set agent as ready on first meaningful message from server
      if (!isAgentReady && data.type !== 'error') {
        console.log('Agent ready - first message received:', data.type);
        setIsAgentReady(true);
      }

      if (data.type === 'textout') {
        setMessages((prevMessages) => [...prevMessages, { user: 'assistant', text: data.content }]);
      } else if (data.type === 'textin') {
        setMessages((prevMessages) => [...prevMessages, { user: 'You', text: data.content }]);
      } else if (data.type === 'avatarTalking') {
        setAvatarTalking(data.content);
        if (MicRef.current) {
          MicRef.current.handleAvatarTalking(data.content);
        }
      } else {
        console.log('Unknown message type: ', data);
      }
    },

    shouldReconnect: () => true,
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
        console.log('Agent ready - WebSocket connection stable');
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
  const pixelStreamingSettings = useMemo(
    () => ({
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
      PreferredCodec: 'H264',
      WebRTCMinBitrate: 1000,
      WebRTCMaxBitrate: 20000,
      WebRTCFPS: 60,
      SuppressBrowserKeys: true,
      UseMic: false,
      OfferToReceive: false,
      HideUI: true,
      // ForceTURN: true
    }),
    [liveStreamUrl]
  );

  return (
    <Container fluid className="vh-100 p-0 d-flex flex-column">
      {/* Video Stream */}
      <Row className="flex-grow-1 m-0" style={{ position: 'relative', width: '100%', minHeight: '50vh' }}>
        <Col className="p-0 d-flex justify-content-center">
          <div className="w-full relative mb-6" style={{ aspectRatio: '16/9' }}>
            <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative overflow-hidden w-full h-full">
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
                <small className={readyState !== ReadyState.OPEN ? 'text-success' : 'text-danger'}>
                  {ReadyState.OPEN ? <Wifi /> : <WifiOff />}
                  {connectionStatus}
                </small>
                &nbsp;
                <Button onClick={() => handleEndSession(livestreamId)} variant="danger" size="sm">
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
        <h2 className="gradient-text text-3xl font-bold mb-6">Interactive Agent</h2>

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
                        <Button onClick={() => handleEndSession(livestreamId)} variant="danger" size="sm">
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
