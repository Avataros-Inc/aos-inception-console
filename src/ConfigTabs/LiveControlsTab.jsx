import React, { useState } from 'react';
import { cn } from '@/lib/utils';

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

const LiveControlsTab = ({ updateConfig, config, sendMessage = null }) => {
  const [expandedSections, setExpandedSections] = useState({
    environment: true,
    camera: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const cameraPreset = config.camera?.preset || 'Preset1';
  const selectedEnvironment = config.environment || 'Map_Env_ltOliverDefault_v01';

  const handleCameraControl = (cmd) => {
    if (sendMessage) {
      sendMessage(JSON.stringify({ type: 'camera', content: cmd }));
    }
  };

  const handleEnvironmentChange = (envId) => {
    updateConfig('environment', envId);
    if (sendMessage) {
      sendMessage(JSON.stringify({ type: 'environment', content: envId }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment Selection */}
      <div className="mb-6">
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
                onClick={() => handleEnvironmentChange(env.id)}
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
        ) : (
          <div
            className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={() => toggleSection('environment')}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-600">
              <img
                src={`/thumbnails/environment/${selectedEnvironment}.png`}
                alt={environments.find((env) => env.id === selectedEnvironment)?.name || 'Environment'}
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
              {environments.find((env) => env.id === selectedEnvironment)?.name || 'Select Environment'}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Camera Section */}
      <div className="mb-6">
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
          <div className="space-y-6">
            {/* Camera Presets */}
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
                      onClick={() => {
                        updateConfig('camera', { preset: presetId });
                        handleCameraControl(presetId);
                      }}
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

            {/* Camera Controls */}
            <div className="space-y-4">
              <h6 className="text-slate-300 text-lg font-bold">Manual Controls</h6>

              {/* Movement Controls */}
              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                <div></div>
                <button
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                  onMouseDown={() => handleCameraControl('moveup')}
                  onMouseUp={() => handleCameraControl('movestop')}
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <div></div>

                <button
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                  onMouseDown={() => handleCameraControl('moveleft')}
                  onMouseUp={() => handleCameraControl('movestop')}
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                  onClick={() => handleCameraControl('reset')}
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                <button
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                  onMouseDown={() => handleCameraControl('moveright')}
                  onMouseUp={() => handleCameraControl('movestop')}
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div></div>
                <button
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
                  onMouseDown={() => handleCameraControl('movedown')}
                  onMouseUp={() => handleCameraControl('movestop')}
                >
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div></div>
              </div>

              {/* Zoom Controls */}
              <div className="flex justify-center gap-4">
                <button
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex items-center gap-2"
                  onMouseDown={() => handleCameraControl('zoomin')}
                  onMouseUp={() => handleCameraControl('zoomstop')}
                >
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                  <span className="text-slate-300 text-sm">Zoom In</span>
                </button>

                <button
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors flex items-center gap-2"
                  onMouseDown={() => handleCameraControl('zoomout')}
                  onMouseUp={() => handleCameraControl('zoomstop')}
                >
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                    />
                  </svg>
                  <span className="text-slate-300 text-sm">Zoom Out</span>
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {Array(9)
                  .fill(0)
                  .map((_, index) => (
                    <button
                      key={index}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors text-slate-300 text-sm"
                      onClick={() => handleCameraControl(`Preset${index + 1}`)}
                    >
                      P{index + 1}
                    </button>
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
            <span className="text-slate-300 text-sm flex-1">{cameraPreset.replace('Preset', 'Preset ')}</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveControlsTab;
