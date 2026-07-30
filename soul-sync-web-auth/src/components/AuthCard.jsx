import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import AnimatedCompanion from './AnimatedCompanion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { supabase } from '../services/supabase';

export default function AuthCard({ darkMode, onToggleDarkMode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [activeField, setActiveField] = useState('');
  const [authState, setAuthState] = useState('idle'); // 'idle' | 'success' | 'loading'
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('error'); // 'error' | 'success'
  
  // Track direction of form slide transitions
  const [direction, setDirection] = useState(1);

  const toggleForm = () => {
    setDirection(isLogin ? -1 : 1);
    setIsLogin(prev => !prev);
    setStatusMessage(null);
    setActiveField('');
  };

  const handleAuthStart = () => {
    setAuthState('loading');
    setStatusMessage(null);
  };

  const handleAuthSuccess = (authData) => {
    setAuthState('success');
    setStatusType('success');

    const session = authData?.session;
    const user = authData?.user;
    const displayName = user?.user_metadata?.display_name || user?.user_metadata?.displayName || 'Traveler';

    if (isLogin) {
      setStatusMessage(`Welcome back, ${displayName}! Redirecting to application...`);
      setTimeout(() => {
        setAuthState('idle');
        setStatusMessage(null);
        if (session) {
          window.location.href = `http://localhost:8081/#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
        } else {
          window.location.href = 'http://localhost:8081';
        }
      }, 2000);
    } else {
      if (!session) {
        // Email confirmation is required in Supabase dashboard
        setStatusMessage("Account created successfully! A confirmation link has been sent to your email. Please check your inbox and confirm your email, then sign in.");
        setTimeout(() => {
          setAuthState('idle');
          setStatusMessage(null);
          // Transition slide to login form
          setDirection(1);
          setIsLogin(true);
        }, 6000);
      } else {
        // Auto-login is configured
        setStatusMessage(`Welcome to SoulSync AI, ${displayName}! Redirecting to application...`);
        setTimeout(() => {
          setAuthState('idle');
          setStatusMessage(null);
          window.location.href = `http://localhost:8081/#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
        }, 3000);
      }
    }
  };

  const handleAuthError = (message) => {
    setAuthState('idle');
    setStatusType('error');
    setStatusMessage(message);
  };

  return (
    <div className="w-full max-w-md px-4 z-10">
      {/* Container Card with soft shadows and glassmorphic panels */}
      <div className="glass-panel w-full rounded-[2.5rem] shadow-2xl p-7 relative overflow-hidden transition-all duration-300">
        
        {/* Top bar with Branding & Theme Switcher */}
        <div className="flex justify-between items-center mb-4">
          {/* Glowing App Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-yellow flex items-center justify-center shadow-md shadow-orange-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21a9 9 0 1 0-9-9c0 1.48.36 2.87 1 4.1L3 21l4.9-1c1.23.64 2.62 1 4.1 1z" />
                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-100 leading-none">SoulSync</span>
              <span className="text-[10px] font-bold text-brand-orange uppercase tracking-widest leading-tight">AI Wellness</span>
            </div>
          </div>

          {/* Theme toggler */}
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Mascot & Header Box */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <AnimatedCompanion 
            state={authState}
            activeField={activeField}
            passwordVisible={false} // Will bind to toggles if needed
          />
          
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-3 leading-none transition-colors">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1.5 transition-colors">
            {isLogin ? 'Continue your wellness journey.' : 'Start your emotional wellness journey today.'}
          </p>
        </div>

        {/* Global Warning / Status Messages Banner */}
        <AnimatePresence mode="wait">
          {statusMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-4"
            >
              <div className={`flex items-start space-x-2.5 p-3 rounded-xl border ${
                statusType === 'error'
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
                  : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400'
              }`}>
                <span className="mt-0.5 flex-shrink-0">
                  {statusType === 'error' ? <AlertCircle size={17} /> : <CheckCircle size={17} />}
                </span>
                <p className="text-xs font-semibold leading-normal">{statusMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms switch slide animations */}
        <div className="relative">
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            {isLogin ? (
              <motion.div
                key="login-form"
                custom={direction}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 50 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <LoginForm 
                  onToggleForm={toggleForm}
                  onFocusField={setActiveField}
                  onBlurField={() => setActiveField('')}
                  onLoginStart={handleAuthStart}
                  onLoginSuccess={handleAuthSuccess}
                  onLoginError={handleAuthError}
                  loading={authState === 'loading'}
                />
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                custom={direction}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 50 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <RegisterForm 
                  onToggleForm={toggleForm}
                  onFocusField={setActiveField}
                  onBlurField={() => setActiveField('')}
                  onRegisterStart={handleAuthStart}
                  onRegisterSuccess={handleAuthSuccess}
                  onRegisterError={handleAuthError}
                  loading={authState === 'loading'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
