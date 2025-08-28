import React from 'react';

interface LandingProps {
  onSignIn?: () => void | Promise<void>;
}

const Landing: React.FC<LandingProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-[78vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative w-full max-w-3xl">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 blur-3xl" />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
        Dress Better. Think Less.
      </h1>
      <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl">
        SmartifyAI curates outfits from your own closet using AI. Upload your photo, add your clothes, and get instant looks for any vibe.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={onSignIn} className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 shadow">
          Sign in to get started
        </button>
        <a href="#how-it-works" className="inline-flex items-center justify-center px-6 py-3 rounded-full ring-1 ring-black/10 dark:ring-white/10 text-gray-800 dark:text-gray-100 bg-white/70 dark:bg-gray-900/50 backdrop-blur hover:bg-white/90">
          Learn more
        </a>
      </div>

      <section id="how-it-works" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
        <div className="p-5 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur text-left">
          <h3 className="font-semibold">1. Upload your photo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">A clear selfie helps tailor outfits to you.</p>
        </div>
        <div className="p-5 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur text-left">
          <h3 className="font-semibold">2. Add your clothes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Snap pics of your wardrobe; tag items if you like.</p>
        </div>
        <div className="p-5 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/50 backdrop-blur text-left">
          <h3 className="font-semibold">3. Get styled by AI</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Describe the vibe and receive a complete outfit.</p>
        </div>
      </section>

      {/* <section className="mt-12 w-full max-w-5xl">
        <div className="rounded-2xl overflow-hidden">
          <div className="aspect-[16/9] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">Preview coming soon</span>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Landing;
