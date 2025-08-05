import React, { useState } from 'react';
import { Form, Tabs, Tab, Accordion } from 'react-bootstrap';
import _ from 'lodash';

import { Button } from '@/Components/Button';

// Helper function to generate appropriate input control based on value type
const generateControlForValue = (
  key,
  value,
  path,
  updateValue,
  min = 0,
  max = value > 5 ? value * 2 : 5,
  step = typeof value === 'number' ? (value < 0.1 ? 0.001 : 0.01) : 1
) => {
  const id = path.join('_');

  if (typeof value === 'boolean') {
    return (
      <div className="mb-3" key={id}>
        <div className="custom-slider-container">
          <Form.Check
            type="switch"
            id={id}
            label={key}
            checked={value}
            onChange={(e) => updateValue(path, e.target.checked)}
          />
        </div>
      </div>
    );
  } else if (typeof value === 'number') {
    // Determine if it's likely an integer or float
    const isInteger = Number.isInteger(value);
    const actualStep = isInteger ? 1 : step;

    return (
      <div className="mb-3" key={id}>
        <div className="custom-slider-container">
          <div className="slider-label">
            <span>{key}</span>
            <span className="slider-value">{value.toFixed(isInteger ? 0 : 3)}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Form.Range
              id={id}
              value={value}
              min={min}
              max={max}
              step={actualStep}
              onChange={(e) => updateValue(path, parseFloat(e.target.value))}
              className="flex-grow-1"
            />
            <Form.Control
              type="number"
              value={value}
              min={min}
              max={max}
              step={actualStep}
              onChange={(e) => updateValue(path, parseFloat(e.target.value))}
              style={{ width: '90px' }}
              size="sm"
            />
          </div>
          <div className="slider-range-labels">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </div>
    );
  } else if (typeof value === 'string') {
    return (
      <div className="mb-3" key={id}>
        <div className="custom-slider-container">
          <div className="slider-label">
            <span>{key}</span>
          </div>
          <Form.Control type="text" id={id} value={value} onChange={(e) => updateValue(path, e.target.value)} />
        </div>
      </div>
    );
  } else {
    return null;
  }
};

// Recursively generate UI for nested objects
const generateUIForObject = (obj, path = [], updateValue) => {
  return Object.entries(obj).map(([key, value]) => {
    const currentPath = [...path, key];

    // If value is an object (but not an array), recurse
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div key={currentPath.join('_')} className="mb-4">
          <div className="custom-slider-container">
            <h6 className="border-bottom border-border-subtle pb-2 mb-3 text-text-primary fw-semibold">{key}</h6>
            <div className="ps-2">{generateUIForObject(value, currentPath, updateValue)}</div>
          </div>
        </div>
      );
    }

    // Generate control for primitive values
    return generateControlForValue(key, value, currentPath, updateValue);
  });
};

// Main component for A2F config editing
const A2FConfigEditor = ({ initialConfig, onConfigChange }) => {
  const [config, setConfig] = useState(initialConfig);

  // Update the configuration when a value changes
  const updateValue = (path, newValue) => {
    const newConfig = _.cloneDeep(config);
    _.set(newConfig, path, newValue);
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Handle configuration reset
  const handleReset = () => {
    setConfig(initialConfig);
    onConfigChange(initialConfig);
  };

  // Group blendshape parameters for better organization
  const renderBlendshapeSection = (section) => {
    if (!config.blendshape_parameters || !config.blendshape_parameters[section]) {
      return null;
    }

    // Group blendshapes by facial region for better organization
    const blendshapes = config.blendshape_parameters[section];

    // Group similar blendshapes together
    const groups = {
      Jaw: Object.entries(blendshapes).filter(([key]) => key.startsWith('Jaw')),
      Mouth: Object.entries(blendshapes).filter(([key]) => key.startsWith('Mouth')),
      Eye: Object.entries(blendshapes).filter(([key]) => key.startsWith('Eye')),
      Brow: Object.entries(blendshapes).filter(([key]) => key.startsWith('Brow')),
      Cheek: Object.entries(blendshapes).filter(([key]) => key.startsWith('Cheek')),
      Nose: Object.entries(blendshapes).filter(([key]) => key.startsWith('Nose')),
      Tongue: Object.entries(blendshapes).filter(([key]) => key.startsWith('Tongue')),
    };

    return (
      <Accordion className="mb-4">
        {Object.entries(groups).map(([groupName, blendshapeEntries]) => {
          if (blendshapeEntries.length === 0) return null;

          return (
            <Accordion.Item eventKey={`${section}_${groupName}`} key={`${section}_${groupName}`}>
              <Accordion.Header>{groupName} Controls</Accordion.Header>
              <Accordion.Body>
                {blendshapeEntries.map(([key, value]) => {
                  return generateControlForValue(
                    key,
                    value,
                    ['blendshape_parameters', section, key],
                    updateValue,
                    section === 'multipliers' ? 0 : -1,
                    section === 'multipliers' ? 3 : 1
                  );
                })}
              </Accordion.Body>
            </Accordion.Item>
          );
        })}
      </Accordion>
    );
  };

  return (
    <div className="a2f-config-editor">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="text-slate-300 text-xl font-bold mb-2">Configuration</h5>
        <Button variant="secondary" size="sm" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>

      <Tabs defaultActiveKey="face" className="mb-4">
        <Tab eventKey="face" title="Face Parameters">
          {config.face_parameters && generateUIForObject(config.face_parameters, ['face_parameters'], updateValue)}
        </Tab>

        <Tab eventKey="blendshape-offsets" title="Blendshape Offsets">
          {renderBlendshapeSection('offsets')}
        </Tab>

        <Tab eventKey="blendshape-multipliers" title="Blendshape Multipliers">
          {renderBlendshapeSection('multipliers')}
        </Tab>

        <Tab eventKey="post-processing" title="Post Processing">
          {config.post_processing_parameters &&
            generateUIForObject(config.post_processing_parameters, ['post_processing_parameters'], updateValue)}
        </Tab>
      </Tabs>

      <div className="d-flex justify-content-end">
        <Button variant="primary" onClick={() => onConfigChange(config)}>
          Apply Changes
        </Button>
        &nbsp;
        <Button variant="secondary" onClick={() => onConfigChange(config)}>
          Export Config
        </Button>
      </div>
    </div>
  );
};

// Usage example
const A2FConfigTab = ({ updateConfig, config }) => {
  const handleConfigChange = (newConfig) => {
    // console.log("Updated config:", JSON.stringify(newConfig, null, 2));
    // Here you would typically send this back to your application or API
    updateConfig('a2f_config', newConfig);
  };

  return <A2FConfigEditor initialConfig={config.a2f_config} onConfigChange={handleConfigChange} />;
};

export default A2FConfigTab;
