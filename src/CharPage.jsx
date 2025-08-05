import React, { useState, useEffect } from 'react';
import { githubDarkTheme, JsonEditor } from 'json-edit-react';
import { updateCharacter, API_BASE_URL, getSessionToken, getSession } from './postgrestAPI';
import { Form, Card, Alert } from 'react-bootstrap';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/Components/Button';

const styles = {
  voiceSelector: {
    // display: 'flex',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    padding: '10px',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '10px',
  },
};

const CharCreator = () => {
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
      return createdCharacter;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const handleCreateChar = async () => {
    try {
      // await createCharacter({
      //   ...newChar,
      //   unreal_config: JSON.parse(newChar.unreal_config),
      //   llm_config: JSON.parse(newChar.llm_config),
      //   voice_config: JSON.parse(newChar.voice_config),
      //   a2f_config: JSON.parse(newChar.a2f_config)
      // });
      await createCharacter(newChar);
      // Reset form after creation
      setNewChar({
        name: '',
        unreal_config: '{}',
        llm_config: '{}',
        voice_config: '{}',
        a2f_config: '{}',
        available: false,
      });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl">
        <div className="border-b border-border-subtle p-4">
          <h3 className="flex items-center text-accent-mint font-semibold mb-0">
            <UserPlus className="mr-2" size={20} />
            Create New Avatar
          </h3>
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
  const [characters, setcharacters] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchCharacters() {
      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/characters`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getSessionToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setcharacters(data || []);
      } catch (error) {
        console.error(`Error getting characters:`, error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCharacters();
  }, []);

  const handleJsonUpdate = async (id, key, data) => {
    console.log('handleJsonUpdate', id, key);
    console.log('handleJsonUpdate', data.newData);
    try {
      // TODO: catch errors
      updateCharacter(id, key, data.newData);

      setcharacters((prevChars) => prevChars.map((char) => (char.id === id ? { ...char, [key]: data.newData } : char)));
    } catch (error) {
      console.error('Error updating character:', error);
    }
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
      <h2 className="gradient-text text-3xl font-bold mb-6">Avatar Editor</h2>

      <div className="flex flex-col gap-4">
        {Array.isArray(characters) &&
          characters.map((character) => (
            <div
              key={character.id}
              className="bg-bg-secondary backdrop-blur-sm border border-border-subtle rounded-xl transition-all duration-300 hover:border-accent-mint/50 hover:shadow-lg hover:shadow-accent-mint/10 hover:-translate-y-1 p-4"
            >
              <h3 className="text-lg font-semibold text-text-primary">{character.name}</h3>
              <div className="mt-2 flex flex-col gap-[5px]">
                <p className="text-text-secondary text-sm">ID: {character.id}</p>

                {/* Add more character details here as needed */}
                {Object.entries(character)
                  .filter(([key]) => !['id'].includes(key))
                  .map(([key, value]) => {
                    const renderField = () => {
                      switch (typeof value) {
                        case 'object':
                          return (
                            <JsonEditor
                              data={value}
                              collapse={true}
                              rootName={key}
                              theme={githubDarkTheme}
                              onUpdate={(data) => handleJsonUpdate(character.id, key, data)}
                            />
                          );
                        case 'boolean':
                          return (
                            <Form.Check
                              type="switch"
                              id={`${character.id}-${key}`}
                              label={key}
                              checked={value}
                              onChange={(e) => handleJsonUpdate(character.id, key, { newData: e.target.checked })}
                            />
                          );
                        default:
                          return (
                            <div>
                              <span className="font-medium">{key}: </span>
                              <span className="font-medium">
                                <input
                                  style={styles.voiceSelector}
                                  type="text"
                                  value={value.toString()}
                                  onChange={(e) => handleJsonUpdate(character.id, key, { newData: e.target.value })}
                                />
                              </span>
                            </div>
                          );
                      }
                    };

                    return (
                      <div key={key} className="text-sm">
                        {renderField()}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
      </div>

      <CharCreator />
    </div>
  );
};

export default CharPage;
