import React, { useState, useEffect } from 'react';
import AuthCard from './components/AuthCard';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Read cached preferences or default to system theme
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    if (darkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#FAF6F0] dark:bg-slate-900 transition-colors duration-500">
      
      {/* Background Abstract blobs for premium onboarding feel (animated via tailwind custom keyframes) */}
      <div 
        className="absolute top-[-15%] left-[-15%] w-[55vw] h-[55vw] min-w-[300px] min-h-[300px] rounded-full bg-gradient-to-br from-brand-orange/20 to-brand-yellow/10 blur-3xl opacity-80 dark:opacity-40 animate-drift-blob1" 
        style={{ transformOrigin: 'top left' }}
      />
      <div 
        className="absolute bottom-[-20%] right-[-15%] w-[65vw] h-[65vw] min-w-[350px] min-h-[350px] rounded-full bg-gradient-to-tr from-brand-yellow/20 to-brand-orange/10 blur-3xl opacity-80 dark:opacity-40 animate-drift-blob2"
        style={{ transformOrigin: 'bottom right' }}
      />
      <div className="absolute top-[35%] right-[-10%] w-[35vw] h-[35vw] min-w-[200px] min-h-[200px] rounded-full bg-gradient-to-l from-orange-400/10 to-transparent blur-3xl opacity-60 dark:opacity-30" />

      {/* Main Authentication card */}
      <AuthCard 
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    </main>
  );
}
