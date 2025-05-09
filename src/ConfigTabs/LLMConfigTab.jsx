import React, { useState, useEffect } from 'react';
import { Form, Button, Tabs, Tab, Accordion, DropdownButton, Dropdown } from 'react-bootstrap';


const styles = {

};

// Object.defineProperty(String.prototype, 'capitalize', {
//     value: function() {
//       return this.charAt(0).toUpperCase() + this.slice(1);
//     },
//     enumerable: false
//   });


const LLMConfigTab = ({ characters, updateConfig, config }) => {

  const models = [
    { id: 'ollama-llama3.2', name: "Llama 3.2" },
  ]
  const getCharacterLLmConfig = (config, characters) => {
    const character = characters.find(char => char.id === config.avatar);
    return character ? character.llm_config : null;
  };
  
  // Usage:
  const llmConfig = getCharacterLLmConfig(config, characters);

  return (

    <>
      <div style={styles.settingGroup}>
        <h6>Model</h6>
        <div style={styles.voiceSelector}>
          <Form.Select aria-label="Select Avatar" onChange={(e) => updateConfig("avatar", e.target.value)} defaultValue={config.avatar}>
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}

          </Form.Select>
        </div>
      </div>

      <div style={styles.settingGroup}>
        <h6>Prompt</h6>
        <div style={styles.voiceSelector}>
          <Form.Control aria-label="Prompt"
            as="textarea"
            defaultValue={llmConfig?.prompt}
            rows={10}
          />
        </div>
      </div>

    </>

  );
};
export default LLMConfigTab;
