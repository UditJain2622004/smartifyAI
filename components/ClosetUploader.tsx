import React, { useCallback, useState } from 'react';
import { ClosetItem } from '../types';
import { UserIcon, PlusCircleIcon, ArrowUpOnSquareIcon } from './icons/EditorIcons';
import { toast } from 'react-hot-toast';
import { addClosetItem, saveUserFaceImage } from '../services/firebase';

interface ClosetUploaderProps {
  userImage: { data: string; mimeType: string } | null;
  setUserImage: (image: { data: string; mimeType: string } | null) => void;
  setClosetItems: React.Dispatch<React.SetStateAction<ClosetItem[]>>;
  compact?: boolean;
}

const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve({ data: (reader.result as string).split(',')[1], mimeType: file.type });
    reader.onerror = error => reject(error);
  });
};

const ClosetUploader: React.FC<ClosetUploaderProps> = ({ userImage, setUserImage, setClosetItems, compact }) => {
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUserImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // console.log('[Uploader] User image selected', { name: file.name, type: file.type, size: file.size });
        if (!file.type.startsWith('image/')) {
          console.warn('[Uploader] Selected file is not an image');
        }
        const imageData = await fileToBase64(file);
        // console.log('[Uploader] User image processed', {
          mimeType: imageData.mimeType,
          dataLength: imageData.data?.length,
          dataPreview: imageData.data?.slice(0, 32) + '...'
        });
        setUserImage(imageData);
        try {
          setSaving(true);
          // We'll rely on auth guard at a higher level; if not signed-in, these will fail silently in backend rules.
          const uid = (window as any).__currentUid || null; // optional signal if we wire later in App
          if (uid) {
            await saveUserFaceImage(uid, imageData);
            // console.log('[Uploader] User face image saved to Firestore');
          } else {
            // console.log('[Uploader] Skip saving face image (no user signed in)');
          }
        } finally {
          setSaving(false);
        }
      } catch (error) {
        console.error("Error processing user image:", error);
        toast.error("Could not upload your photo. Please try another file.");
      }
    }
  }, [setUserImage]);

  const handleClosetItemUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    try {
      setSaving(true);
      const uid = (window as any).__currentUid || null;
      const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean);

      const newItems: ClosetItem[] = [];
      for (const file of files) {
        // console.log('[Uploader] Closet item selected', { name: file.name, type: file.type, size: file.size });
        const { data, mimeType } = await fileToBase64(file);
        // console.log('[Uploader] Closet item processed', { mimeType, dataLength: data?.length });
        const newClosetItem: ClosetItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          image: `data:${mimeType};base64,${data}`,
          mimeType,
          tags: tagList,
        };
        newItems.push(newClosetItem);
        if (uid) {
          await addClosetItem(uid, newClosetItem);
          // console.log('[Uploader] Closet item saved to Firestore', newClosetItem.id);
        }
      }
      setClosetItems(prev => [...prev, ...newItems]);
      if (!uid) // console.log('[Uploader] Skip saving closet items (no user signed in)');
      setTags('');
      // event.currentTarget.value = '';
      toast.success('Item(s) added to your closet!');
    } catch (error) {
      console.error('Error processing closet items:', error);
      toast.error('Could not upload clothing items. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [setClosetItems, tags]);

  if (compact) {
    return (
      <div className="p-4 rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {userImage ? (
              <img src={`data:${userImage.mimeType};base64,${userImage.data}`} alt="User" className="w-10 h-10 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
                <UserIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Get started</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Upload photo and add items</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="user-photo-upload" className="cursor-pointer flex-1 text-center bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-3 py-2 rounded-full hover:from-indigo-700 hover:to-fuchsia-700 transition-colors text-sm font-semibold shadow">
            <span>Upload Your Photo</span>
          </label>
          <input id="user-photo-upload" type="file" className="hidden" accept="image/*" onChange={handleUserImageUpload} />
          <label htmlFor="closet-item-upload" className="cursor-pointer flex-1 text-center bg-emerald-500 text-white px-3 py-2 rounded-full hover:bg-emerald-600 transition-colors text-sm font-semibold shadow">
            <span>Add Items to Closet</span>
          </label>
          <input id="closet-item-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleClosetItemUpload} />
        </div>
        {/* <div>
          <input
            id="tags-input"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags for new items (optional)"
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 sm:text-xs"
          />
        </div> */}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur shadow-sm space-y-5 md:space-y-6">
      <h2 className="text-lg md:text-xl font-semibold">1. Upload Your Photos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* User Photo Upload */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl text-center bg-gray-50 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
          {userImage ? (
            <img src={`data:${userImage.mimeType};base64,${userImage.data}`} alt="User" className="w-28 h-28 rounded-full object-cover mb-4 ring-1 ring-black/5 dark:ring-white/10" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 ring-1 ring-black/5 dark:ring-white/10">
              <UserIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          <label htmlFor="user-photo-upload" className="cursor-pointer bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-4 py-2 rounded-full hover:from-indigo-700 hover:to-fuchsia-700 transition-colors text-sm font-semibold flex items-center shadow">
            <ArrowUpOnSquareIcon className="w-4 h-4 mr-2" />
            {userImage ? 'Change Your Photo' : 'Upload Your Photo'}
          </label>
          <input id="user-photo-upload" type="file" className="hidden" accept="image/*" onChange={handleUserImageUpload} />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">A clear, front-facing photo works best.</p>
        </div>

        {/* Closet Item Upload */}
        <div className="flex flex-col justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
          {/* <label htmlFor="tags-input" className="text-sm font-medium mb-2">Item Tags (comma-separated)</label>
          <input
            id="tags-input"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., top, blue, cotton t-shirt"
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 sm:text-sm mb-4"
          /> */}
          <label htmlFor="closet-item-upload" className="cursor-pointer bg-emerald-500 text-white px-4 py-2 rounded-full hover:bg-emerald-600 transition-colors text-sm font-semibold flex items-center justify-center shadow">
            <PlusCircleIcon className="w-4 h-4 mr-2" />
            Add Clothing Item(s)
          </label>
          <input id="closet-item-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleClosetItemUpload} />
          {/* <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">Add tags before uploading your item.</p> */}
        </div>
      </div>
    </div>
  );
};

export default ClosetUploader;