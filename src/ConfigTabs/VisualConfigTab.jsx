import React, { useState, useEffect, useMemo } from 'react';
import { Form } from 'react-bootstrap';
import { cn } from '@/lib/utils';
import { getEnvironments } from '../postgrestAPI';

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

const VisualConfigTab = ({ characters, updateConfig, config }) => {
  const [expandedSections, setExpandedSections] = useState({
    avatar: false,
    environment: false,
    camera: false,
  });
  const [environments, setEnvironments] = useState([]);

  // Fetch environments from API on component mount
  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        const apiEnvironments = await getEnvironments();
        // Transform API response to match expected format
        const formattedEnvironments = apiEnvironments.map((env) => ({
          id: env.id,
          name: env.name || env.id, // Use name if available, fallback to id
          path: env.path, // Include path for thumbnail loading
        }));
        setEnvironments(formattedEnvironments);
      } catch (error) {
        console.error('Failed to fetch environments, using fallback:', error);
        // Keep the fallback hardcoded environments
      }
    };

    fetchEnvironments();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Close dropdown after selection
  const handleSelect = (section, cb) => {
    cb();
    setExpandedSections((prev) => ({
      ...prev,
      [section]: false,
    }));
  };

  const cameraPreset = config.camera?.preset || 'Preset1';
  const selectedEnvironment = config.environment || 'Map_Env_ltAvatarOS';
  const selectedCharacter = characters.find((char) => char.id === config.avatar);

  // Memoize the selected environment object to avoid repeated lookups
  const selectedEnvironmentObj = useMemo(() => {
    return environments.find((env) => env.id === selectedEnvironment);
  }, [environments, selectedEnvironment]);

  return (
    <div className="space-y-6">
      {/* Avatar Selection */}
      <div style={styles.settingGroup}>
        <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => toggleSection('avatar')}>
          <h6 className="text-slate-300 text-xl font-bold">Avatar</h6>
          <svg
            className={cn(
              'w-5 h-5 text-slate-300 transition-transform duration-200',
              expandedSections.avatar ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {expandedSections.avatar ? (
          <div className="grid grid-cols-3 gap-3">
            {characters.map((character) => (
              <div
                key={character.id}
                className={cn(
                  'relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105',
                  config.avatar === character.id
                    ? 'border-accent-mint shadow-lg shadow-accent-mint/20'
                    : 'border-slate-600 hover:border-slate-400'
                )}
                onClick={() => handleSelect('avatar', () => updateConfig('avatar', character.id))}
              >
                <div className="aspect-square relative">
                  <img
                    src={`/thumbnails/characters/${character.name.toLowerCase()}.png`}
                    alt={character.name}
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
                  <span className="text-white text-xs font-medium">{character.name.capitalize()}</span>
                </div>
                {config.avatar === character.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-accent-mint rounded-full border-2 border-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => toggleSection('avatar')}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600">
              <img
                src={
                  selectedCharacter
                    ? `/thumbnails/characters/${selectedCharacter.name.toLowerCase()}.png`
                    : '/thumbnails/presets/Preset1.png'
                }
                alt={selectedCharacter?.name || 'Avatar'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full bg-slate-700 items-center justify-center text-slate-400 text-xs">
                No Preview
              </div>
            </div>
            <span className="text-slate-300 text-sm flex-1">
              {selectedCharacter?.name?.capitalize() || 'Select Avatar'}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
      {/* Environment Selection */}
      <div style={styles.settingGroup}>
        <div
          className="flex items-center justify-between cursor-pointer mb-2"
          onClick={() => toggleSection('environment')}
        >
          <h6 className="text-slate-300 text-xl font-bold">Environment</h6>
          <svg
            className={cn(
              'w-5 h-5 text-slate-300 transition-transform duration-200',
              expandedSections.environment ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {expandedSections.environment ? (
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
                onClick={() => handleSelect('environment', () => updateConfig('environment', env.id))}
              >
                <div className="aspect-square relative">
                  <img
                    src={`/thumbnails/environment/${env.path}.png`}
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
        ) : (
          <div
            className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => toggleSection('environment')}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600">
              {selectedEnvironmentObj ? (
                <>
                  <img
                    src={`/thumbnails/environment/${selectedEnvironmentObj.path}.png`}
                    alt={selectedEnvironmentObj.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden w-full h-full bg-slate-700 items-center justify-center text-slate-400 text-xs">
                    No Preview
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
                  Loading...
                </div>
              )}
            </div>
            <span className="text-slate-300 text-sm flex-1">
              {selectedEnvironmentObj?.name || 'Select Environment'}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Camera Section */}
      <div style={styles.settingGroup}>
        <div className="flex items-center justify-between cursor-pointer mb-2" onClick={() => toggleSection('camera')}>
          <h6 className="text-slate-300 text-xl font-bold">Camera</h6>
          <svg
            className={cn(
              'w-5 h-5 text-slate-300 transition-transform duration-200',
              expandedSections.camera ? 'rotate-180' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {expandedSections.camera ? (
          <div className="space-y-4">
            {/* Camera Presets */}
            <div>
              <h6 className="text-slate-300 text-lg font-medium mb-3">Camera Presets</h6>
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
                        onClick={() =>
                          handleSelect('camera', () => updateConfig('camera', { ...config.camera, preset: presetId }))
                        }
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

            {/* Resolution Selection */}
            <div>
              <h6 className="text-slate-300 text-lg font-medium mb-3">Resolution</h6>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '1920x1080', label: '1920×1080 (16:9)' },
                  { value: '1080x1080', label: '1080×1080 (1:1)' },
                  { value: '1080x1920', label: '1080×1920 (9:16)' },
                ].map((resolution) => (
                  <div
                    key={resolution.value}
                    className={cn(
                      'p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105',
                      (config.camera?.resolution || '1920x1080') === resolution.value
                        ? 'border-accent-mint bg-accent-mint/10'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-400'
                    )}
                    onClick={() => updateConfig('camera', { ...config.camera, resolution: resolution.value })}
                  >
                    <div className="text-center">
                      <div className="text-white font-medium text-sm mb-1">{resolution.label}</div>
                      <div className="text-slate-400 text-xs">{resolution.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => toggleSection('camera')}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600">
              <img
                src={`/thumbnails/presets/${cameraPreset}.png`}
                alt={cameraPreset}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-full h-full bg-slate-700 items-center justify-center text-slate-400 text-xs">
                No Preview
              </div>
            </div>
            <div className="flex-1">
              <span className="text-slate-300 text-sm">{cameraPreset.replace('Preset', 'Preset ')}</span>
              <div className="text-slate-400 text-xs">{config.camera?.resolution || '1920x1080'}</div>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
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
