import React, { useState } from 'react';
import { Container, Nav, Navbar, Button, Card, Form, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import A2FConfigTab from './ConfigTabs/A2FConfigTab';
import VisualConfigTab from './ConfigTabs/VisualConfigTab';
import VoiceConfigTab from './ConfigTabs/VoiceConfigTab';
import { insertRenderJob } from './postgrestAPI';
import RenderJobVideo from './Components/RenderJobVideo';


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

const default_text = "When sunlight strikes raindrops in the air, they act as a prism and form a rainbow. A rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.";

// TextToAvatar Component
const TextToAvatar = ({ characters }) => {
  const [text, setText] = useState(default_text);
  const [currentRenderJob, setCurrentRenderJob] = useState(null);


  const [config, setConfig] = useState({
    avatar: characters[0].id,
    content: text,
    environment: 'Map_Env_Basic_01', //TODO
    a2f_config: characters[0].a2f_config,
    voice_config: characters[0].voice_config,
  });
  const [activeTab, setActiveTab] = useState('visual');

  const updateConfig = (key, value) => {
    setConfig({ ...config, [key]: value });
    if (key === 'avatar') {
      for (const character of characters) {
        if (character.id === value) {
          setConfig({ ...config, a2f_config: character.a2f_config });
          setConfig({ ...config, voice_config: character.voice_config });
          break
        }
      }

    }
  };

  const generateVideo = () => {
    setConfig({ ...config, ["content"]: text });
    if (config.content === undefined || config.content === "") {
      console.log("No text to generate");
      setConfig({ ...config, ["content"]: text });
    }
    console.log(config);
    insertRenderJob("text-to-avatar", config).then(job_id => {
      console.log("Job ID: ", job_id);
      setCurrentRenderJob(job_id);
    });

  };


  return (
    <div >
      <div style={styles.mainContent}>
        <h2>Text to Avatar</h2>
        <Form.Group>
          <Form.Control
            as="textarea"
            size="lg"
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Form.Group>
        <div width="100%">
          <span>{text.length} / 5,000 characters </span>
          <Button variant="dark" className="px-4" onClick={generateVideo}>Generate Video</Button>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4">
          < RenderJobVideo renderJobID={currentRenderJob} />
        </div>

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
      </div>
    </div>
  );
};

export default TextToAvatar;