import React, { useState, useEffect } from 'react';
import { ArrowRepeat } from 'react-bootstrap-icons';
import { checkVideoStatus } from '../postgrestAPI';


const RenderJobVideo = ({ renderJobID }) => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryAfter, setRetryAfter] = useState(10);

  const styles = {
    root: {
      width: '100vw',
      position: 'relative',
    },
    container: {
      width: '100%',
      position: 'relative',
      paddingBottom: '56.25%', // 16:9 Aspect Ratio
      overflow: 'hidden',
      backgroundColor: renderJobID ? 'transparent' : '#e0e0e0', // Grey if no ID
    },
    video: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: videoUrl ? 'block' : 'none',
    },
    loading: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '2rem',
      color: '#666',
    },
    error: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#ff4444',
      textAlign: 'center',
      padding: '1rem',
    }
  };

  const fetchVideoUrl = async () => {
    if (!renderJobID) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkVideoStatus(renderJobID);

      if (result.url) {
        console.log('Video URL:', result.url);
        setVideoUrl(result.url);
        setRetryAfter(0);
        // setIsLoading(false);
      } else {
        setError(result.error);
        setRetryAfter(10);
      }

    } catch (err) {
      console.log('Error fetching video URL:', err);
      setError('Failed to check video status');
      setRetryAfter(5);
    } finally {
      setIsLoading(false);
    }
  };


// Retry logic using timeout
useEffect(() => {
  const timer = setInterval(() => {
    // fetchVideoUrl();
    if (!renderJobID || videoUrl) {
      // console.log("timer - renderJobID is null or we have video url")
      return;
    }
    
    if (isLoading) {
      // console.log("timer - isLoading")
      return;
    }

    fetchVideoUrl();

  }, 5 * 1000);

  return () => clearInterval(timer);
});

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* <p>r: {renderJobID} -{isLoading && 'loading'}- {retryAfter} <ArrowRepeat className="spinner" /></p> */}

        {videoUrl && (
          <video
            controls
            style={styles.video}
            src={videoUrl}
          />
        )}

        {isLoading && (
          <div style={styles.loading}>
            <ArrowRepeat className="spinner" />
          </div>
        )}

        {error && (
          <div style={styles.error}>
            {error}
            {retryAfter > 0 && (
              <div>Retrying in {retryAfter} seconds...</div>
            )}
          </div>
        )}

        {!renderJobID && (
          <div style={styles.error}>
            No render job ID provided
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderJobVideo;