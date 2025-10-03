import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  ArrowCounterclockwise,
  CameraReels,
} from 'react-bootstrap-icons';
import { Button } from '@/Components/Button';

const CameraControls = ({ sendMessage }) => {
  const handleButtonDown = (cmd) => {
    console.log(`${cmd} button pressed`);
    sendMessage(JSON.stringify({ type: 'camera', content: cmd }));
  };

  const handleButtonUp = (cmd) => {
    console.log(`${cmd}`);
    sendMessage(JSON.stringify({ type: 'camera', content: cmd }));
  };

  return (
    <Container className="d-flex justify-content-center flex-column">
      <Row className="flex-grow-1 m-0" style={{ position: 'relative' }}>
        <Col className="d-flex justify-content-center mb-3 align-items-center">
          <div
            style={{ height: '40px', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CameraReels style={{ height: '36px', width: '36px' }} />
          </div>

          <Button
            variant="outline-primary"
            onMouseDown={() => handleButtonDown('moveleft')}
            onMouseUp={() => handleButtonUp('movestop')}
            className="m-2"
            style={{ height: '40px', width: '40px' }}
          >
            <ArrowLeft />
          </Button>
          <Button
            variant="outline-primary"
            onMouseDown={() => handleButtonDown('moveright')}
            onMouseUp={() => handleButtonUp('movestop')}
            className="m-2"
            style={{ height: '40px', width: '40px' }}
          >
            <ArrowRight />
          </Button>

          <Button
            variant="outline-primary"
            onMouseDown={() => handleButtonDown('moveup')}
            onMouseUp={() => handleButtonUp('movestop')}
            className="m-2"
            style={{ height: '40px', width: '40px' }}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="outline-primary"
            onMouseDown={() => handleButtonDown('movedown')}
            onMouseUp={() => handleButtonUp('movestop')}
            className="m-2"
            style={{ height: '40px', width: '40px' }}
          >
            <ArrowDown />
          </Button>

          <Button
            variant="outline-primary"
            onMouseDown={() => handleButtonDown('zoomin')}
            onMouseUp={() => handleButtonUp('zoomstop')}
            className="m-2"
            style={{ height: '40px', width: '40px' }}
          >
            <ZoomIn />
          </Button>
          <Button
            variant="outline-primary"
            onMouseDown={() => handleButtonDown('zoomout')}
            onMouseUp={() => handleButtonUp('zoomstop')}
            className="m-2"
            style={{ height: '40px', width: '40px' }}
          >
            <ZoomOut />
          </Button>

          <Button
            variant="outline-primary"
            // onMouseDown={() => handleButtonDown('ArrowCounterclockwise')}
            onMouseUp={() => handleButtonUp('reset')}
            className="m-2"
            style={{ height: '40px', width: '40px' }}
          >
            <ArrowCounterclockwise />
          </Button>
        </Col>
        <Col className="d-flex justify-content-center mb-3 align-items-center">
          <Button variant="secondary" size="sm" onClick={() => handleButtonDown('Preset1')}>
            Preset1
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleButtonDown('Preset2')}>
            Preset2
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleButtonDown('Preset3')}>
            Preset3
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleButtonDown('Preset4')}>
            Preset4
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default CameraControls;
