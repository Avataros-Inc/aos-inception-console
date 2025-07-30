// Videos.jsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { API_BASE_URL, getSessionToken, getOrgId } from './postgrestAPI';

const Videos = ({ characters }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCurrentDomain = () => {
    return `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? ':' + window.location.port : ''
    }`;
  };

  const createURL = (filepart) => {
    return `${getCurrentDomain()}/#/console/fetch-asset/${filepart}`;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/renderjobs?jobtype=neq.live&jobstatus=eq.3`, {
          headers: {
            Authorization: `Bearer ${getSessionToken()}`,
          },
          method: 'GET',
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setVideos(data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <h1>Error</h1>
        <p>{error.message}</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="gradient-text text-3xl font-bold mb-6">Videos</h1>
      <Row>
        {videos.map((video) => (
          <Col key={video.id} md={4} className="mb-4">
            <Card className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-400/10 hover:-translate-y-1 w-full max-w-md overflow-hidden">
              <a href={createURL(`${getOrgId()}/${video.id}/video_out.mp4`)} target="_blank" rel="noopener noreferrer">
                <Card.Img
                  variant="top"
                  src="https://placehold.co/640x360?text=Hello+World"
                  className="aspect-video object-cover"
                />
              </a>
              <Card.Body className="p-4">
                <Card.Title className="text-xl font-semibold mb-3">{video.jobtype}</Card.Title>
                <Card.Text>
                  <strong>Avatar:</strong>{' '}
                  {characters.find((char) => char.id === video.config.avatar)?.name || video.config.avatar}
                  <br />
                  <strong>Environment:</strong> {video.config.environment}
                  <br />
                  <strong>Content:</strong>{' '}
                  {video.config.content ? (
                    video.config.content
                  ) : video.config.audio_key ? (
                    <a href={createURL(video.config.audio_key)} target="_blank" rel="noopener noreferrer">
                      Audio File
                    </a>
                  ) : (
                    'No content available'
                  )}
                  <br />
                  <strong>Duration:</strong> {video.config.duration} seconds
                  <br />
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Videos;
