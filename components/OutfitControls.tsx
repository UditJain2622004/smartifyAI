
import React from 'react';
import { Mode } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface OutfitControlsProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  purpose: string;
  setPurpose: (purpose: string) => void;
  onSuggest: () => void;
  isLoading: boolean;
}

const OutfitControls: React.FC<OutfitControlsProps> = ({ mode, setMode, purpose, setPurpose, onSuggest, isLoading }) => {
  const modes = [
    { id: Mode.Full, label: 'Full Closet' },
    { id: Mode.Selective, label: 'Selective' },
    { id: Mode.Exclusion, label: 'Exclusion' },
  ];

  return (
    <div className="p-5 md:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur shadow-sm space-y-5 md:space-y-6">
      <h2 className="text-lg md:text-xl font-semibold mb-2">How should we choose your outfit?</h2>
      {/* Mode Switcher */}
      <div>
        {/* <label className="text-sm font-medium mb-2 block">Choose a Mode</label> */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 ring-1 ring-black/5 dark:ring-white/10">
          {modes.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none ${
                mode === id 
                ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow' 
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200/70 dark:hover:bg-gray-700/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {mode === Mode.Full && "Use all items in your closet. Scroll down to see your closet."}
            {mode === Mode.Selective && "Only use items you specifically select. Scroll down to see your closet and select items to include."}
            {mode === Mode.Exclusion && "Use all items except those you exclude. Scroll down to see your closet and select items to exclude."}
        </p>
      </div>

      {/* Purpose Input */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium mb-2">What's the occasion?</label>
        <input
          type="text"
          name="purpose"
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 sm:text-sm"
          placeholder="e.g., Casual day out, Work meeting"
        />
      </div>

      {/* Suggest Button (hidden on mobile; App shows a floating CTA) */}
      <button
        onClick={onSuggest}
        disabled={isLoading}
        className="hidden lg:flex items-center justify-center w-full px-6 py-3 text-base font-semibold rounded-2xl text-white shadow bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2" />
            Suggest an Outfit
          </>
        )}
      </button>
    </div>
  );
};

export default OutfitControls;
