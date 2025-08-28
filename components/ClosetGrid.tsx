
import React from 'react';
import { ClosetItem, Mode } from '../types';
import { CheckCircleIcon, NoSymbolIcon, TagIcon } from './icons/EditorIcons';
import { Plus } from 'lucide-react';

interface ClosetGridProps {
  items: ClosetItem[];
  mode: Mode;
  selectedItemIds: Set<string>;
  excludedItemIds: Set<string>;
  onToggleSelection: (itemId: string) => void;
  onToggleExclusion: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onOpenAddItems?: () => void;
}

const ClosetItemCard: React.FC<{
  item: ClosetItem;
  mode: Mode;
  isSelected: boolean;
  isExcluded: boolean;
  onToggleSelection: (itemId: string) => void;
  onToggleExclusion: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
}> = ({ item, mode, isSelected, isExcluded, onToggleSelection, onToggleExclusion, onDeleteItem }) => {
  const handleCardClick = () => {
    if (mode === Mode.Selective) {
      onToggleSelection(item.id);
    } else if (mode === Mode.Exclusion) {
      onToggleExclusion(item.id);
    }
  };

  const overlayClass = isSelected ? 'ring-4 ring-emerald-500' : isExcluded ? 'ring-4 ring-rose-500' : 'ring-1 ring-black/5 dark:ring-white/10';
  const cursorClass = mode === Mode.Selective || mode === Mode.Exclusion ? 'cursor-pointer' : 'cursor-default';

  return (
    <div 
      className={`relative group overflow-hidden rounded-xl bg-white/70 dark:bg-gray-900/50 backdrop-blur shadow-sm transition-all duration-300 ${overlayClass} ${cursorClass}`}
      onClick={handleCardClick}
    >
      <img src={item.image} alt={item.tags.join(', ')} className="w-full h-48 object-cover" />
      {onDeleteItem && (
        <button
          type="button"
          className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80"
          onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
          aria-label="Remove item"
        >
          Remove
        </button>
      )}
      {isSelected && mode === Mode.Selective && (
        <div className="absolute inset-0 bg-emerald-500/50 flex items-center justify-center">
          <CheckCircleIcon className="w-10 h-10 text-white" />
        </div>
      )}
      {isExcluded && (mode === Mode.Exclusion || mode === Mode.Full) && (
        <div className="absolute inset-0 bg-rose-500/50 flex items-center justify-center">
          <NoSymbolIcon className="w-10 h-10 text-white" />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <div className="flex items-start">
          <TagIcon className="w-4 h-4 mt-1 mr-2 flex-shrink-0" />
          <p className="text-xs font-semibold leading-tight">{item.tags.join(', ') || 'No tags'}</p>
        </div>
      </div>
    </div>
  );
};

const ClosetGrid: React.FC<ClosetGridProps> = ({ items, mode, selectedItemIds, excludedItemIds, onToggleSelection, onToggleExclusion, onDeleteItem, onOpenAddItems }) => {
  if (items.length === 0) {
    return (
      <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">Your Closet</h2>
        <button
          type="button"
          onClick={onOpenAddItems}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
        >
          <Plus />Add Items to closet
        </button>
      </div>
      <div className="text-center py-10 px-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur shadow-sm">
        <h3 className="text-lg font-medium">Your Closet is Empty</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Upload some clothing items to get started!</p>
      </div>
      </>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">Your Closet</h2>
        <button
          type="button"
          onClick={onOpenAddItems}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow"
        >
          Add to closet
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {items.map(item => (
          <ClosetItemCard 
            key={item.id}
            item={item}
            mode={mode}
            isSelected={selectedItemIds.has(item.id)}
            isExcluded={excludedItemIds.has(item.id)}
            onToggleSelection={onToggleSelection}
            onToggleExclusion={onToggleExclusion}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
};

export default ClosetGrid;
