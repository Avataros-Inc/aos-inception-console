import React from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';

export const ComingSoonCard = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Row>
        <Col>
          <Card className="text-center p-4 shadow-lg" style={{ width: '28rem' }}>
            <Card.Body>
              <Card.Title className="display-4 mb-3">🚀 Coming Soon</Card.Title>
              <Card.Subtitle className="mb-4 text-muted">
                We're working on something awesome!
              </Card.Subtitle>
              <Card.Text>
                Keep an eye out for the update or reach out for potential early access
              </Card.Text>
              {/* <div className="d-grid gap-2">
                <button className="btn btn-primary btn-lg mt-3">
                  Notify Me
                </button>
              </div> */}
            </Card.Body>
            <Card.Footer className="text-muted">
              Launching in 2025
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export const AlphaCard = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Row>
        <Col>
          <Card className="text-center p-4 shadow-lg" style={{ width: '28rem' }}>
            <Card.Body>
              <Card.Title className="display-4 mb-3">⚠️ Alpha Version</Card.Title>
              <Card.Subtitle className="mb-4 text-muted">
                This is an early alpha release
              </Card.Subtitle>
              <Card.Text>
                Expect broken functionality and incomplete features.<br />
                Please report issues to: <strong>tech@avataros.com</strong>
              </Card.Text>
            </Card.Body>
            <Card.Footer className="text-muted">
              Under active development
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

