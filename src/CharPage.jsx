import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  updateCharacter,
  API_BASE_URL,
  VITE_BASE_URL,
  getSessionToken,
  getSession,
  getCharacters,
  authenticatedFetch,
  invalidateCharacterCache,
} from './postgrestAPI';
import { Form } from 'react-bootstrap';
import { Loader2, UserPlus, Plus, X, Copy } from 'lucide-react';
import { Button } from '@/Components/Button';
import { AvatarCard, CreateAvatarCard } from '@/Components/AvatarCard';
import { useAvatarLivestream } from './contexts/AvatarLivestreamContext';
import { useConfig } from './contexts/ConfigContext';

// Embed Modal Component
const EmbedModal = ({ avatar, onClose }) => {
  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe
  src="${VITE_BASE_URL}/embed/${avatar.id}"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen>
</iframe>`;
  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-text-primary">Embed Avatar: {avatar.name}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-text-secondary mb-2">Copy this code to embed your avatar on any website:</p>
          <div className="bg-bg-primary border border-border-subtle rounded-lg p-4 font-mono text-sm text-text-primary overflow-x-auto">
            <pre>{embedCode}</pre>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
          <p className="text-yellow-300 text-sm">
            <strong>Note:</strong> This is a placeholder embed code.
          </p>
        </div>
      </div>
    </div>
  );
};




const CharPage = () => {
  const navigate = useNavigate();
  const { createSession } = useAvatarLivestream();
  const { applyAvatarSession } = useConfig();
  const [characters, setcharacters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        setIsLoading(true);
        const data = await getCharacters();
        setcharacters(data || []);
      } catch (error) {
        console.error(`Error getting characters:`, error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCharacters();
  }, []);

  const handleEdit = (avatar) => {
    // Show embed modal
    setSelectedAvatar(avatar);
    setShowEmbedModal(true);
  };

  const handlePlay = async (avatar) => {
    try {
      applyAvatarSession(avatar);

      const config = {
        avatar: avatar.id,
        environment: 'Map_Env_ltAvatarOS',
        camera: { preset: 'Preset1' },
        a2f_config: avatar.a2f_config || {},
        voice_config: avatar.voice_config || {},
        llm_config: avatar.llm_config || {},
        unreal_config: avatar.unreal_config || {},
      };

      const sessionId = await createSession(config);
      navigate(`/console/conversational-ai/${sessionId}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert(`Failed to create session: ${error.message}`);
    }
  };

  const handleCreate = () => {
    // Navigate to Interactive Agent page for avatar creation and settings
    navigate('/console/trainer');
  };

  const handleCharacterCreated = (newCharacter) => {
    setcharacters((prev) => [...(prev || []), newCharacter]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <Loader2 className="animate-spin text-accent-mint mb-3" size={32} />
        <p className="text-text-secondary">Loading avatars...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="gradient-text text-3xl font-bold mb-2">My Avatars</h2>
          <p className="text-text-secondary">Manage your 3D avatar collection</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Avatar
        </Button>
      </div>

      {/* Avatar Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.isArray(characters) &&
          characters.map((character) => (
            <AvatarCard
              key={character.id}
              avatar={character}
              onEdit={handleEdit}
              onPlay={handlePlay}
            />
          ))}

        {/* Create New Avatar Card */}
        <CreateAvatarCard onCreate={handleCreate} />
      </div>

      {!characters?.length && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-accent-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-accent-mint" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-text-primary">No avatars yet</h3>
          <p className="text-text-secondary mb-4">Create your first 3D avatar to get started</p>
          <Button variant="primary" onClick={handleCreate}>
            Create Your First Avatar
          </Button>
        </div>
      )}


      {/* Embed Modal */}
      {showEmbedModal && selectedAvatar && (
        <EmbedModal
          avatar={selectedAvatar}
          onClose={() => {
            setShowEmbedModal(false);
            setSelectedAvatar(null);
          }}
        />
      )}
    </div>
  );
};

export default CharPage;
