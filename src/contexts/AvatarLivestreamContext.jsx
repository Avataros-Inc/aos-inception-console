import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getLiveSession, createLivestream, deleteLivestream } from '../postgrestAPI';
import { SESSION_STATES, CONNECTION_STEPS } from '../constants/connectionStates';

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
  const [sessionState, setSessionState] = useState(SESSION_STATES.IDLE);
  const [statusMessage, setStatusMessage] = useState('Ready to create session');
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [lastError, setLastError] = useState(null);

  // Refs for cleanup and avoiding race conditions
  const pollTimeoutRef = useRef(null);
  const isUnmountedRef = useRef(false);
  const retryCountRef = useRef(0);

  const recheckTime = 2000; // Increased from 500ms to reduce API load
  const maxRetries = 5;

  const livestreamId = activeLivestream?.id || null;

  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, []);

  // Safe state update function
  const safeSetState = (stateSetter, value) => {
    if (!isUnmountedRef.current) {
      stateSetter(value);
    }
  };

  // Enhanced error handling
  const handleError = (error, context = 'Unknown') => {
    console.error(`Session error in ${context}:`, error);
    const errorMessage = error.message || 'An unexpected error occurred';
    safeSetState(setLastError, { context, message: errorMessage, timestamp: Date.now() });
    safeSetState(setSessionState, SESSION_STATES.ERROR);
    safeSetState(setStatusMessage, `Error: ${errorMessage}`);
    safeSetState(setConnectionProgress, 0);
  };

  // Improved session validation with exponential backoff
  const validateSession = async (sessionId, attempt = 0) => {
    if (isUnmountedRef.current) return null;

    try {
      const session = await getLiveSession(sessionId);
      retryCountRef.current = 0; // Reset retry count on success
      return session;
    } catch (error) {
      if (attempt < maxRetries && !isUnmountedRef.current) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        console.log(`Session validation failed, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries})`);

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return validateSession(sessionId, attempt + 1);
      }
      throw error;
    }
  };

  // Smart polling with better logic
  const pollSessionStatus = async (sessionId) => {
    if (isUnmountedRef.current) return;

    cleanup(); // Clear any existing timeout

    try {
      safeSetState(setStatusMessage, CONNECTION_STEPS.VALIDATING.message);
      safeSetState(setConnectionProgress, CONNECTION_STEPS.VALIDATING.progress);

      const session = await validateSession(sessionId);

      if (isUnmountedRef.current || !session) return;

      // Update session data
      safeSetState(setActiveLivestream, session);

      // Check session status with better logic
      if (session.jobstatus === 1) {
        // Session is ready
        safeSetState(setSessionState, SESSION_STATES.CONNECTED);
        safeSetState(setStatusMessage, CONNECTION_STEPS.CONNECTED.message);
        safeSetState(setConnectionProgress, CONNECTION_STEPS.CONNECTED.progress);
        safeSetState(setLastError, null);
        return;
      } else if (
        session.jobstatus === 2 ||
        session.jobstatus === 4 ||
        (session.ended_at && session.ended_at !== '' && session.ended_at !== '0001-01-01T00:00:00Z')
      ) {
        // Session ended
        safeSetState(setSessionState, SESSION_STATES.ERROR);
        safeSetState(setStatusMessage, 'Session has ended');
        safeSetState(setConnectionProgress, 0);
        return;
      } else {
        // Session still initializing - continue polling with better messaging
        const statusMessages = {
          0: 'Session initializing...',
          3: 'Session preparing...',
          6: 'Waiting for streaming service...',
          7: 'Starting streaming service...',
        };

        const message = statusMessages[session.jobstatus] || 'Session starting...';
        safeSetState(setStatusMessage, message);
        safeSetState(setConnectionProgress, Math.min(75, 25 + session.jobstatus * 10));

        // Continue polling with exponential backoff if there are consecutive failures
        const nextPollDelay = recheckTime + retryCountRef.current * 1000;
        pollTimeoutRef.current = setTimeout(() => pollSessionStatus(sessionId), nextPollDelay);
      }
    } catch (error) {
      retryCountRef.current++;
      if (retryCountRef.current >= maxRetries) {
        handleError(error, 'Session validation');
      } else {
        // Continue polling with backoff
        const backoffDelay = recheckTime * Math.pow(2, retryCountRef.current);
        pollTimeoutRef.current = setTimeout(() => pollSessionStatus(sessionId), backoffDelay);
      }
    }
  };

  // Launch livestream (unified livestream creation function)
  const launchLivestream = async (config) => {
    console.log('LaunchLivestream: Starting new livestream with config:', config);
    console.log('LaunchLivestream: Config type:', typeof config, 'Config truthy:', !!config);

    // Set initial connecting state
    safeSetState(setSessionState, SESSION_STATES.CONNECTING);
    safeSetState(setStatusMessage, CONNECTION_STEPS.CREATING.message);
    safeSetState(setConnectionProgress, CONNECTION_STEPS.CREATING.progress);
    safeSetState(setLastError, null);

    try {
      // Only end existing livestream if we have one
      if (activeLivestream && activeLivestream.id !== livestreamId) {
        await endLivestream();
      }

      console.log('LaunchLivestream: Checking config condition...');
      if (config) {
        console.log('LaunchLivestream: Config is valid, creating livestream...');
        const newLivestreamId = await createLivestream(config);
        console.log('LaunchLivestream: Created livestream with ID:', newLivestreamId);

        // Return immediately with the session ID for navigation
        // We'll fetch the full job details in the background
        const sessionObj = { id: newLivestreamId };
        console.log('LaunchLivestream: Created session object:', sessionObj);

        // Fetch job details in background and update state
        (async () => {
          try {
            console.log('LaunchLivestream: Fetching session details for ID:', newLivestreamId);
            const job = await getLiveSession(newLivestreamId);
            console.log('LaunchLivestream: Retrieved job:', job);

            if (job && job.config) {
              safeSetState(setActiveLivestream, job);
              // Start polling for session readiness
              pollSessionStatus(newLivestreamId);
            } else {
              console.error('LaunchLivestream: Job is null or missing config:', job);
            }
          } catch (error) {
            console.error('LaunchLivestream: Error fetching job details:', error);
          }
        })();

        console.log('LaunchLivestream: About to return session object:', sessionObj);
        return sessionObj;
      }

      console.log('LaunchLivestream: Config was null/undefined, returning null');
      safeSetState(setSessionState, SESSION_STATES.ERROR);
      safeSetState(setStatusMessage, 'Failed to create livestream');
      return null;
    } catch (error) {
      console.error('LaunchLivestream: Error in try block:', error);
      handleError(error, 'Livestream creation');
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

    safeSetState(setSessionState, SESSION_STATES.CONNECTING);
    safeSetState(setStatusMessage, 'Connecting to existing session...');
    safeSetState(setConnectionProgress, 25);
    safeSetState(setLastError, null);

    try {
      const job = await getLiveSession(sessionId);
      console.log('AvatarLivestreamContext: Retrieved job for session', sessionId, ':', job);

      if (job && job.config) {
        safeSetState(setActiveLivestream, job);

        // Check if the session is still active
        if (job.jobstatus === 1) {
          safeSetState(setSessionState, SESSION_STATES.CONNECTED);
          safeSetState(setStatusMessage, CONNECTION_STEPS.CONNECTED.message);
          safeSetState(setConnectionProgress, CONNECTION_STEPS.CONNECTED.progress);
          return true;
        } else if (
          job.jobstatus === 2 ||
          job.jobstatus === 4 ||
          (job.ended_at && job.ended_at !== '' && job.ended_at !== '0001-01-01T00:00:00Z')
        ) {
          safeSetState(setSessionState, SESSION_STATES.ERROR);
          safeSetState(setStatusMessage, 'Session has ended');
          safeSetState(setConnectionProgress, 0);
          return false;
        } else {
          // Start polling for session readiness
          pollSessionStatus(sessionId);
          return true;
        }
      } else {
        safeSetState(setSessionState, SESSION_STATES.ERROR);
        safeSetState(setStatusMessage, 'Session not found');
        safeSetState(setConnectionProgress, 0);
        return false;
      }
    } catch (error) {
      handleError(error, 'Session connection');
      return false;
    }
  };

  // End the current livestream
  const endLivestream = async () => {
    if (!activeLivestream) {
      console.log('AvatarLivestreamContext: No active livestream to end');
      return Promise.resolve();
    }

    cleanup(); // Stop any ongoing polling

    try {
      if (livestreamId && livestreamId !== 'undefined' && livestreamId !== null) {
        // Check if the livestream is already ended to avoid unnecessary DELETE calls
        if (activeLivestream.ended_at && activeLivestream.ended_at !== '' && activeLivestream.jobstatus !== 1) {
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
    }

    // Clear state
    safeSetState(setActiveLivestream, null);
    safeSetState(setSessionState, SESSION_STATES.IDLE);
    safeSetState(setStatusMessage, 'Ready to create session');
    safeSetState(setConnectionProgress, 0);
    safeSetState(setLastError, null);
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

  // Clear error state
  const clearError = () => {
    safeSetState(setLastError, null);
    if (sessionState === SESSION_STATES.ERROR) {
      safeSetState(setSessionState, SESSION_STATES.IDLE);
      safeSetState(setStatusMessage, 'Ready to create session');
      safeSetState(setConnectionProgress, 0);
    }
  };

  // Legacy compatibility - map new states to old API
  const livestreamStatus =
    {
      [SESSION_STATES.IDLE]: 'needs_request',
      [SESSION_STATES.CONNECTING]: 'checking_readiness',
      [SESSION_STATES.CONNECTED]: 'ready',
      [SESSION_STATES.ERROR]: lastError?.context === 'Session connection' ? 'connection_error' : 'session_ended',
    }[sessionState] || 'needs_request';

  const loadingMessage = statusMessage;

  const value = {
    // New improved API
    sessionState,
    statusMessage,
    connectionProgress,
    lastError,
    clearError,

    // Legacy API for backward compatibility
    activeLivestream,
    updateLivestreamSettings,
    endLivestream,
    launchLivestream,
    connectToExistingSession,
    getEmbedCode,
    isLivestreamActive: sessionState === SESSION_STATES.CONNECTED,
    livestreamStatus,
    livestreamId,
    loadingMessage,
  };

  return <AvatarLivestreamContext.Provider value={value}>{children}</AvatarLivestreamContext.Provider>;
};
