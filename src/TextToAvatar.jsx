import React, { useState } from 'react';
import { Container, Nav, Navbar, Card, Form, Row, Col } from 'react-bootstrap';
import { Button } from '@/Components/Button';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { insertRenderJob } from './postgrestAPI';
import RenderJobVideo from './Components/RenderJobVideo';

const default_text =
  'When sunlight strikes raindrops in the air, they act as a prism and form a rainbow. A rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.';

// TextToAvatar Component
const TextToAvatar = () => {
  const { config, updateConfig } = useConfig();
  const [text, setText] = useState(default_text);
  const [currentRenderJob, setCurrentRenderJob] = useState(null);

  const generateVideo = () => {
    updateConfig('content', text);
    if (config.content === undefined || config.content === '') {
      console.log('No text to generate');
      updateConfig('content', text);
    }
    console.log(config);
    insertRenderJob('text-to-avatar', config).then((job_id) => {
      console.log('Job ID: ', job_id);
      setCurrentRenderJob(job_id);
    });
  };

  return (
    <div className="relative mr-[480px] overflow-hidden">
      <div className="relative w-full overflow-y-auto">
        <h2 className="gradient-text text-3xl font-bold mb-6">Text to Avatar</h2>
        <Form.Group>
          <Form.Control
            className="w-full border-border-subtle rounded-xl p-3"
            as="textarea"
            size="lg"
            style={{ height: '300px' }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Form.Group>
        <div className="w-100% flex justify-between items-center mt-4">
          <Button onClick={generateVideo}>Generate Video</Button>
          <span>{text.length} / 5,000 characters</span>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <RenderJobVideo renderJobID={currentRenderJob} />
        </div>
      </div>
      <ConfigSidebar visual voice a2f />
    </div>
  );
};

export default TextToAvatar;
