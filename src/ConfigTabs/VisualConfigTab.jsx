import React, { useState, useEffect } from 'react';
import { Form, Button, Tabs, Tab, Accordion, DropdownButton, Dropdown} from 'react-bootstrap';


const styles = {

};

Object.defineProperty(String.prototype, 'capitalize', {
    value: function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    },
    enumerable: false
  });


const VisualConfigTab = ({ characters, updateConfig, config }) => {
    


    return (

<>
<div style={styles.settingGroup}>
  <h6>Avatar</h6>
  <div style={styles.voiceSelector}>
  <Form.Select aria-label="Select Avatar" onChange={(e) => updateConfig("avatar", e.target.value)} defaultValue={config.avatar}>
  {characters.map(character => (
    <option key={character.id} value={character.id}>{character.name.capitalize()}</option>
  ))}

    </Form.Select>
    </div>
</div>

<div style={styles.settingGroup}>
  <h6>Environment</h6>
  <div style={styles.voiceSelector}>
    <Form.Select aria-label="Select Environment" defaultValue={config.environment}>
        <option value="Map_Env_Basic_01">Basic 01</option>
        <option value="Map_Env_Basic_02">Basic 02</option>
    </Form.Select>
  </div>
</div>

<div style={styles.settingGroup}>
  <h6>Framing</h6>
  <div className="d-flex gap-2 mb-2">
    <Button variant="outline-secondary" size="sm">Close-up</Button>
    <Button variant="primary" size="sm">Medium</Button>
    <Button variant="outline-secondary" size="sm">Wide</Button>
  </div>
</div>

<div style={styles.settingGroup}>
  <h6>Video Quality</h6>
  <div style={styles.sliderContainer}>
    <div style={styles.controlRow}>
      <span>Low</span>
      <span>High</span>
    </div>
    <Form.Range defaultValue={75} />
  </div>
</div>

<div className="d-flex justify-content-between mt-4">
  <Form.Check 
    type="switch"
    id="hd-export-switch"
    label="HD Export"
  />
</div>
</>        

    );
    };
export default VisualConfigTab;
