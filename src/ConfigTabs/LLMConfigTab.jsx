import React from 'react';
import { Form } from 'react-bootstrap';

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
  const models = [{ id: 'ollama-llama3.2', name: 'Llama 3.2' }];
  const getCharacterLLmConfig = (config, characters) => {
    const character = characters.find((char) => char.id === config.avatar);
    return character ? character.llm_config : null;
  };

  // Usage:
  const llmConfig = getCharacterLLmConfig(config, characters);

  return (
    <>
      <div style={styles.settingGroup}>
        <h6 className="text-slate-300 text-xl font-bold mb-2">Model</h6>
        <Form.Select
          aria-label="Select Avatar"
          onChange={(e) => updateConfig('avatar', e.target.value)}
          defaultValue={config.avatar}
          style={styles.voiceSelector}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Form.Select>
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
