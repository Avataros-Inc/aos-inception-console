import React from 'react';
import { getSessionToken, API_BASE_URL } from './postgrestAPI';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { useAvatarLivestream } from './contexts/AvatarLivestreamContext';
import { Button } from '@/Components/Button';
import { Play } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AvatarPixelStreaming from 'inception-stream-component';

const LiveStreamPage = () => {
  const { config } = useConfig();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { createSession, endSession } = useAvatarLivestream();

  const handleCreateSession = async () => {
    const newSessionId = await createSession(config);
    navigate(`/console/conversational-ai/${newSessionId}`, { replace: true });
  };

  const handleEndSession = async () => {
    console.log("endSession",sessionId)
    await endSession(sessionId);
    navigate('/console/conversational-ai');
  };

  // Show streaming view if we have a sessionId
  if (sessionId) {
    return (
      <div className="relative w-full h-screen">
        <div className="absolute top-4 right-4 z-50">
          <Button variant="destructive" size="sm" onClick={handleEndSession}>
            End Session
          </Button>
        </div>

        <AvatarPixelStreaming
          style={{ height: '80vh', backgroundColor: 'red', border: '10px solid yellow', padding: '50px' }}
          sessionId={sessionId}
          authToken={getSessionToken()}
          apiBaseUrl={API_BASE_URL}
        />

        <ConfigSidebar visual voice a2f llm isLiveSession />
      </div>
    );
  }

  // Show create session view
  return (
    <div className="relative pr-[480px] overflow-hidden w-full h-full">
      <div className="relative w-full overflow-y-auto">
        <div className="mb-6">
          <h2 className="gradient-text text-3xl font-bold">Interactive Agent</h2>
        </div>

        <div className="w-full relative mb-6">
          <div
            className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative overflow-hidden"
            style={{ paddingBottom: '56.25%' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Ready to Create Session</h3>
                <Button variant="primary" onClick={handleCreateSession} className="flex items-center gap-2">
                  <Play size={16} />
                  Create Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfigSidebar visual voice a2f llm isLiveSession={false} />
    </div>
  );
};

export default LiveStreamPage;
