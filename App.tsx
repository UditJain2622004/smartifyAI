
import { Analytics } from '@vercel/analytics/react';


import React, { useState, useCallback, useEffect } from 'react';
import { ClosetItem, Mode } from './types';
import Header from './components/Header';
import Landing from './components/Landing';
import ClosetUploader from './components/ClosetUploader';
import ClosetGrid from './components/ClosetGrid';
import OutfitControls from './components/OutfitControls';
import OutfitDisplay from './components/OutfitDisplay';
import { suggestOutfit } from './services/geminiService';
import { Toaster, toast } from 'react-hot-toast';
import { subscribeToAuth, signInWithGooglePopup, signOutUser, upsertUserProfile, getUserFaceImageForUser, getClosetItemsForUser, addClosetItem, saveUserFaceImage } from './services/firebase';
import { getFirestoreDb } from './services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [userImage, setUserImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [mode, setMode] = useState<Mode>(Mode.Full);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [excludedItemIds, setExcludedItemIds] = useState<Set<string>>(new Set());
  const [purpose, setPurpose] = useState<string>('A casual day out');
  const [generatedOutfit, setGeneratedOutfit] = useState<{ image: string; items: ClosetItem[] } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme:dark');
    return saved === 'true';
  });

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      // Expose uid globally for simple integration inside components without prop drilling
      (window as any).__currentUid = user?.uid || null;
      if (user) {
        await upsertUserProfile(user);
        // Load persisted images
        try {
          const [face, items] = await Promise.all([
            getUserFaceImageForUser(user.uid),
            getClosetItemsForUser(user.uid),
          ]);
          if (face) setUserImage(face);
          if (Array.isArray(items)) setClosetItems(items);
          console.log('[Auth] Loaded persisted assets', { faceLoaded: Boolean(face), closetCount: items?.length || 0 });
        } catch (e) {
          console.warn('[Auth] Failed to load persisted assets');
        }
      }
      if (!user) {
        // Clear in-memory state on sign out
        setUserImage(null);
        setClosetItems([]);
      }
      // Mark auth initialized after first callback run
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme:dark', String(isDark));
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  const handleSuggestOutfit = useCallback(async () => {
    console.log('[Suggest] Triggered with state', {
      hasUserImage: Boolean(userImage),
      userImageMimeType: userImage?.mimeType,
      userImageDataLength: userImage?.data?.length,
      closetItemsCount: closetItems.length,
      mode,
      selectedItemIdsCount: selectedItemIds.size,
      excludedItemIdsCount: excludedItemIds.size,
      purpose,
    });
    if (!userImage) {
      console.warn('[Suggest] Aborting: no user image');
      toast.error('Please upload a photo of yourself first.');
      return;
    }

    let itemsToConsider: ClosetItem[] = [];
    if (mode === Mode.Full) {
        itemsToConsider = closetItems.filter(item => !excludedItemIds.has(item.id));
    } else if (mode === Mode.Selective) {
        itemsToConsider = closetItems.filter(item => selectedItemIds.has(item.id));
    } else if (mode === Mode.Exclusion) {
        itemsToConsider = closetItems.filter(item => !excludedItemIds.has(item.id));
    }
    
    if (itemsToConsider.length < 2) {
        toast.error('Please add at least 2 items to your closet to get a suggestion.');
        return;
    }

    setIsLoading(true);
    setGeneratedOutfit(null);
    // console.log('[Suggest] Calling suggestOutfit with', {
    //   itemsToConsiderCount: itemsToConsider.length,
    //   itemIds: itemsToConsider.map(i => i.id),
    //   itemMimeTypes: itemsToConsider.map(i => i.mimeType),
    //   purpose,
    //   userImageMimeType: userImage.mimeType,
    //   userImageDataPreview: userImage.data.slice(0, 32) + '...',
    //   userImageDataLength: userImage.data.length,
    // });
    try {
      const result = await suggestOutfit(userImage, itemsToConsider, purpose);
      // console.log('[Suggest] Received result', {
      //   imageDataUrlPrefix: result.image.slice(0, 30) + '...',
      //   imageLength: result.image.length,
      //   itemsReturned: result.items.map(i => ({ id: i.id, tags: i.tags })),
      // });
      setGeneratedOutfit(result);
      toast.success('Here is your new outfit!');
    } catch (error) {
      console.error('Failed to suggest outfit:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Could not generate outfit: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      // console.log('[Suggest] Finished');
    }
  }, [userImage, closetItems, purpose, mode, selectedItemIds, excludedItemIds]);

  const toggleSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleExclusion = (itemId: string) => {
    setExcludedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    setClosetItems(prev => prev.filter(i => i.id !== itemId));
    const uid = (window as any).__currentUid || null;
    if (!uid) return;
    try {
      const db = getFirestoreDb();
      await deleteDoc(doc(db, 'users', uid, 'closet', itemId));
      // console.log('[Closet] Deleted item', itemId);
    } catch (e) {
      console.warn('[Closet] Failed to delete item from Firestore');
    }
  };


  const userHasGenerated = Boolean(generatedOutfit && generatedOutfit.image);

  const userPhotoInputRefId = 'header-user-photo-input';
  const closetItemsInputRefId = 'header-closet-items-input';

  const openUserPhotoPicker = () => {
    toast('Upload a clear, front-facing photo of yourself.', { icon: '📸' });
    const el = document.getElementById(userPhotoInputRefId) as HTMLInputElement | null;
    el?.click();
  };
  const openClosetItemsPicker = () => {
    toast('Upload photos of your clothes and accessories (you can select multiple).', { icon: '🧥' });
    const el = document.getElementById(closetItemsInputRefId) as HTMLInputElement | null;
    el?.click();
  };

  if (!authReady) {
    return (
      <div className="min-h-screen relative text-gray-900 dark:text-gray-100 font-sans overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-gradient-to-br from-indigo-400/30 to-fuchsia-400/30 blur-3xl dark:from-indigo-600/20 dark:to-fuchsia-600/20" />
          <div className="absolute bottom-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-indigo-400/20 blur-2xl dark:bg-indigo-700/20" />
        </div>
        <Toaster position="top-center" reverseOrder={false} />
        <Header 
          isDark={isDark}
          onToggleDark={() => setIsDark(d => !d)}
          user={null}
          onSignIn={async () => { await signInWithGooglePopup(); }}
          onSignOut={signOutUser}
          showUploadActions={false}
        />
        <main className="mx-auto max-w-7xl px-4 md:px-8 py-10">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin mx-auto h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Loading your wardrobe…</p>
            </div>
          </div>
        </main>
        <Analytics />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen relative text-gray-900 dark:text-gray-100 font-sans overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-gradient-to-br from-indigo-400/30 to-fuchsia-400/30 blur-3xl dark:from-indigo-600/20 dark:to-fuchsia-600/20" />
          <div className="absolute bottom-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-indigo-400/20 blur-2xl dark:bg-indigo-700/20" />
        </div>
        <Toaster position="top-center" reverseOrder={false} />
        <Header 
          isDark={isDark}
          onToggleDark={() => setIsDark(d => !d)}
          user={null}
          onSignIn={async () => { await signInWithGooglePopup(); }}
          onSignOut={signOutUser}
          showUploadActions={false}
        />
        <main className="mx-auto max-w-7xl px-4 md:px-8 py-10">
          <Landing onSignIn={async () => { await signInWithGooglePopup(); }} />
        </main>
        <Analytics />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-gray-900 dark:text-gray-100 font-sans overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-gradient-to-br from-indigo-400/30 to-fuchsia-400/30 blur-3xl dark:from-indigo-600/20 dark:to-fuchsia-600/20" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-indigo-400/20 blur-2xl dark:bg-indigo-700/20" />
      </div>

      <Toaster position="top-center" reverseOrder={false} />
      <Header 
        isDark={isDark}
        onToggleDark={() => setIsDark(d => !d)}
        user={currentUser}
        onSignIn={async () => { await signInWithGooglePopup(); }}
        onSignOut={signOutUser}
        showUploadActions={userHasGenerated}
        onOpenUserPhoto={openUserPhotoPicker}
        onOpenClosetItems={openClosetItemsPicker}
      />
      {/* Hidden inputs controlled by header quick actions */}
      <input id={userPhotoInputRefId} type="file" accept="image/*" className="hidden" onChange={async (e) => {
        // Delegate to ClosetUploader behavior and also persist to Firestore
        const file = e.target.files?.[0];
        if (!file) return;
        const data: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const image = { data, mimeType: file.type };
        setUserImage(image);
        const uid = (window as any).__currentUid || null;
        if (uid) {
          try {
            await saveUserFaceImage(uid, image);
          } catch (err) {
            console.warn('[Header Upload] Failed to persist user face image');
          }
        }
      }} />
      <input id={closetItemsInputRefId} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length === 0) return;
        const newItems: ClosetItem[] = [];
        const uid = (window as any).__currentUid || null;
        for (const file of files) {
          const reader = new FileReader();
          const data: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const newItem: ClosetItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            image: `data:${file.type};base64,${data}`,
            mimeType: file.type,
            tags: [],
          };
          newItems.push(newItem);
          if (uid) {
            try {
              await addClosetItem(uid, newItem);
            } catch (err) {
              console.warn('[Header Upload] Failed to persist closet item to Firestore');
            }
          }
        }
        setClosetItems(prev => [...prev, ...newItems]);
        toast.success('Item(s) added to your closet!');
      }} />
      <main className="mx-auto max-w-7xl px-2 md:px-8 py-2 md:py-10">
        {/* <section className="mb-6 md:mb-10">
          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur p-4 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Get dressed with confidence</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload your photo and closet, describe the vibe, and let AI style you.</p>
              </div>
              <button
                onClick={handleSuggestOutfit}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 transition"
              >
                {isLoading ? 'Generating...' : 'Quick Suggest'}
              </button>
            </div>
          </div>
        </section> */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:order-2 lg:col-span-7 space-y-6 md:space-y-8 order-2">
            {/* Move full uploader out of the first screen on mobile; still accessible below controls */}
            {/* <div className="hidden lg:block">
              <ClosetUploader userImage={userImage} setUserImage={setUserImage} setClosetItems={setClosetItems} />
            </div> */}
            <OutfitControls 
              mode={mode}
              setMode={setMode}
              purpose={purpose}
              setPurpose={setPurpose}
              onSuggest={handleSuggestOutfit}
              isLoading={isLoading}
            />
            <ClosetGrid 
              items={closetItems} 
              mode={mode}
              selectedItemIds={selectedItemIds}
              excludedItemIds={excludedItemIds}
              onToggleSelection={toggleSelection}
              onToggleExclusion={toggleExclusion}
              onDeleteItem={handleDeleteItem}
              onOpenAddItems={openClosetItemsPicker}
            />
          </div>

          <div className="lg:order-1 lg:col-span-5 order-1">
            <OutfitDisplay 
              generatedOutfit={generatedOutfit} 
              isLoading={isLoading}
              showInlineUploader={!generatedOutfit}
              InlineUploaderSlot={
                <ClosetUploader 
                  compact
                  userImage={userImage}
                  setUserImage={setUserImage}
                  setClosetItems={setClosetItems}
                />
              }
            />
          </div>
        </div>
      </main>

      {/* Mobile action bar */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-30">
        <div className="rounded-full shadow-lg ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
          <button
            onClick={handleSuggestOutfit}
            disabled={isLoading}
            className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : 'Suggest an Outfit'}
          </button>
        </div>
      </div>
      <Analytics />
    </div>
  );
};

export default App;
