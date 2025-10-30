import React, { createContext, useContext, useState } from 'react';
import { createLivestream, deleteLivestream } from '../postgrestAPI';

const AvatarLivestreamContext = createContext();

export const useAvatarLivestream = () => {
  const context = useContext(AvatarLivestreamContext);
  if (!context) {
    throw new Error('useAvatarLivestream must be used within an AvatarLivestreamProvider');
  }
  return context;
};

export const AvatarLivestreamProvider = ({ children }) => {
  const [activeSessionId, setActiveSessionId] = useState(null);

  const createSession = async (config) => {
    const sessionId = await createLivestream(config);
    setActiveSessionId(sessionId);
    return sessionId;
  };

  const endSession = async (sessionId) => {
    const idToDelete = sessionId || activeSessionId;
    if (idToDelete) {
      await deleteLivestream(idToDelete);
      setActiveSessionId(null);
    }
  };

  const value = {
    activeSessionId,
    createSession,
    endSession,
  };

  return <AvatarLivestreamContext.Provider value={value}>{children}</AvatarLivestreamContext.Provider>;
};
