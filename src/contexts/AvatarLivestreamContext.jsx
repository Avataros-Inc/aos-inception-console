import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRenderJob, createLivestream, deleteLivestream } from '../postgrestAPI';

// Create the context
const AvatarLivestreamContext = createContext();

// Custom hook to use the context
export const useAvatarLivestream = () => {
  const context = useContext(AvatarLivestreamContext);
  if (!context) {
    throw new Error('useAvatarLivestream must be used within an AvatarLivestreamProvider');
  }
  return context;
};

// Provider component
export const AvatarLivestreamProvider = ({ children }) => {
  const [activeLivestream, setActiveLivestream] = useState(null);
  const [livestreamStatus, setLivestreamStatus] = useState('checking_storage');
  const [loadingMessage, setLoadingMessage] = useState('Checking for existing livestream...');

  const recheckTime = 500;

  const livestreamId = activeLivestream?.id || null;

  // Load livestream from URL parameter on mount, not localStorage
  useEffect(() => {
    // Don't auto-load from localStorage anymore since we use URL-based sessions
    setLivestreamStatus('needs_request');
    setLoadingMessage('No active livestream found');
  }, []);

  // Poll livestream readiness when we have an ID
  useEffect(() => {
    if (livestreamStatus !== 'checking_readiness' || !livestreamId) return;

    const checkLivestream = async () => {
      try {
        const renderjob = await getRenderJob(livestreamId);
        if (renderjob === undefined) {
          setLivestreamStatus('session_not_found');
          setLoadingMessage('Session not found');
        } else if (renderjob.jobstatus === 1) {
          // Job is ready - prioritize this over ended_at
          setLivestreamStatus('ready');
        } else if (renderjob.jobstatus === 2 || renderjob.jobstatus === 4) {
          // Job has finished
          setLivestreamStatus('session_ended');
          setLoadingMessage('Stream Ended');
        } else if (renderjob.ended_at !== null && renderjob.jobstatus !== 1) {
          // Only consider ended_at if jobstatus is not 1 (ready)
          setLivestreamStatus('session_ended');
          setLoadingMessage('Stream Ended');
        } else if (renderjob.jobstatus >= 6) {
          setLoadingMessage('Waiting streaming client');
          setTimeout(checkLivestream, recheckTime);
        } else {
          setTimeout(checkLivestream, recheckTime);
        }
      } catch (error) {
        console.error('Error checking livestream:', error);
        setLivestreamStatus('connection_error');
        setLoadingMessage('Failed to connect to session');
        setTimeout(checkLivestream, recheckTime);
      }
    };

    const timer = setTimeout(checkLivestream, recheckTime);
    return () => clearTimeout(timer);
  }, [livestreamStatus, livestreamId]);

  // Launch livestream (unified livestream creation function)
  const launchLivestream = async (config) => {
    console.log('LaunchLivestream: Starting new livestream with config:', config);

    // Set livestream status for UI feedback
    setLivestreamStatus('requesting');
    setLoadingMessage('Creating new livestream...');

    try {
      // Only end existing livestream if we have one AND it's different from what we're creating
      if (activeLivestream && activeLivestream.id !== livestreamId) {
        await endLivestream();
      }

      if (config) {
        const livestreamId = await createLivestream(config);
        // No localStorage needed - navigation will handle the URL

        const job = await getRenderJob(livestreamId);
        if (job && job.config) {
          setActiveLivestream(job);
          setLivestreamStatus('checking_readiness');
          setLoadingMessage('Livestream created, verifying status...');
          return job;
        }
      }

      setLivestreamStatus('needs_request');
      setLoadingMessage('Failed to create livestream');
      return null;
    } catch (error) {
      console.error('Error creating livestream:', error);
      setLivestreamStatus('needs_request');
      setLoadingMessage('Failed to create livestream. Please try again.');
      throw error;
    }
  };

  // Update livestream settings
  const updateLivestreamSettings = (settings) => {
    // Optionally, update backend job config if needed
    if (activeLivestream) {
      const updatedActiveLivestream = {
        ...activeLivestream,
        config: {
          ...activeLivestream.config,
          ...settings,
        },
        lastUpdated: new Date().toISOString(),
      };
      setActiveLivestream(updatedActiveLivestream);
    }
  };

  // Connect to an existing session by ID (for URL-based connection)
  const connectToExistingSession = async (sessionId) => {
    if (!sessionId || sessionId === livestreamId) {
      return;
    }

    console.log('AvatarLivestreamContext: Connecting to existing session:', sessionId);
    setLivestreamStatus('checking_readiness');
    setLoadingMessage('Connecting to existing session...');

    try {
      const job = await getRenderJob(sessionId);
      console.log('AvatarLivestreamContext: Retrieved job for session', sessionId, ':', job);
      if (job && job.config) {
        // Set the new session (no localStorage needed)
        setActiveLivestream(job);

        // Check if the session is still active - prioritize jobstatus over ended_at
        console.log('AvatarLivestreamContext: Job status:', job.jobstatus, 'Ended at:', job.ended_at);
        if (job.jobstatus === 1) {
          setLivestreamStatus('ready');
          setLoadingMessage('Connected to session');
          return true;
        } else if (job.jobstatus === 2 || job.jobstatus === 4) {
          setLivestreamStatus('session_ended');
          setLoadingMessage('Stream Ended');
          return false;
        } else if (job.ended_at !== null && job.jobstatus !== 1) {
          // Only consider ended_at if jobstatus is not 1 (ready)
          setLivestreamStatus('session_ended');
          setLoadingMessage('Stream Ended');
          return false;
        } else {
          setLivestreamStatus('checking_readiness');
          setLoadingMessage('Verifying session status...');
          return true;
        }
      } else {
        setLivestreamStatus('session_not_found');
        setLoadingMessage('Session not found');
        return false;
      }
    } catch (error) {
      console.error('Error connecting to existing session:', error);
      setLivestreamStatus('connection_error');
      setLoadingMessage('Failed to connect to session');
      return false;
    }
  };

  // End the current livestream
  const endLivestream = async () => {
    if (!activeLivestream) {
      console.log('AvatarLivestreamContext: No active livestream to end - this is expected in some cases');
      return Promise.resolve();
    }
    try {
      if (livestreamId && livestreamId !== 'undefined' && livestreamId !== null) {
        // Check if the livestream is already ended to avoid unnecessary DELETE calls
        if (activeLivestream.ended_at !== null && activeLivestream.jobstatus !== 1) {
          console.log('AvatarLivestreamContext: Livestream already ended, skipping DELETE call');
        } else {
          console.log('AvatarLivestreamContext: Ending backend livestream:', livestreamId);
          const result = await deleteLivestream(livestreamId);

          // Handle different response types
          if (result.alreadyEnded) {
            console.log('AvatarLivestreamContext: Session was already ended on server side');
          } else if (result.success !== false) {
            console.log('AvatarLivestreamContext: Backend livestream ended successfully');
          } else {
            console.warn('AvatarLivestreamContext: DELETE failed but continuing with local cleanup:', result.error);
          }
        }
      }
    } catch (error) {
      console.error('AvatarLivestreamContext: Failed to end backend livestream:', error);
      // Don't throw the error - we still want to clear the local state
      // Log the error details for debugging
      if (error.message && error.message.includes('JSON.parse')) {
        console.warn(
          'AvatarLivestreamContext: JSON parsing error on DELETE - this may be expected for some DELETE endpoints'
        );
      }
      if (error.message && error.message.includes('Authentication failed')) {
        console.warn('AvatarLivestreamContext: Authentication error on DELETE - session may have expired');
      }
    }

    // Clear state (no localStorage to clear)
    setActiveLivestream(null);
    setLivestreamStatus('needs_request');
    setLoadingMessage('No active livestream found');
    console.log('AvatarLivestreamContext: Livestream ended');
  };

  // Get embed code for avatar
  const getEmbedCode = (avatar) => {
    const embedUrl = `https://your-domain.com/embed/${avatar.id}`;
    return `<iframe 
  src="${embedUrl}" 
  width="800" 
  height="600" 
  frameborder="0" 
  allowfullscreen>
</iframe>`;
  };

  const value = {
    activeLivestream,
    updateLivestreamSettings,
    endLivestream,
    launchLivestream,
    connectToExistingSession,
    getEmbedCode,
    isLivestreamActive: !!activeLivestream,
    livestreamStatus,
    livestreamId,
    loadingMessage,
  };

  return <AvatarLivestreamContext.Provider value={value}>{children}</AvatarLivestreamContext.Provider>;
};
