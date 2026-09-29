import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import companionData from './companion.json';
import { supabase } from './supabase';

/* ─────────────────────────────────────────
   Bubble Field Background
───────────────────────────────────────── */
function BubbleField() {
  const bubbles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: 8 + Math.random() * 28,
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 6 + Math.random() * 8,
    opacity: 0.12 + Math.random() * 0.22,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map(b => (
        <motion.div
          key={b.id}
          className="absolute rounded-full border-2"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: '-10%',
            borderColor: `rgba(255,138,61,${b.opacity})`,
            background: `radial-gradient(circle at 30% 30%, rgba(255,213,74,${b.opacity * 0.6}), rgba(255,138,61,${b.opacity * 0.3}))`,
          }}
          animate={{
            y: [0, -(window.innerHeight + 100)],
            x: [0, (Math.random() - 0.5) * 80],
            opacity: [0, b.opacity, b.opacity, 0],
            scale: [0.4, 1, 1.1, 0.8],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Lottie Companion Avatar
───────────────────────────────────────── */
const LottieComponent = (Lottie && typeof Lottie === 'object' && Lottie.default) ? Lottie.default : Lottie;

function CompanionAvatar({ typing = false }) {
  const lottieRef = useRef(null);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(typing ? 1.8 : 1);
    }
  }, [typing]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,213,74,0.35) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative z-10 flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {typeof LottieComponent === 'function' ? (
          <LottieComponent
            lottieRef={lottieRef}
            animationData={companionData}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <span className="text-5xl">🐱</span>
        )}
      </div>
      <motion.span
        className="absolute -top-1 -right-1 text-base"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 20, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 }}
      >✨</motion.span>
      <motion.span
        className="absolute -top-2 -left-2 text-sm"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: 1.5 }}
      >⭐</motion.span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Input Component
───────────────────────────────────────── */
function InputField({ label, type = 'text', icon, placeholder, value, onChange, error, rightElement }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1.5">{label}</label>
      <div className={`relative flex items-center rounded-2xl overflow-hidden transition-all duration-300
        ${focused ? 'ring-4 ring-orange-400/20' : ''}`}>
        {icon && (
          <span className="absolute left-4 text-gray-400 text-lg pointer-events-none z-10">{icon}</span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`input-field w-full py-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-800 dark:text-white placeholder-gray-400 text-sm font-medium
            ${icon ? 'pl-11 pr-4' : 'px-4'}
            ${rightElement ? 'pr-12' : ''}`}
        />
        {rightElement && (
          <span className="absolute right-4 cursor-pointer text-gray-400 hover:text-orange-400 transition-colors z-10">
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1.5 ml-1 font-medium"
        >
          ⚠ {error}
        </motion.p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Login Screen
───────────────────────────────────────── */
function LoginScreen({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [typing, setTyping] = useState(false);

  const handleLogin = async () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setErrors({ general: 'Invalid email or password. Please try again.' });
      } else {
        window.location.href = 'http://localhost:8081';
      }
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:8081' }
    });
  };

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center mb-6">
        <CompanionAvatar typing={typing} />
        <div className="mt-3 text-center">
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">Welcome Back 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Continue your wellness journey</p>
        </div>
      </div>

      <AnimatePresence>
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl px-4 py-3 mb-4 text-center"
          >
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{errors.general}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <InputField
        label="Email Address"
        icon="📧"
        placeholder="name@email.com"
        value={email}
        onChange={e => { setEmail(e.target.value); setTyping(true); setTimeout(() => setTyping(false), 500); setErrors(p => ({ ...p, email: '' })); }}
        error={errors.email}
      />
      <InputField
        label="Password"
        type={showPass ? 'text' : 'password'}
        icon="🔒"
        placeholder="••••••••"
        value={password}
        onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
        error={errors.password}
        rightElement={
          <span onClick={() => setShowPass(p => !p)} className="text-lg select-none">
            {showPass ? '👁️' : '🙈'}
          </span>
        }
      />

      <div className="flex items-center justify-between mb-5 -mt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Remember Me</span>
        </label>
        <button className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
          Forgot Password?
        </button>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleLogin}
        disabled={loading}
        className="gradient-btn w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 mb-4"
      >
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>Sign In →</>
        )}
      </motion.button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        <span className="text-xs text-gray-400 font-medium">or continue with</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
      </div>

      <div className="flex gap-3 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogle}
          className="social-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold text-sm shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="social-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold text-sm shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple
        </motion.button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="text-orange-500 font-bold hover:underline">Sign Up</button>
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Sign Up Screen
───────────────────────────────────────── */
function SignUpScreen({ onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setTyping(true); setTimeout(() => setTyping(false), 500);
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleSignUp = async () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'At least 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (!agreed) errs.agreed = 'Please agree to the terms';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { display_name: form.name.trim() } },
      });
      if (error) {
        setErrors({ general: error.message });
      } else {
        window.location.href = 'http://localhost:8081';
      }
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">You're in!</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Check your email to confirm your account.</p>
      <button onClick={onSwitch} className="gradient-btn px-8 py-3 rounded-2xl text-white font-bold">
        Go to Sign In →
      </button>
    </motion.div>
  );

  return (
    <motion.div
      key="signup"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center mb-6">
        <CompanionAvatar typing={typing} />
        <div className="mt-3 text-center">
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">Create Account ✨</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start your wellness journey today</p>
        </div>
      </div>

      <AnimatePresence>
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl px-4 py-3 mb-4 text-center"
          >
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{errors.general}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <InputField label="Full Name" icon="👤" placeholder="Your name" value={form.name} onChange={set('name')} error={errors.name} />
      <InputField label="Email Address" icon="📧" placeholder="name@email.com" value={form.email} onChange={set('email')} error={errors.email} />
      <InputField
        label="Password" type={showPass ? 'text' : 'password'} icon="🔒" placeholder="Min. 6 characters"
        value={form.password} onChange={set('password')} error={errors.password}
        rightElement={<span onClick={() => setShowPass(p => !p)} className="text-lg select-none">{showPass ? '👁️' : '🙈'}</span>}
      />
      <InputField
        label="Confirm Password" type={showConfirm ? 'text' : 'password'} icon="🔐" placeholder="Repeat password"
        value={form.confirm} onChange={set('confirm')} error={errors.confirm}
        rightElement={<span onClick={() => setShowConfirm(p => !p)} className="text-lg select-none">{showConfirm ? '👁️' : '🙈'}</span>}
      />

      <div className="mb-5">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(p => ({ ...p, agreed: '' })); }}
            className="mt-0.5 w-4 h-4" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I agree to the{' '}
            <span className="text-orange-500 font-semibold hover:underline cursor-pointer">Terms of Service</span>
            {' '}&amp;{' '}
            <span className="text-orange-500 font-semibold hover:underline cursor-pointer">Privacy Policy</span>
          </span>
        </label>
        {errors.agreed && <p className="text-red-500 text-xs mt-1 ml-6 font-medium">⚠ {errors.agreed}</p>}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSignUp}
        disabled={loading}
        className="gradient-btn w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 mb-4"
      >
        {loading ? (
          <motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
        ) : 'Create Account →'}
      </motion.button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
        <span className="text-xs text-gray-400 font-medium">or sign up with</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
      </div>

      <div className="flex gap-3 mb-5">
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={async () => await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'http://localhost:8081' } })}
          className="social-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold text-sm shadow-sm">
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }}
          className="social-btn flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold text-sm shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple
        </motion.button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-orange-500 font-bold hover:underline">Sign In</button>
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Main App
───────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState('login');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <div className={`min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-500 py-10
      ${darkMode
        ? 'bg-gray-950'
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}
    >
      {/* Bubbles */}
      <BubbleField />

      {/* Background Blobs */}
      {!darkMode && (
        <>
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 animate-blob"
            style={{ background: 'radial-gradient(circle, #FFD54A, #FF8A3D)' }} />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-25 animate-blob"
            style={{ background: 'radial-gradient(circle, #FF8A3D, #FFD54A)', animationDelay: '3s' }} />
          <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full opacity-15 animate-blob"
            style={{ background: 'radial-gradient(circle, #FFCA28, #FF8A3D)', animationDelay: '1.5s' }} />
        </>
      )}
      {darkMode && (
        <>
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 animate-blob"
            style={{ background: 'radial-gradient(circle, #FF8A3D, #FFD54A)' }} />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-8 animate-blob"
            style={{ background: 'radial-gradient(circle, #FF7A2A, #FFD54A)', animationDelay: '3s' }} />
        </>
      )}

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(p => !p)}
        className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center text-lg
          bg-white/70 dark:bg-gray-800/70 backdrop-blur shadow-md hover:shadow-lg transition-all hover:scale-105"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <motion.div
        key="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-card w-full max-w-sm mx-4 rounded-3xl shadow-2xl overflow-hidden relative z-10"
        style={{ boxShadow: '0 25px 60px rgba(255,138,61,0.15), 0 8px 25px rgba(0,0,0,0.08)' }}
      >
        {/* Top gradient bar */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #FF8A3D, #FFD54A, #FF8A3D)' }} />

        {/* Tab switcher */}
        <div className="flex mx-6 mt-5 mb-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
          {['login', 'signup'].map(tab => (
            <button
              key={tab}
              onClick={() => setScreen(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                ${screen === tab
                  ? 'tab-active'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {tab === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-2 overflow-hidden">
          <AnimatePresence mode="wait">
            {screen === 'login'
              ? <LoginScreen key="login" onSwitch={() => setScreen('signup')} />
              : <SignUpScreen key="signup" onSwitch={() => setScreen('login')} />
            }
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-3 text-center text-xs text-gray-400 dark:text-gray-600 w-full pointer-events-none">
        SoulSync AI • Your empathetic wellness companion 💛
      </p>
    </div>
  );
}
