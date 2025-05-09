import React, { useState, useEffect } from 'react';
import { JsonEditor } from 'json-edit-react'
import { updateCharacter, API_BASE_URL, getSessionToken, getSession } from './postgrestAPI';
import { Form, Button, Card, Alert } from 'react-bootstrap';

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
    available: false
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
          'Authorization': `Bearer ${getSessionToken()}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(characterData)
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
        available: false
      });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>

      <Card className="mt-4">
        <Card.Header>Create New Avatar</Card.Header>
        <Card.Body>

        {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          {success}
        </Alert>
      )}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newChar.name}
                onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
              />
            </Form.Group>

            {['unreal_config', 'llm_config', 'voice_config', 'a2f_config'].map((configKey) => (
              <Form.Group key={configKey} className="mb-3">
                <Form.Label>{configKey.replace('_', ' ').toUpperCase()}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newChar[configKey]}
                  onChange={(e) => setNewChar({ ...newChar, [configKey]: e.target.value })}
                  placeholder={`Enter valid JSON for ${configKey}`}
                />
              </Form.Group>
            ))}

            <Form.Check
              type="switch"
              id="available-switch"
              label="Available"
              checked={newChar.available}
              onChange={(e) => setNewChar({ ...newChar, available: e.target.checked })}
              className="mb-3"
            />

            <Button variant="primary" onClick={handleCreateChar}>
              Create Avatar
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};


const CharPage = ({ cachedCharacters = [] }) => {
  const [characters, setcharacters] = useState(null);
  useEffect(() => {
    async function fetchCharacters() {
    try {
      const response = await fetch(`${API_BASE_URL}/characters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getSessionToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setcharacters(data || []);

    } catch (error) {
      console.error(`Error getting characters:`, error);
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

    setcharacters(prevChars => 
      prevChars.map(char => 
        char.id === id ? { ...char, [key]: data.newData } : char
      ));

    } catch (error) {
      console.error('Error updating character:', error);
    }

  };

  return (
    <div>
      <h2>Avatar Editor</h2>

      {Array.isArray(characters) && characters.map(character => (
        <div
          key={character.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
        >
          <h3 className="text-lg font-semibold">{character.name}</h3>
          <div className="mt-2">
            <p className="text-gray-600 text-sm">ID: {character.id}</p>

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
                          className="mb-2"
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
              })
            }
          </div>
        </div>
      ))}

      <CharCreator />
    </div>
  );
};

export default CharPage;