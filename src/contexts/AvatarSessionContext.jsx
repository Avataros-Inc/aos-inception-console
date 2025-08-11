import React, { createContext, useContext, useState, useEffect } from 'react';
import { updateRenderJob, insertRenderJob } from '../postgrestAPI';

// Create the context
const AvatarSessionContext = createContext();

// Custom hook to use the context
export const useAvatarSession = () => {
  const context = useContext(AvatarSessionContext);
  if (!context) {
    throw new Error('useAvatarSession must be used within an AvatarSessionProvider');
  }
  return context;
};

// Provider component
export const AvatarSessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('current_avatar_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setActiveSession(session);
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        localStorage.removeItem('current_avatar_session');
      }
    }

    const savedHistory = localStorage.getItem('avatar_session_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setSessionHistory(history);
      } catch (error) {
        console.error('Failed to parse session history:', error);
        localStorage.removeItem('avatar_session_history');
      }
    }
  }, []);

  // Save session to localStorage when it changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('current_avatar_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('current_avatar_session');
    }
  }, [activeSession]);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('avatar_session_history', JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  // Create a new session with an avatar
  const createSession = (avatar, sessionType = 'interactive') => {
    const session = {
      id: `session_${Date.now()}`,
      avatar,
      sessionType,
      startedAt: new Date().toISOString(),
      status: 'active',
      settings: {
        // Default settings from avatar config
        unreal_config: avatar.unreal_config || {},
        llm_config: avatar.llm_config || {},
        voice_config: avatar.voice_config || {},
        a2f_config: avatar.a2f_config || {},
      },
    };

    setActiveSession(session);

    // Add to history
    setSessionHistory((prev) => [session, ...prev.slice(0, 9)]); // Keep last 10 sessions

    return session;
  };

  // Update session settings
  const updateSessionSettings = (settings) => {
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        settings: {
          ...activeSession.settings,
          ...settings,
        },
        lastUpdated: new Date().toISOString(),
      };
      setActiveSession(updatedSession);
    }
  };

  // End the current session
  const endSession = async () => {
    if (!activeSession) {
      console.log('AvatarSessionContext: No active session to end');
      return;
    }

    console.log('AvatarSessionContext: Ending session:', activeSession.sessionId);

    try {
      // End any existing backend livestream session first
      const storedLivestream = localStorage.getItem('current_livestream');

      if (storedLivestream && storedLivestream !== 'undefined') {
        console.log('AvatarSessionContext: Ending backend livestream:', storedLivestream);
        await updateRenderJob(storedLivestream, { jobstatus: 2, ended_at: 'NOW()' });
        localStorage.removeItem('current_livestream');
        console.log('AvatarSessionContext: Backend livestream ended successfully');
      }
    } catch (error) {
      console.error('AvatarSessionContext: Failed to end backend session:', error);
      // Continue with frontend session cleanup even if backend fails
    }

    // Clear frontend session
    setActiveSession(null);
    localStorage.removeItem('active_avatar_session');
    console.log('AvatarSessionContext: Session ended and removed from storage');
  };

  // Launch session (for when clicking Launch button)
  const launchSession = async (avatar, avatarConfig = null) => {
    console.log('LaunchSession: Starting new session for avatar:', avatar.name);

    // End any existing backend livestream session first
    const currentLivestream = localStorage.getItem('current_livestream');
    if (currentLivestream && currentLivestream !== 'undefined') {
      try {
        console.log('LaunchSession: Ending existing backend livestream:', currentLivestream);
        await updateRenderJob(currentLivestream, { jobstatus: 2, ended_at: 'NOW()' });
        localStorage.removeItem('current_livestream');
        console.log('LaunchSession: Backend livestream ended successfully');
      } catch (error) {
        console.error('LaunchSession: Failed to end backend livestream:', error);
        // Continue anyway - we still want to update the frontend session
      }
    }

    // End any existing frontend session
    if (activeSession) {
      console.log('LaunchSession: Ending previous frontend session:', activeSession.id);
      const endedSession = {
        ...activeSession,
        status: 'ended',
        endedAt: new Date().toISOString(),
      };

      // Update history with ended session
      setSessionHistory((prev) => prev.map((session) => (session.id === endedSession.id ? endedSession : session)));

      // Clear active session first
      setActiveSession(null);
    }

    // Create new backend livestream if config is provided
    let newLivestreamId = null;
    if (avatarConfig) {
      try {
        console.log('LaunchSession: Creating new backend livestream with config:', avatarConfig);
        newLivestreamId = await insertRenderJob('live', avatarConfig);
        localStorage.setItem('current_livestream', newLivestreamId);
        console.log('LaunchSession: New backend livestream created:', newLivestreamId);
      } catch (error) {
        console.error('LaunchSession: Failed to create new backend livestream:', error);
        // Continue anyway - we still want to update the frontend session
      }
    }

    // Create and immediately set new frontend session
    const newSession = {
      id: `session_${Date.now()}`,
      avatar,
      sessionType: 'interactive',
      startTime: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      status: 'active',
      livestreamId: newLivestreamId, // Store the backend session ID
      settings: {
        // Default settings from avatar config
        unreal_config: avatar.unreal_config || {},
        llm_config: avatar.llm_config || {},
        voice_config: avatar.voice_config || {},
        a2f_config: avatar.a2f_config || {},
      },
    };

    console.log('LaunchSession: Setting new active session:', newSession.id);
    setActiveSession(newSession);

    // Add to history
    setSessionHistory((prev) => [newSession, ...prev.slice(0, 9)]); // Keep last 10 sessions

    console.log('LaunchSession: New session launched successfully');
    return newSession;
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
    activeSession,
    sessionHistory,
    createSession,
    updateSessionSettings,
    endSession,
    launchSession,
    getEmbedCode,
    isSessionActive: !!activeSession,
  };

  return <AvatarSessionContext.Provider value={value}>{children}</AvatarSessionContext.Provider>;
};
