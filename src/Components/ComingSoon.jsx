import React from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';

const ComingSoonCard = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
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

export default ComingSoonCard;