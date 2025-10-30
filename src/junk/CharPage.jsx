//FELIPES BULLSHIT BEFORE I CLEANED

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  updateCharacter,
  API_BASE_URL,
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
  const { getEmbedCode } = useAvatarLivestream();
  const [copied, setCopied] = useState(false);

  const embedCode = getEmbedCode(avatar);
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

const CharCreator = ({ onClose, onCharacterCreated }) => {
  const [newChar, setNewChar] = useState({
    name: '',
    unreal_config: '{}',
    llm_config: '{}',
    voice_config: '{}',
    a2f_config: '{}',
    available: false,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const createCharacter = async (characterData) => {
    try {
      setError(null);
      setSuccess(null);

      // Validate JSON fields
      const jsonFields = ['unreal_config', 'llm_config', 'voice_config', 'a2f_config'];
      for (const field of jsonFields) {
        JSON.parse(characterData[field]); // Will throw if invalid
      }

      characterData.creator_id = getSession().org_id;
      console.log(characterData);

      const response = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getSessionToken()}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create character');
      }

      const createdCharacter = await response.json();
      setSuccess(`Character "${createdCharacter[0]?.name}" created successfully!`);

      // Reset form after creation
      setNewChar({
        name: '',
        unreal_config: '{}',
        llm_config: '{}',
        voice_config: '{}',
        a2f_config: '{}',
        available: false,
      });

      // Notify parent component and close
      if (onCharacterCreated) {
        onCharacterCreated(createdCharacter[0]);
      }

      // Close after a short delay to show success message
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);

      return createdCharacter;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const handleCreateChar = async () => {
    try {
      await createCharacter(newChar);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl">
        <div className="border-b border-border-subtle p-4 flex justify-between items-center">
          <h3 className="flex items-center text-accent-mint font-semibold mb-0">
            <UserPlus className="mr-2" size={20} />
            Create New Avatar
          </h3>
          {onClose && (
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 mb-4">
              <p className="text-red-300 mb-0">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 mb-4">
              <p className="text-green-300 mb-0">{success}</p>
            </div>
          )}

          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="block text-text-secondary font-medium mb-2">Name</Form.Label>
              <Form.Control
                type="text"
                value={newChar.name}
                onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                placeholder="Enter avatar name"
                className="w-full px-3 py-2 bg-bg-secondary border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-mint focus:border-accent-mint"
              />
            </Form.Group>

            {['unreal_config', 'llm_config', 'voice_config', 'a2f_config'].map((configKey) => (
              <Form.Group key={configKey} className="mb-4">
                <Form.Label className="block text-text-secondary font-medium mb-2">
                  {configKey.replace('_', ' ').toUpperCase()}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newChar[configKey]}
                  onChange={(e) => setNewChar({ ...newChar, [configKey]: e.target.value })}
                  placeholder={`Enter valid JSON for ${configKey}`}
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-subtle rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-mint focus:border-accent-mint font-mono text-sm"
                />
              </Form.Group>
            ))}

            <Form.Group className="mb-4">
              <Form.Check
                type="switch"
                id="available-switch"
                label="Available"
                checked={newChar.available}
                onChange={(e) => setNewChar({ ...newChar, available: e.target.checked })}
                className="text-text-secondary"
              />
            </Form.Group>

            <Button variant="primary" onClick={handleCreateChar}>
              Create Avatar
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

const CharPage = () => {
  const navigate = useNavigate();
  const { launchLivestream } = useAvatarLivestream();
  const { applyAvatarSession } = useConfig();
  const [characters, setcharacters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
    console.log('CharPage: handlePlay called for avatar:', avatar.name);

    try {
      // Apply avatar configuration first - this updates the ConfigContext
      applyAvatarSession(avatar);

      // Create the updated config based on the avatar
      const updatedConfig = {
        avatar: avatar.id,
        environment: 'Map_Env_ltOliverDefault_v01', // Keep default environment
        camera: { preset: 'Preset1' }, // Keep default camera
        a2f_config: avatar.a2f_config || {},
        voice_config: avatar.voice_config || {},
        llm_config: avatar.llm_config || {},
        unreal_config: avatar.unreal_config || {},
      };

      console.log('CharPage: Updated config for launching session:', updatedConfig);

      // Launch session with the updated config and WAIT for it to complete
      console.log('CharPage: Creating session...');
      const session = await launchLivestream(updatedConfig);

      console.log('CharPage: Session response:', session);
      console.log('CharPage: Session keys:', session ? Object.keys(session) : 'null');

      // Check for session ID in the returned object
      const sessionId = session?.id || session?.session_id || session?.livestream_id;

      if (sessionId) {
        console.log('CharPage: Session created successfully with ID:', sessionId);
        // Navigate to the session-specific URL
        navigate(`/console/conversational-ai/${sessionId}`);
      } else {
        console.error('CharPage: Session creation failed - no session ID found in response:', session);
        // Still navigate but without session ID
        navigate('/console/conversational-ai');
      }
    } catch (error) {
      console.error('CharPage: Failed to launch session:', error);
      // Show error but still allow navigation
      alert(`Failed to create session: ${error.message}`);
      navigate('/console/conversational-ai');
    }
  };

  const handleDelete = async (avatarId) => {
    if (confirm('Are you sure you want to delete this avatar?')) {
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/characters?id=eq.${avatarId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setcharacters((prev) => prev.filter((char) => char.id !== avatarId));
          invalidateCharacterCache();
        }
      } catch (error) {
        console.error('Failed to delete avatar:', error);
      }
    }
  };

  const handleDuplicate = async (avatar) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          ...avatar,
          name: `${avatar.name} (Copy)`,
          id: undefined, // Remove ID so it gets auto-generated
        }),
      });
      if (response.ok) {
        const newChar = await response.json();
        setcharacters((prev) => [...prev, ...newChar]);
        invalidateCharacterCache();
      }
    } catch (error) {
      console.error('Failed to duplicate avatar:', error);
    }
  };

  const handleUpdateName = async (avatarId, name) => {
    try {
      await updateCharacter(avatarId, 'name', name);
      setcharacters((prev) => prev.map((char) => (char.id === avatarId ? { ...char, name } : char)));
    } catch (error) {
      console.error('Failed to update name:', error);
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
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onUpdateName={handleUpdateName}
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

      {/* Create Form Modal/Expandable Section */}
      {showCreateForm && (
        <div className="mt-8">
          <CharCreator onClose={() => setShowCreateForm(false)} onCharacterCreated={handleCharacterCreated} />
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
