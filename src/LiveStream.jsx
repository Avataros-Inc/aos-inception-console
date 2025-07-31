import React, { useState, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef(null);

  const MicRef = useRef();

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

  const handleClickSendMessage = () => {
    sendMessage(JSON.stringify({ type: 'textin', content: messageInput }));
    setMessages((prevState) => [...prevState, { user: 'You', text: messageInput }]);
    setMessageInput('');
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Container fluid className="vh-100 p-0 d-flex flex-column">
      {/* Video Stream */}
      <Row className="flex-grow-1 m-0" style={{ position: 'relative', width: '100%', minHeight: '50vh' }}>
        <Col className="p-0 d-flex justify-content-center">
          <div
            style={{
              width: '100%',
              // paddingTop: '56.25%', /* 16:9 Aspect Ratio */
              position: 'relative',
            }}
          >
            <PixelStreamingWrapper
              initialSettings={{
                ss: liveStreamUrl,
                AutoPlayVideo: true,
                AutoConnect: true,
                HoveringMouse: false,
                StartVideoMuted: false,
                WaitForStreamer: true,
                KeyboardInput: true,
                MouseInput: true,
                TouchInput: false,
                MatchViewportResolution: true,
                // ForceTurn: true
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                // height: '100%'
              }}
            />
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
        } else if (renderjob.jobstatus >= 4 && renderjob.jobstatus < 6) {
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
        {/* <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner> */}
        <p>
          <Broadcast className="me-2" />
          {loadingMessage}
        </p>

        {/* <pre>{JSON.stringify(config, null, 4)}</pre> */}

        {status === 'needs_request' && (
          <Button variant="primary" onClick={requestLivestream} disabled={status === 'requesting'}>
            {status === 'requesting' ? 'Requesting...' : 'Create Livestream'}
          </Button>
        )}
        {status !== 'needs_request' && (
          <Button onClick={() => handleEndSession(livestreamId)} variant="danger" size="sm">
            End Session
          </Button>
        )}

        <h2 className="text-slate-300 text-xl font-bold mb-2">{livestreamId}</h2>

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
