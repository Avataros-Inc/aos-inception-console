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

  // Load livestream from localStorage on mount and check livestream status
  useEffect(() => {
    const jobId = localStorage.getItem('current_livestream');
    if (jobId) {
      getRenderJob(jobId)
        .then((job) => {
          if (job && job.config) {
            setActiveLivestream(job);
            setLivestreamStatus('checking_readiness');
            setLoadingMessage('Verifying livestream status...');
          } else {
            setActiveLivestream(null);
            setLivestreamStatus('needs_request');
            setLoadingMessage('No active livestream found');
          }
        })
        .catch(() => {
          setActiveLivestream(null);
          setLivestreamStatus('needs_request');
          setLoadingMessage('No active livestream found');
        });
    } else {
      setLivestreamStatus('needs_request');
      setLoadingMessage('No active livestream found');
    }
  }, []);

  // Poll livestream readiness when we have an ID
  useEffect(() => {
    if (livestreamStatus !== 'checking_readiness' || !livestreamId) return;

    const checkLivestream = async () => {
      try {
        const renderjob = await getRenderJob(livestreamId);
        if (renderjob === undefined) {
          localStorage.removeItem('current_livestream');
          window.location.reload();
        } else if (renderjob.ended_at !== null) {
          localStorage.removeItem('current_livestream');
          window.location.reload();
        } else if (renderjob.jobstatus === 1) {
          setLivestreamStatus('ready');
        } else if (renderjob.jobstatus >= 6) {
          setLoadingMessage('Waiting streaming client');
          setTimeout(checkLivestream, recheckTime);
        } else if (renderjob.jobstatus === 2 || renderjob.jobstatus === 4) {
          setLoadingMessage('Streaming finished');
          localStorage.removeItem('current_livestream');
          setLivestreamStatus('needs_request');
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
  }, [livestreamStatus, livestreamId]);

  // Launch livestream (unified livestream creation function)
  const launchLivestream = async (config) => {
    console.log('LaunchLivestream: Starting new livestream with config:', config);

    // Set livestream status for UI feedback
    setLivestreamStatus('requesting');
    setLoadingMessage('Creating new livestream...');

    try {
      // Always end any existing livestream first
      await endLivestream();

      if (config) {
        const livestreamId = await createLivestream(config);
        localStorage.setItem('current_livestream', livestreamId);

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

  // End the current livestream
  const endLivestream = async () => {
    if (!activeLivestream) {
      console.log('AvatarLivestreamContext: No active livestream to end - this is expected in some cases');
      return Promise.resolve();
    }
    try {
      if (livestreamId && livestreamId !== 'undefined' && livestreamId !== null) {
        console.log('AvatarLivestreamContext: Ending backend livestream:', livestreamId);
        await deleteLivestream(livestreamId);
        localStorage.removeItem('current_livestream');
        console.log('AvatarLivestreamContext: Backend livestream ended successfully');
      }
    } catch (error) {
      console.error('AvatarLivestreamContext: Failed to end backend livestream:', error);
    }
    setActiveLivestream(null);
    console.log('AvatarLivestreamContext: Livestream ended and removed from storage');
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
    getEmbedCode,
    isLivestreamActive: !!activeLivestream,
    livestreamStatus,
    livestreamId,
    loadingMessage,
  };

  return <AvatarLivestreamContext.Provider value={value}>{children}</AvatarLivestreamContext.Provider>;
};
