import React from 'react';
import { Form } from 'react-bootstrap';
import { cn } from '@/lib/utils';

const styles = {
  settingGroup: {
    marginBottom: '24px',
  },
  avatarSelect: {
    backgroundColor: '#1a1f2e',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#ffffff',
    padding: '12px',
    fontSize: '14px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
  },
};

Object.defineProperty(String.prototype, 'capitalize', {
  value: function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
  enumerable: false,
});

const environments = [
  { id: 'Map_Env_ltOliverDefault_v01', name: 'Oliver Lighting' },
  { id: 'Map_Env_ltDefault', name: 'Default Lighting' },
  { id: 'Map_Env_ltHardLight', name: 'Hard Lighting' },
  { id: 'Map_Env_ltSideSoft_02', name: 'Soft Lighting' },
  { id: 'Map_Env_ltSubtleFrontLit', name: 'Intimate Lighting' },
  { id: 'Map_Env_ltWarmNatural', name: 'Warm Lighting' },
  { id: 'Map_Env_ltOriginal_01', name: 'Original Lighting' },
  { id: 'Map_Env_ltCreepySpotlight_01', name: 'Story Time' },
  { id: 'Map_Env_ltBalanced', name: 'Balanced Lighting' },
  { id: 'Map_Env_ltLoopLighting_02', name: 'Loop Lighting' },
];

const VisualConfigTab = ({ characters, updateConfig, config }) => {
  const cameraPreset = config.camera?.preset || 'Preset1';
  const selectedEnvironment = config.environment || 'Map_Env_ltOliverDefault_v01';

  return (
    <div className="space-y-6">
      {/* Avatar Selection */}
      <div style={styles.settingGroup}>
        <h6 className="text-slate-300 text-xl font-bold mb-2">Avatar</h6>
        <div>
          <Form.Select
            aria-label="Select Avatar"
            onChange={(e) => updateConfig('avatar', e.target.value)}
            value={config.avatar}
            style={styles.avatarSelect}
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name.capitalize()}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {/* Environment Selection */}
      <div style={styles.settingGroup}>
        <h6 className="text-slate-300 text-xl font-bold mb-2">Environment</h6>
        <div className="grid grid-cols-3 gap-3">
          {environments.map((env) => (
            <div
              key={env.id}
              className={cn(
                'relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105',
                selectedEnvironment === env.id
                  ? 'border-accent-mint shadow-lg shadow-accent-mint/20'
                  : 'border-slate-600 hover:border-slate-400'
              )}
              onClick={() => updateConfig('environment', env.id)}
            >
              <div className="aspect-square relative">
                <img
                  src={`/thumbnails/environment/${env.id}.png`}
                  alt={env.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full bg-slate-800 items-center justify-center text-slate-400 text-xs">
                  No Preview
                </div>
              </div>
              <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                <span className="text-white text-xs font-medium">{env.name}</span>
              </div>
              {selectedEnvironment === env.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-accent-mint rounded-full border-2 border-white"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Camera Section */}
      <div style={styles.settingGroup}>
        <h6 className="text-slate-300 text-xl font-bold mb-2">Camera</h6>
        <div className="grid grid-cols-3 gap-3">
          {Array(9)
            .fill(0)
            .map((_, index) => {
              const presetId = `Preset${index + 1}`;
              return (
                <div
                  key={presetId}
                  className={cn(
                    'relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105',
                    cameraPreset === presetId
                      ? 'border-accent-mint shadow-lg shadow-accent-mint/20'
                      : 'border-slate-600 hover:border-slate-400'
                  )}
                  onClick={() => updateConfig('camera', { preset: presetId })}
                >
                  <div className="aspect-square relative">
                    <img
                      src={`/thumbnails/presets/Preset${index + 1}.png`}
                      alt={`Preset ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full bg-slate-800 items-center justify-center text-slate-400 text-xs">
                      No Preview
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                    <span className="text-white text-xs font-medium">Preset {index + 1}</span>
                  </div>
                  {cameraPreset === presetId && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-accent-mint rounded-full border-2 border-white"></div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* HD Export Section */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <span className="text-slate-300 text-xl font-bold mb-2">HD Export</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={config.hdExport || false}
            onChange={(e) => updateConfig('hdExport', e.target.checked)}
          />
          <div className="relative w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-mint rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-mint"></div>
        </label>
      </div>
    </div>
  );
};
export default VisualConfigTab;
