import React from 'react';

/**
 * A beautiful, full-screen glassmorphic loading spinner overlay
 */
export const Loading = ({ message = 'Please wait...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="glass-card flex flex-col items-center justify-center p-8 rounded-2xl max-w-xs w-full text-center">
        {/* Animated Double Ring Spinner */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-brand-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-indigo-400/10 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-indigo-400 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        {/* Loading Text */}
        <p className="text-slate-200 text-base font-semibold tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Loading;
