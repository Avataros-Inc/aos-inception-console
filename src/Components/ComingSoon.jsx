import React from 'react';

export const ComingSoonCard = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-xl max-w-md text-center">
        <h2 className="text-4xl font-bold text-white mb-3">🚀 Coming Soon</h2>
        <h3 className="text-lg text-slate-400 mb-4">We're working on something awesome!</h3>
        <p className="text-slate-300 mb-6">Keep an eye out for the update or reach out for potential early access</p>
        <div className="text-sm text-slate-500 pt-4 border-t border-slate-700">Launching in 2025</div>
      </div>
    </div>
  );
};

export const AlphaCard = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-8 shadow-xl max-w-md text-center">
        <h2 className="text-4xl font-bold text-emerald-400 mb-3">
          <span
            className="grayscale brightness-125 saturate-150"
            style={{ filter: 'hue-rotate(90deg) sepia(1) saturate(2) hue-rotate(90deg) brightness(1.2)' }}
          >
            ⚠️
          </span>{' '}
          Alpha Version
        </h2>
        <h3 className="text-lg text-emerald-300 mb-4">This is an early alpha release</h3>
        <p className="text-emerald-200 mb-6">
          Expect broken functionality and incomplete features.
          <br />
          Please report issues to: <strong className="text-emerald-100">tech@avataros.com</strong>
        </p>
        <div className="text-sm text-emerald-600 pt-4 border-t border-emerald-700">Under active development</div>
      </div>
    </div>
  );
};
