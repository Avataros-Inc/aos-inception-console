import React, { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { API_BASE_URL, authenticatedFetch } from '../postgrestAPI';

const styles = {
  voiceSelector: {
    backgroundColor: 'rgba(26, 33, 45, 0.5)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    padding: '12px',
  },
  settingGroup: {
    marginBottom: '20px',
  },
};

// Object.defineProperty(String.prototype, 'capitalize', {
//     value: function() {
//       return this.charAt(0).toUpperCase() + this.slice(1);
//     },
//     enumerable: false
//   });

const LLMConfigTab = ({ characters, updateConfig, config }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState(config.llm_config?.model || '');

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/v1/llm/models`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setModels(data.models || []);

        // Set default to first model if no model is configured
        if (data.models && data.models.length > 0 && !config.llm_config?.model) {
          setSelectedModelId(data.models[0].id);
          updateConfig('llm_config.model', data.models[0].id);
        } else if (config.llm_config?.model) {
          setSelectedModelId(config.llm_config.model);
        }
      } catch (error) {
        console.error('Failed to fetch LLM models:', error);
        // Fallback to a default model if fetch fails
        setModels([{ id: 'ollama-llama3.2', latency: 0, throughput: 0, speed: 'unknown' }]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Update selectedModelId when config.llm_config.model changes externally
  useEffect(() => {
    if (config.llm_config?.model && config.llm_config.model !== selectedModelId) {
      setSelectedModelId(config.llm_config.model);
    }
  }, [config.llm_config?.model]);

  const handleModelChange = (e) => {
    const newModelId = e.target.value;
    setSelectedModelId(newModelId);
    updateConfig('llm_config.model', newModelId);
  };

  const getCharacterLLmConfig = (config, characters) => {
    const character = characters.find((char) => char.id === config.avatar);
    return character ? character.llm_config : null;
  };

  // Usage:
  const llmConfig = getCharacterLLmConfig(config, characters);

  // Get the currently selected model
  const selectedModel = models.find((model) => model.id === selectedModelId) || models[0];

  return (
    <>
      <div style={styles.settingGroup}>
        <h6 className="text-slate-300 text-xl font-bold mb-2">Model</h6>
        {loading ? (
          <div className="text-slate-400 p-3">Loading models...</div>
        ) : (
          <>
            <Form.Select
              aria-label="Select Model"
              onChange={handleModelChange}
              value={selectedModelId || (models.length > 0 ? models[0].id : '')}
              style={styles.voiceSelector}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id} • {model.speed}
                </option>
              ))}
            </Form.Select>
            {selectedModel && (
              <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-600">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Latency:</span>
                    <span className="text-slate-200 ml-2 font-medium">{selectedModel.latency}s</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Throughput:</span>
                    <span className="text-slate-200 ml-2 font-medium">{selectedModel.throughput} tok/s</span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-2">
                  💡 Faster models provide quicker responses and better real-time performance
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.settingGroup}>
        <h6 className="text-slate-300 text-xl font-bold mb-2">Prompt</h6>
        <Form.Control
          aria-label="Prompt"
          as="textarea"
          className="w-full p-3"
          defaultValue={llmConfig?.prompt}
          onChange={(e) => updateConfig('llm_config.prompt', e.target.value)}
          rows={10}
        />
      </div>
    </>
  );
};
export default LLMConfigTab;
