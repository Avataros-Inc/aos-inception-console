import React from 'react';
import { Form, Tabs, Tab, Accordion, DropdownButton, Dropdown } from 'react-bootstrap';
import { Button } from '@/Components/Button';

const styles = {};

Object.defineProperty(String.prototype, 'capitalize', {
  value: function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false,
});

const VisualConfigTab = ({ characters, updateConfig, config }) => {
  const cameraPreset = config.camera?.preset || 'Preset1';

  return (
    <>
      <div style={styles.settingGroup}>
        <h6>Avatar</h6>
        <div>
          <Form.Select
            aria-label="Select Avatar"
            onChange={(e) => updateConfig('avatar', e.target.value)}
            defaultValue={config.avatar}
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name.capitalize()}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <div style={styles.settingGroup}>
        <h6>Environment</h6>
        <div>
          <Form.Select
            aria-label="Select Environment"
            defaultValue={config.environment}
            onChange={(e) => updateConfig('environment', e.target.value)}
          >
            {/* <option value="Map_Env_Basic_01">Env_Basic_01</option>
            <option value="Map_Env_Basic_02">Env_Basic_02</option>
            <option value="Map_Env_ltBrightCommercial_01">Env_ltBrightCommercial_01</option>
            <option value="Map_Env_ltCreepySpotlight_01">Env_ltCreepySpotlight_01</option>
            <option value="Map_Env_ltPink_01">Env_ltPink_01</option>
            <option value="Map_Env_ltRichYellow_01">Env_ltRichYellow_01</option>
            <option value="Map_Env_ltScaryLighting_01">Env_ltScaryLighting_01</option>
            <option value="Map_Env_ltSideSoft_01">Env_ltSideSoft_01</option>
            <option value="Map_Env_ltSideSoft_02">Env_ltSideSoft_02</option>
            <option value="Map_Env_ltSoftLeftKey_01">Env_ltSoftLeftKey_01</option>
            <option value="Map_Env_ltWarmBackLight_01">Env_ltWarmBackLight_01</option>
            <option value="Map_Env_PPV-green_01">Env_PPV-green_01</option>
            <option value="Map_Env_PPVandSphere_01">Env_PPVandSphere_01</option> */}

            {/* FROM FLO */}
            <option value="Map_Env_ltOliverDefault_v01">Oliver Lighting</option>
            <option value="Map_Env_ltHardLight">Hard Lighting</option>
            <option value="Map_Env_ltSideSoft_02">Soft Lighting</option>
            <option value="Map_Env_ltStandard">Standard Lighting</option>
            <option value="Map_Env_ltSubtleFrontLit">Intimate Lighting</option>
            <option value="Map_Env_ltWarmNatural">Warm Lighting</option>
            <option value="Map_Env_ltOriginal_01">Original Lighting</option>
            <option value="Map_Env_ltCreepySpotlight_01">Story Time</option>
            <option value="Map_Env_ltBalanced">Balanced Lighting</option>
            <option value="Map_Env_ltLoopLighting_02">Loop Lighting</option>
          </Form.Select>
        </div>
      </div>

      <div style={styles.settingGroup}>
        <h6>Camera</h6>
        <div className="d-flex gap-2 mb-2">
          <Button
            variant={cameraPreset === 'Preset1' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateConfig('camera', { preset: 'Preset1' })}
          >
            Preset1
          </Button>
          <Button
            variant={cameraPreset === 'Preset2' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateConfig('camera', { preset: 'Preset2' })}
          >
            Preset2
          </Button>
          <Button
            variant={cameraPreset === 'Preset3' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateConfig('camera', { preset: 'Preset3' })}
          >
            Preset3
          </Button>
          <Button
            variant={cameraPreset === 'Preset4' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateConfig('camera', { preset: 'Preset4' })}
          >
            Preset4
          </Button>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <Form.Check type="switch" id="hd-export-switch" label="HD Export" />
      </div>
    </>
  );
};
export default VisualConfigTab;
