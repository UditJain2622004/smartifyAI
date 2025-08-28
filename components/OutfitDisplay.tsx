
import React from 'react';
import { ClosetItem } from '../types';
import { PhotoIcon } from './icons/EditorIcons';
import { TagIcon } from './icons/EditorIcons';

interface OutfitDisplayProps {
  generatedOutfit: { image: string; items: ClosetItem[] } | null;
  isLoading: boolean;
  showInlineUploader?: boolean;
  InlineUploaderSlot?: React.ReactNode;
}

const OutfitDisplay: React.FC<OutfitDisplayProps> = ({ generatedOutfit, isLoading, showInlineUploader, InlineUploaderSlot }) => {
  return (
    <div className="lg:sticky lg:top-8 p-5 md:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur shadow-sm h-full flex flex-col max-h-[70vh]">
      {/* <h2 className="text-lg md:text-xl font-semibold mb-4">Your Outfit of the Day</h2> */}
      <div className="flex-grow flex items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-gray-50 dark:bg-gray-800">
        {isLoading ? (
          <div className="text-center">
            <svg className="animate-spin mx-auto h-12 w-12 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Generating your stylish outfit...</p>
          </div>
        ) : generatedOutfit ? (
          <div className="w-full">
            <img src={generatedOutfit.image} alt="Generated Outfit" className="w-full max-h-[400px] object-contain rounded-xl shadow" />
            {/* <div className="mt-4">
              <h3 className="font-semibold mb-2">Items Used:</h3>
              <ul className="space-y-2">
                {generatedOutfit.items.map(item => (
                  <li key={item.id} className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg ring-1 ring-black/5 dark:ring-white/10">
                    <img src={item.image} alt="" className="w-8 h-8 rounded-md object-cover mr-3"/>
                    <TagIcon className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{item.tags.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </div> */}
          </div>
        ) : showInlineUploader ? (
          <div className="w-full">
            {InlineUploaderSlot}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <PhotoIcon className="mx-auto h-16 w-16" />
            <p className="mt-4">Your outfit will appear here.</p>
            <p className="text-xs">Upload your photo, add clothes, and hit "Suggest an Outfit" to begin!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitDisplay;
