import React, { useState } from 'react';
import { AvatarPixelStreaming } from 'inception-stream-component';
import { getSessionToken, API_BASE_URL } from '../postgrestAPI';
import { useConfig } from '../contexts/ConfigContext';

const PixelStreamingPage = () => {
  const { config } = useConfig();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleStartSession = async () => {
    setIsCreating(true);
    try {
      // Transform config to match API expectations (avatar -> avatar_id)
      const apiConfig: any = {
        avatar_id: config.avatar,
        camera: config.camera,
        lipsync: config.a2f_config,
        voice: config.voice_config,
        llm: config.llm_config,
      };

      // Only include environment_id if it's a valid UUID (not the fallback string)
      if (config.environment && config.environment !== 'Map_Env_ltOliverDefault_v01' && 
          config.environment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
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
          setSessionId(newSessionId);
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
    setSessionId(null);
  };

  return (
    <div className="w-full h-full">
      {!sessionId ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <button
              onClick={handleStartSession}
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isCreating ? 'Starting Session...' : 'Start Session'}
            </button>
          </div>
        </div>
      ) : (
        <AvatarPixelStreaming
          sessionId={sessionId}
          authToken={getSessionToken()}
          apiBaseUrl={API_BASE_URL}
          showChatHistory={true}
          onSessionEnd={handleEndSession}
          onError={(error) => {
            console.error('Pixel streaming error:', error);
          }}
        />
      )}
    </div>
  );
};

export default PixelStreamingPage;
