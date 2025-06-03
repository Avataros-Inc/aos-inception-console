import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { SendFill, Wifi, WifiOff, Broadcast } from 'react-bootstrap-icons';
import { getRenderJob, insertRenderJob, getSessionToken, updateRenderJob, API_BASE_URL } from './postgrestAPI';
import A2FConfigTab from './ConfigTabs/A2FConfigTab';
import VisualConfigTab from './ConfigTabs/VisualConfigTab';
import VoiceConfigTab from './ConfigTabs/VoiceConfigTab';
import LLMConfigTab from './ConfigTabs/LLMConfigTab';
import { PixelStreamingWrapper } from './Components/PixelStreamingWrapper';
// import { WebSocketService } from './websocketService';
import useWebSocket, { ReadyState } from 'react-use-websocket';

import MicrophoneStreamer from './Components/MicStreamer';
import CameraControls from './Components/CameraControls';


const handleEndSession = async (jobId) => {
  try {
    await updateRenderJob(jobId, { jobstatus: 2, ended_at: "NOW()" });
    localStorage.removeItem('current_livestream');
    window.location.reload();
  } catch (error) {
    alert(`Failed to end session: ${error.message}`);
  }
};

const LiveStream = ({ livestreamId }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [status, setStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // const socketUrl = 'http://192.168.4.118:8080/ws/'+livestreamId;
  // const socketUrl = 'ws://192.168.4.118:8082/ws';
  const socketUrl = `${API_BASE_URL.replace('https:', 'wss:').replace('http:', 'ws:')}/ws`;


  // const liveStreamUrl = `ws://192.168.4.118:8080/livestream/${livestreamId}`;
  const liveStreamUrl = `${API_BASE_URL.replace('https:', 'wss:').replace('http:', 'ws:')}/livestream/${livestreamId}`;

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
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
        setMessages(prevMessages => [...prevMessages, { user: 'assistant', text: data.content }]);
      }

      if (data.type === 'textin') {
        setMessages(prevMessages => [...prevMessages, { user: 'You', text: data.content }]);
      }

    },

    shouldReconnect: (closeEvent) => true,
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
    setMessages(prevState => [...prevState, { user: 'You', text: messageInput }]);
    setMessageInput('');
  };


  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  return (
    <Container fluid className="vh-100 p-0 d-flex flex-column">
      {/* Video Stream */}
      <Row className="flex-grow-1 m-0" style={{ position: 'relative', width:  '100%', minHeight: '50vh'  }}>
        <Col className="p-0 d-flex justify-content-center">
          <div style={{
            width: '100%',
            // paddingTop: '56.25%', /* 16:9 Aspect Ratio */
            position: 'relative'
          }}>


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
                MatchViewportResolution: true
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
        {/* <h1>Camera controls</h1> */}
        <CameraControls sendMessage={sendMessage} />
      </Row>

      {/* Chat Area */}
      <Row className="m-0" style={{ height: '250px' }}>
        <Col className="p-0 d-flex flex-column border-top">
          <Card.Body className="flex-grow-1 overflow-auto p-2">
            {messages.map((msg, index) => (
              <div key={index} className="mb-1">
                <small className="text-muted">{msg.user}:</small>{' '}
                {msg.text}
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
              <Button
                variant="primary"
                onClick={handleClickSendMessage}
                disabled={readyState !== ReadyState.OPEN}
              >
                <SendFill />
              </Button>
              <MicrophoneStreamer livestreamId={livestreamId} wsReadyState={readyState} sendMessage={sendMessage} ReadyState={ReadyState} />
            </Form.Group>





            <div className="text-end mt-1">
              <small className={readyState !== ReadyState.OPEN ? 'text-success' : 'text-danger'}>
                {ReadyState.OPEN ? <Wifi /> : <WifiOff />}
                {connectionStatus}
              </small>
              &nbsp;
              <Button onClick={() => handleEndSession(livestreamId)} variant="danger" size="sm">End Session</Button>
            </div>
          </Card.Footer>
        </Col>
      </Row>
    </Container>
  );
};


const styles = {

  rightSidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '480px',
    height: '100vh',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e9ecef',
    padding: '20px',
    overflowY: 'auto',
    zIndex: 900
  },
  mainContent: {

    // width:  '100%',
    paddingRight: '480px',

  }
};

const LiveStreamPage = ({ characters }) => {
  const [status, setStatus] = useState('checking_storage');
  const [livestreamId, setLivestreamId] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Checking for existing livestream...');

  const [config, setConfig] = useState({
    avatar: characters[0].id,
    environment: 'Map_Env_Basic_01', //TODO
    a2f_config: characters[0].a2f_config,
    voice_config: characters[0].voice_config,
    llm_config: characters[0].llm_config,
  });
  const [activeTab, setActiveTab] = useState('visual');


  const updateConfig = (key, value) => {
    if (key === 'avatar') {
      for (const character of characters) {
        if (character.id === value) {
          setConfig(prevConfig => ({
            ...prevConfig,
            [key]: value,
            a2f_config: character.a2f_config,
            voice_config: character.voice_config,
            llm_config: character.llm_config
          }));
          break;
        }
      }
    } else {
      if (key.includes('.')) {
        // Handle nested keys (like 'voice_config.voice_id.some_property')
        const keys = key.split('.');
        setConfig(prev => {
          const newConfig = { ...prev };
          let current = newConfig;

          for (let i = 0; i < keys.length - 1; i++) {
            const currentKey = keys[i];
            if (!current[currentKey]) {
              current[currentKey] = {};
            }
            current = current[currentKey];
          }

          current[keys[keys.length - 1]] = value;
          return newConfig;
        });
      } else {
        // Handle flat keys
        setConfig(prev => ({ ...prev, [key]: value }));
      }
    }
  };

  // Check for existing livestream on mount
  useEffect(() => {
    const storedLivestream = localStorage.getItem('current_livestream');

    if (storedLivestream && typeof storedLivestream === 'string' && storedLivestream !== 'undefined' && storedLivestream.includes('-')) {
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
          window.location
        } else if (renderjob.jobstatus === 1) {
          setStatus('ready');
        } else if (renderjob.jobstatus >= 6) {
          setLoadingMessage('Waiting streaming client')
          setTimeout(checkLivestream, 5000);
        } else if (renderjob.jobstatus >= 4 && renderjob.jobstatus < 6) {
          setLoadingMessage('Streaming finished');
          localStorage.removeItem('current_livestream');
          setStatus('needs_request');
        } else {
          setTimeout(checkLivestream, 5000);
        }
      } catch (error) {
        console.error('Error checking livestream:', error);
        setTimeout(checkLivestream, 5000);
      }
    };

    const timer = setTimeout(checkLivestream, 1000);
    return () => clearTimeout(timer);
  }, [status, livestreamId]);

  const requestLivestream = async () => {
    setStatus('requesting');
    setLoadingMessage('Requesting new livestream...');

    try {
      const renderJob = await insertRenderJob('live', config)

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
    <div >
      <div style={styles.mainContent}>
        {/* <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner> */}
        <p>
          <Broadcast className="me-2" />
          {loadingMessage}
        </p>

        {/* <pre>{JSON.stringify(config, null, 4)}</pre> */}

        {status === 'needs_request' && (
          <button
            className="btn btn-primary"
            onClick={requestLivestream}
            disabled={status === 'requesting'}
          >
            {status === 'requesting' ? 'Requesting...' : 'Create Livestream'}
          </button>
        )}
        {status !== 'needs_request' && (
          <Button onClick={() => handleEndSession(livestreamId)} variant="danger" size="sm">End Session</Button>
        )}

        <pre>
          {JSON.stringify(config, null, 2)}
        </pre>

      </div>

      {/* Right Settings Sidebar */}
      <div style={styles.rightSidebar}>
        <div className="d-flex border-bottom pb-2 mb-3">

          <Button
            variant={activeTab === 'visual' ? 'primary' : 'light'}
            className="me-2 py-1 px-2"
            onClick={() => setActiveTab('visual')}
            size="sm"
          >
            Visual
          </Button>

          <Button
            variant={activeTab === 'voice' ? 'primary' : 'light'}
            className="me-2 py-1 px-2"
            onClick={() => setActiveTab('voice')}
            size="sm"
          >
            Voice
          </Button>
          <Button
            variant={activeTab === 'a2f' ? 'primary' : 'light'}
            className="me-2 py-1 px-2"
            onClick={() => setActiveTab('a2f')}
            size="sm"
          >
            A2F Config
          </Button>
          <Button
            variant={activeTab === 'llm' ? 'primary' : 'light'}
            className="me-2 py-1 px-2"
            onClick={() => setActiveTab('llm')}
            size="sm"
          >
            LLM Config
          </Button>

        </div>

        {activeTab === 'voice' && (
          <VoiceConfigTab updateConfig={updateConfig} config={config} />
        )}

        {activeTab === 'a2f' && (
          <A2FConfigTab updateConfig={updateConfig} config={config} />
        )}

        {activeTab === 'visual' && (
          <VisualConfigTab characters={characters} updateConfig={updateConfig} config={config} />
        )}

        {activeTab === 'llm' && (
          <LLMConfigTab characters={characters} updateConfig={updateConfig} config={config} />
        )}
      </div>
    </div>

  );
};


// const LiveStreamPage = () => {


// };


export default LiveStreamPage;