import React, { useState } from 'react';

// const environments = [
//   { id: 'Map_Env_ltOliverDefault_v01', name: 'Oliver Lighting' },
//   { id: 'Map_Env_ltDefault', name: 'Default Lighting' },
//   { id: 'Map_Env_ltHardLight', name: 'Hard Lighting' },
//   { id: 'Map_Env_ltSideSoft_02', name: 'Soft Lighting' },
//   { id: 'Map_Env_ltSubtleFrontLit', name: 'Intimate Lighting' },
//   { id: 'Map_Env_ltWarmNatural', name: 'Warm Lighting' },
//   { id: 'Map_Env_ltOriginal_01', name: 'Original Lighting' },
//   { id: 'Map_Env_ltCreepySpotlight_01', name: 'Story Time' },
//   { id: 'Map_Env_ltBalanced', name: 'Balanced Lighting' },
//   { id: 'Map_Env_ltLoopLighting_02', name: 'Loop Lighting' },
// ];

const LiveControlsTab = ({ sendMessage = null }) => {
  // const [selectedEnvironment, setSelectedEnvironment] = useState(environments[0].id);
  // const [expandedEnv, setExpandedEnv] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const handleCameraControl = (cmd) => {
    if (sendMessage) {
      try {
        const message = JSON.stringify({ type: 'camera', content: cmd });
        sendMessage(message);
        console.log('Camera command sent:', cmd);
      } catch (error) {
        console.error('Error sending camera command:', error);
      }
    } else {
      console.warn('sendMessage not available - WebSocket may not be connected yet');
    }
  };

  // TODO: Check back with eng on correct message format for environment change
  // const handleEnvironmentChange = (envId) => {
  //   setSelectedEnvironment(envId);
  //   if (sendMessage) {
  //     try {
  //       const message = JSON.stringify({
  //         type: 'cmd',
  //         content: JSON.stringify({ 'Environment.Path': envId }),
  //       });
  //       sendMessage(message);
  //       console.log('Environment command sent:', message);
  //     } catch (error) {
  //       console.error('Error sending environment command:', error);
  //     }
  //   }
  // };

  return (
    <div className="space-y-6">
      {/* TODO: Environment Visuals and change are disabled until backend message format is clarified */}
      {/*
      <div className="space-y-2">
        ...existing code...
      </div>
      */}

      {/* Manual Controls */}
      <div className="space-y-4">
        <h6 className="text-slate-300 text-xl font-bold">Manual Controls</h6>

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
            onMouseUp={() => handleCameraControl('reset')}
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

        {/* Quick Preset Buttons - with thumbnails and style */}
        <div className="grid grid-cols-3 gap-3">
          {Array(9)
            .fill(0)
            .map((_, index) => {
              const presetId = `Preset${index + 1}`;
              return (
                <button
                  key={presetId}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 bg-slate-800 ${
                    selectedPreset === presetId
                      ? 'border-accent-mint shadow-lg shadow-accent-mint/20'
                      : 'border-slate-600 hover:border-slate-400'
                  }`}
                  onClick={() => {
                    handleCameraControl(presetId);
                    setSelectedPreset(presetId);
                  }}
                  style={{ padding: 0 }}
                >
                  <div className="aspect-square relative">
                    <img
                      src={`/thumbnails/presets/${presetId}.png`}
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
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default LiveControlsTab;
