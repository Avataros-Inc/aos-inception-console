import React from 'react';

function AvatarPixelStreaming({ sessionId, authToken, apiBaseUrl }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900/50 text-slate-200">
      <div className="text-center space-y-2">
        <div className="text-lg font-semibold">Avatar Stream Placeholder</div>
        <div className="text-sm opacity-80">sessionId: {String(sessionId || '')}</div>
        <div className="text-sm opacity-80">apiBaseUrl: {String(apiBaseUrl || '')}</div>
      </div>
    </div>
  );
}

export default AvatarPixelStreaming;
