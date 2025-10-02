import React, { useState, useEffect } from 'react';
import { getSessionToken, API_BASE_URL } from './postgrestAPI';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { AvatarPixelStreaming } from 'inception-stream-component';
import { Button } from '@/Components/Button';
import { githubDarkTheme, JsonEditor } from 'json-edit-react';
import { useParams, useNavigate } from 'react-router-dom';

const LiveStreamInner = ({ livestreamId, onEndSession }) => {
  if (!livestreamId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-slate-300">
          <p className="text-lg">No session ID provided</p>
        </div>
      </div>
    );
  }

  // Generate pixel streaming settings for the session
  const pixelStreamingSettings = {
    ss: `${API_BASE_URL.replace('https:', 'wss:').replace('http:', 'ws:')}/api/v1/livestream/${livestreamId}`,
    AutoPlayVideo: true,
    AutoConnect: true,
    HoveringMouse: false,
    StartVideoMuted: false,
    WaitForStreamer: false,
    KeyboardInput: false,
    MouseInput: false,
    TouchInput: false,
    GamepadInput: false,
    XRControllerInput: false,
    MatchViewportRes: true,
    PreferredCodec: 'VP8',
    WebRTCMinBitrate: 1000,
    WebRTCMaxBitrate: 20000,
    WebRTCFPS: 60,
    SuppressBrowserKeys: true,
    UseMic: false,
    OfferToReceive: false,
    HideUI: true,
    ForceTURN: false,
    WebRTCIceTimeout: 10000,
    WebRTCDisconnectionTimeout: 5000,
  };

  return (
    <div className="w-full h-full">
      <div className="flex-grow-1 relative w-full" style={{ minHeight: '50vh' }}>
        <div
          className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative w-full h-full"
          style={{ minHeight: '60vh', aspectRatio: '16/9' }}
        >
          <AvatarPixelStreaming
            sessionId={livestreamId}
            authToken={getSessionToken()}
            apiBaseUrl={API_BASE_URL}
            showChatHistory={false}
            pixelStreamingConfig={pixelStreamingSettings}
          />
        </div>
      </div>
      <ConfigSidebar visual voice a2f llm isLiveSession />
    </div>
  );
};

const LiveStreamWithSidebar = ({ livestreamId, onEndSession }) => {
  return (
    <div className="relative w-full h-full">
      <div className="relative w-full">
        <LiveStreamInner livestreamId={livestreamId} onEndSession={onEndSession} />
      </div>
      {/* End Session button now handled inside video area */}
    </div>
  );
};

const LiveStreamPage = () => {
  const { config } = useConfig();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [isCreating, setIsCreating] = useState(false);

  // Update current session when URL changes
  useEffect(() => {
    setCurrentSessionId(sessionId);
  }, [sessionId]);

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      // Transform config to match API expectations
      const apiConfig = {
        avatar_id: config.avatar,
        camera: config.camera,
        lipsync: config.a2f_config,
        voice: config.voice_config,
        llm: config.llm_config,
      };

      // Only include environment_id if it's a valid UUID (not the fallback string)
      if (
        config.environment &&
        config.environment !== 'Map_Env_ltOliverDefault_v01' &&
        config.environment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      ) {
        apiConfig.environment_id = config.environment;
      }

      // Create session via API
      const response = await fetch(`${API_BASE_URL}/api/v1/live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getSessionToken()}`,
        },
        body: JSON.stringify(apiConfig),
      });

      if (response.ok) {
        const newSession = await response.json();
        const newSessionId = newSession.id || newSession.session_id;
        if (newSessionId) {
          setCurrentSessionId(newSessionId);
          navigate(`/console/conversational-ai/${newSessionId}`, { replace: true });
        }
      } else {
        console.error('Failed to create session:', response.status);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEndSession = () => {
    setCurrentSessionId(null);
    navigate('/console/conversational-ai');
  };

  // If we have a session ID, show the streaming component
  if (currentSessionId) {
    return <LiveStreamWithSidebar livestreamId={currentSessionId} onEndSession={handleEndSession} />;
  }

  // Show creation page when no session
  return (
    <div className="relative pr-[480px] overflow-hidden w-full h-full">
      <div className="relative w-full overflow-y-auto">
        <div className="mb-6">
          <h2 className="gradient-text text-3xl font-bold">Interactive Agent</h2>
        </div>

        <div className="w-full relative mb-6">
          <div
            className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/50 rounded-xl relative overflow-hidden transition-all duration-300"
            style={{ paddingBottom: '56.25%' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400 max-w-md">
                <div className="mb-4">
                  {isCreating ? (
                    <div className="animate-spin w-12 h-12 border-4 border-slate-600 border-t-slate-400 rounded-full mx-auto"></div>
                  ) : (
                    <div className="w-12 h-12 bg-slate-600 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  {isCreating ? 'Creating Session...' : 'Ready to Create Session'}
                </h3>

                <div className="flex justify-center gap-3">
                  <Button
                    variant="primary"
                    onClick={handleCreateSession}
                    disabled={isCreating}
                    className="flex items-center gap-2"
                  >
                    <span>▶️</span>
                    {isCreating ? 'Creating...' : 'Create Session'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-4">
          <h3 className="text-slate-300 text-xl font-bold mb-2">Configuration</h3>
          <JsonEditor
            data={config}
            collapse={false}
            rootName={false}
            restrictEdit={true}
            restrictDelete={true}
            enableClipboard={false}
            restrictAdd={true}
            theme={githubDarkTheme}
            maxWidth={'100%'}
            className="w-full"
          />
        </div>
      </div>
      <ConfigSidebar visual voice a2f llm isLiveSession={false} />
    </div>
  );
};

export default LiveStreamPage;
