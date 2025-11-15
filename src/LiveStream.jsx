import React, { useEffect, useState } from 'react';
import { getSessionToken, API_BASE_URL } from './postgrestAPI';
import ConfigSidebar from '@/Components/ConfigSidebar';
import { useConfig } from './contexts/ConfigContext';
import { useAvatarLivestream } from './contexts/AvatarLivestreamContext';
import { useTopBarOffset } from './Components/TopBar';
import { Button } from '@/Components/Button';
import { Play, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AvatarPixelStreaming from 'inception-stream-component';
import { Modal, ModalHeader, ModalContent, ModalFooter } from '@/Components/Modal';

const LiveStreamPage = () => {
  const { config } = useConfig();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { createSession, endSession } = useAvatarLivestream();
  const { topOffset } = useTopBarOffset();
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '', title: 'Error' });
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Function to request permissions
  const requestPermissions = async () => {
    if (!sessionId) {
      setPermissionsGranted(false);
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Successfully got permissions, stop the stream as we just needed permission
      stream.getTracks().forEach(track => track.stop());

      setPermissionsGranted(true);
      setPermissionError(null);
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionError(error.message || 'Microphone access is required for this feature. Please allow microphone access.');
      setPermissionsGranted(false);
    }
  };

  // Request permissions when sessionId is available
  useEffect(() => {
    requestPermissions();
  }, [sessionId]);

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const newSessionId = await createSession(config);
      // Navigate with full page refresh on success
      window.location.href = `#/console/conversational-ai/${newSessionId}`;
    } catch (error) {
      console.error('Error creating session:', error);

      // Special handling for 503 Service Unavailable - session is created, navigate anyway
      if (error.status === 503 && error.sessionId) {
        console.log('Service unavailable but session created, navigating to:', error.sessionId);
        window.location.href = `#/console/conversational-ai/${error.sessionId}`;
        return;
      }

      // For all other errors, show error modal and stop loading
      setIsCreatingSession(false);
      setErrorModal({
        isOpen: true,
        title: 'Failed to Create Session',
        message: error.message || 'An unknown error occurred while creating the session.',
      });
    }
  };

  const handleEndSession = async () => {
    console.log("endSession",sessionId)
    await endSession(sessionId);
    navigate('/console/conversational-ai');
  };

  // Show streaming view if we have a sessionId
  if (sessionId) {
    return (
      <div className="relative w-full h-screen overflow-hidden">
        <div className="absolute top-4 left-4 z-50">
          <Button variant="destructive" size="sm" onClick={handleEndSession}>
            End Session
          </Button>
        </div>

        <div className="w-full h-full max-h-screen overflow-hidden">
          {permissionError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Permission Required</h3>
                <p className="text-slate-300 mb-4">{permissionError}</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="primary" onClick={requestPermissions}>
                    Request Permission
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          ) : !permissionsGranted ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Requesting Permissions...</h3>
                <p className="text-slate-400">Please allow microphone access to continue</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Background message */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-200 mb-2">Click to Connect</h3>
                  <p className="text-slate-400">Click anywhere on the screen to start</p>
                </div>
              </div>
              {/* Streaming component on top */}
              <div className="relative z-10">
                <AvatarPixelStreaming
                  style={{ height: '75vh', maxHeight: '75vh', overflow: 'hidden' }}
                  sessionId={sessionId}
                  authToken={getSessionToken()}
                  apiBaseUrl={API_BASE_URL}
                  autoplay={true}
                />
              </div>
            </div>
          )}
        </div>

        <ConfigSidebar visual voice a2f llm isLiveSession topOffset={topOffset} />
      </div>
    );
  }

  // Show create session view
  return (
    <>
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
                  <Button
                    variant="primary"
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                    className="flex items-center gap-2"
                  >
                    {isCreatingSession ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Play size={16} />
                    )}
                    {isCreatingSession ? 'Creating Session...' : 'Create Session'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ConfigSidebar visual voice a2f llm isLiveSession={false} topOffset={topOffset} />
      </div>

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
      >
        <ModalHeader onClose={() => setErrorModal({ ...errorModal, isOpen: false })}>
          {errorModal.title}
        </ModalHeader>
        <ModalContent>
          <p className="text-text-secondary">{errorModal.message}</p>
        </ModalContent>
        <ModalFooter>
          <Button variant="primary" onClick={() => setErrorModal({ ...errorModal, isOpen: false })}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default LiveStreamPage;
