import React from 'react';
import { Form, Tabs, Tab, Accordion } from 'react-bootstrap';
import { Button } from '@/Components/Button';

const styles = {
  settingsCard: {
    border: 'none',
    borderRadius: '8px',
  },
  settingGroup: {
    marginBottom: '20px',
  },
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
  rightSidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '480px',
    height: '100vh',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e9ecef',
    padding: '20px',
    overflowY: 'auto',
    zIndex: 900,
  },
  mainContent: {
    // width:  '100%',
    paddingRight: '480px',
  },
};

const VoiceConfigTab = ({ updateConfig, config }) => {
  // Default values for eleven_multilingual_v2 voice settings
  const getElevenLabsSettings = () => {
    return (
      config.voice_config.eleven_labs_settings || {
        speed: 1.0,
        stability: 0.5,
        similarity: 100,
        style_exaggeration: 0,
        speaker_boost: false,
      }
    );
  };

  const updateElevenLabsSetting = (setting, value) => {
    updateConfig(`voice_config.eleven_labs_settings.${setting}`, value);
  };
  // const [model, setModel] = useState(config.voice_config.model_id);
  // const [voice, setVoice] = useState('Isaac Voice Test 002');

  const aosKokoVoices = [
    'af_heart',
    'af_alloy',
    'af_aoede',
    'af_bella',
    'af_jessica',
    'af_kore',
    'af_nicole',
    'af_nova',
    'af_river',
    'af_sarah',
    'af_sky',
    'am_adam',
    'am_echo',
    'am_eric',
    'am_fenrir',
    'am_liam',
    'am_michael',
    'am_onyx',
    'am_puck',
    'am_santa',
    'bf_alice',
    'bf_emma',
    'bf_isabella',
    'bf_lily',
    'bm_daniel',
    'bm_fable',
    'bm_george',
    'bm_lewis',
  ];

  return (
    <>
      <div style={styles.settingGroup}>
        <div className="slider-label">
          <span className="text-slate-300 text-xl font-bold mb-2">Model</span>
        </div>
        <Form.Select
          value={config.voice_config.model_id}
          onChange={(e) => updateConfig('voice_config.model_id', e.target.value)}
          style={styles.voiceSelector}
        >
          <option value="koko1">AOS Koko1</option>
          <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
        </Form.Select>
      </div>

      <div style={styles.settingGroup}>
        <div className="slider-label">
          <span className="text-slate-300 text-xl font-bold mb-2">Voice</span>
        </div>
        {config.voice_config.model_id === 'koko1' ? (
          <Form.Select
            value={config.voice_config.voice_id}
            onChange={(e) => updateConfig('voice_config.voice_id', e.target.value)}
            style={styles.voiceSelector}
          >
            {aosKokoVoices.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Form.Select>
        ) : (
          <Form.Control
            type="text"
            value={config.voice_config.voice_id || 'Isaac Voice Test 002'}
            onChange={(e) => updateConfig('voice_config.voice_id', e.target.value)}
            style={styles.voiceSelector}
            placeholder="Enter voice ID"
          />
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-slate-300 text-xl font-bold">Configuration</span>
        {config.voice_config.model_id !== 'koko1' && (
          <Button
            variant="ghost"
            className="text-secondary p-2"
            onClick={() => {
              updateConfig('voice_config.eleven_labs_settings', {
                speed: 1.0,
                stability: 0.5,
                similarity: 100,
                style_exaggeration: 0,
                speaker_boost: false,
              });
            }}
          >
            Reset values
          </Button>
        )}
      </div>
      {config.voice_config.model_id === 'koko1' ? (
        <div style={styles.settingGroup}>
          <div className="custom-slider-container">
            <div className="slider-label">
              <span>Speed</span>
              <span className="slider-value">{config.voice_config.voice_settings.speed}</span>
            </div>
            <Form.Range
              min={-3.0}
              max={3.0}
              step={0.1}
              value={config.voice_config.voice_settings.speed}
              onChange={(e) => updateConfig('voice_config.voice_settings.speed', e.target.value)}
            />
            <div className="slider-range-labels">
              <span>Slower (-3.0)</span>
              <span>Faster (3.0)</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.settingGroup}>
            <div className="custom-slider-container">
              <div className="slider-label">
                <span>Speed</span>
                <span className="slider-value">{getElevenLabsSettings().speed}</span>
              </div>
              <Form.Range
                min={0.25}
                max={4.0}
                step={0.05}
                value={getElevenLabsSettings().speed}
                onChange={(e) => updateElevenLabsSetting('speed', parseFloat(e.target.value))}
              />
              <div className="slider-range-labels">
                <span>Slower (0.25x)</span>
                <span>Faster (4.0x)</span>
              </div>
            </div>
          </div>

          <div style={styles.settingGroup}>
            <div className="custom-slider-container">
              <div className="slider-label">
                <span>Stability</span>
                <span className="slider-value">{getElevenLabsSettings().stability}</span>
              </div>
              <Form.Range
                min={0}
                max={1}
                step={0.01}
                value={getElevenLabsSettings().stability}
                onChange={(e) => updateElevenLabsSetting('stability', parseFloat(e.target.value))}
              />
              <div className="slider-range-labels">
                <span>More variable (0)</span>
                <span>More stable (1)</span>
              </div>
            </div>
          </div>

          <div style={styles.settingGroup}>
            <div className="custom-slider-container">
              <div className="slider-label">
                <span>Similarity</span>
                <span className="slider-value">{getElevenLabsSettings().similarity}</span>
              </div>
              <Form.Range
                min={0}
                max={100}
                step={1}
                value={getElevenLabsSettings().similarity}
                onChange={(e) => updateElevenLabsSetting('similarity', parseInt(e.target.value))}
              />
              <div className="slider-range-labels">
                <span>Low (0)</span>
                <span>High (100)</span>
              </div>
            </div>
          </div>

          <div style={styles.settingGroup}>
            <div className="custom-slider-container">
              <div className="slider-label">
                <span>Style Exaggeration</span>
                <span className="slider-value">{getElevenLabsSettings().style_exaggeration}</span>
              </div>
              <Form.Range
                min={0}
                max={100}
                step={1}
                value={getElevenLabsSettings().style_exaggeration}
                onChange={(e) => updateElevenLabsSetting('style_exaggeration', parseInt(e.target.value))}
              />
              <div className="slider-range-labels">
                <span>None (0)</span>
                <span>Exaggerated (100)</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between" style={{ width: '200px' }}>
            <span className="text-white text-sm font-medium">Speaker boost</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={getElevenLabsSettings().speaker_boost}
                onChange={(e) => updateElevenLabsSetting('speaker_boost', e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-mint rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-mint"></div>
            </label>
          </div>
        </>
      )}
    </>
  );
};

export default VoiceConfigTab;
