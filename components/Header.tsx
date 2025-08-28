
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { UserPen } from "lucide-react";

interface HeaderProps {
  isDark?: boolean;
  onToggleDark?: () => void;
  user?: { displayName?: string | null } | null;
  onSignIn?: () => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
  showUploadActions?: boolean;
  onOpenUserPhoto?: () => void;
  onOpenClosetItems?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, onToggleDark, user, onSignIn, onSignOut, showUploadActions, onOpenUserPhoto, onOpenClosetItems }) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 dark:bg-gray-900/70 border-b border-black/5 dark:border-white/10">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <div className="mr-3 inline-flex items-center justify-center rounded-full p-2 text-white shadow-sm">
            {/* <SparklesIcon className="h-5 w-5" /> */}
            <img src="logo3.jpeg" className="h-8 w-8 rounded-full  object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">SmartifyAI</h1>
            <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">Style suggestions powered by AI</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {user && (
            <div className="flex items-center space-x-1 mr-1">
              <button
                onClick={onOpenUserPhoto}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-indigo-600/90 text-white ring-1 ring-black/5 hover:bg-indigo-700 transition"
                title="Upload your photo"
                aria-label="Upload your photo"
              >
                {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  <path fillRule="evenodd" d="M2.25 18a5.25 5.25 0 015.25-5.25h9a5.25 5.25 0 015.25 5.25v.75a.75.75 0 01-.75.75H3a.75.75 0 01-.75-.75V18z" clipRule="evenodd" />
                </svg> */}
                <UserPen className="h-6 w-6 text-gray-700" />
              </button>
              {/* <button
                onClick={onOpenClosetItems}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-600/90 text-white ring-1 ring-black/5 hover:bg-emerald-700 transition"
                title="Add clothing items"
                aria-label="Add clothing items"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 3.75a.75.75 0 01.75.75v6.75H19.5a.75.75 0 010 1.5h-6.75V19.5a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" />
                </svg>
              </button> */}
            </div>
          )}
          {/* <button
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M21.752 15.002A9.718 9.718 0 0112 21.75a9.75 9.75 0 01-9.75-9.75 9.718 9.718 0 016.748-9.252.75.75 0 01.96.93A8.25 8.25 0 0012 20.25a8.25 8.25 0 007.572-11.04.75.75 0 01.93-.958 9.718 9.718 0 011.25 6.75z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zm0 16.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM4.28 4.28a.75.75 0 011.06 0L6.4 5.34a.75.75 0 11-1.06 1.06L4.28 5.34a.75.75 0 010-1.06zm12.66 12.66a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2.25 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zm16.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM4.28 19.72a.75.75 0 010-1.06L5.34 17.6a.75.75 0 111.06 1.06L5.34 19.72a.75.75 0 01-1.06 0zm12.66-12.66a.75.75 0 010-1.06L18 4.94a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM12 6.75a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" />
              </svg>
            )}
          </button> */}
          {user ? (
            <>
              {/* <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">Hi, {user.displayName || 'User'}</span> */}
              <button
                onClick={onSignOut}
                className="px-3 py-1.5 text-sm rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              onClick={async () => { await onSignIn?.(); }}
              className="px-3 py-1.5 text-sm rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow hover:from-indigo-700 hover:to-fuchsia-700 transition"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
