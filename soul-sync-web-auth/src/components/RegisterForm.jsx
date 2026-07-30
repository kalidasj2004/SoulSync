import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function RegisterForm({ 
  onToggleForm, 
  onFocusField, 
  onBlurField, 
  onRegisterSuccess,
  onRegisterStart,
  onRegisterError,
  loading 
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const tempErrors = {};
    if (!fullName) {
      tempErrors.fullName = "Full Name is required";
    }
    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Invalid email format";
    }
    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }
    if (!agreeTerms) {
      tempErrors.agreeTerms = "You must agree to the Terms & Privacy Policy";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onRegisterStart();
    try {
      // 1. Sign up user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: fullName,
          },
        },
      });

      if (error) throw error;

      // 2. Client-side profile insert fallback (runs if database trigger is bypassed)
      if (data?.user) {
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            display_name: fullName,
            preferred_language: 'en',
          });
        } catch (profileErr) {
          console.log('Manual profile fallback notice:', profileErr.message);
        }
      }

      onRegisterSuccess(data);
    } catch (err) {
      onRegisterError(err.message || "Failed to create account.");
    }
  };

  const handleSocialRegister = async (provider) => {
    onRegisterStart();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase(),
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err) {
      onRegisterError(err.message || `Failed to authenticate with ${provider}.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Full Name Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <User size={18} />
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
            }}
            onFocus={() => onFocusField('name')}
            onBlur={onBlurField}
            placeholder="John Doe"
            disabled={loading}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white/50 dark:bg-slate-900/50 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 ${
              errors.fullName 
                ? 'border-red-400 dark:border-red-600 focus:border-red-400' 
                : 'border-slate-200 dark:border-slate-700 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/20'
            }`}
          />
        </div>
        {errors.fullName && (
          <p className="mt-0.5 text-xs text-red-500 dark:text-red-400 font-medium animate-fadeIn">{errors.fullName}</p>
        )}
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Mail size={18} />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
            }}
            onFocus={() => onFocusField('email')}
            onBlur={onBlurField}
            placeholder="example@email.com"
            disabled={loading}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border bg-white/50 dark:bg-slate-900/50 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 ${
              errors.email 
                ? 'border-red-400 dark:border-red-600 focus:border-red-400' 
                : 'border-slate-200 dark:border-slate-700 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/20'
            }`}
          />
        </div>
        {errors.email && (
          <p className="mt-0.5 text-xs text-red-500 dark:text-red-400 font-medium animate-fadeIn">{errors.email}</p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Password</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Lock size={18} />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: null }));
            }}
            onFocus={() => onFocusField('password')}
            onBlur={onBlurField}
            placeholder="••••••••"
            disabled={loading}
            className={`w-full pl-10 pr-10 py-2 rounded-xl border bg-white/50 dark:bg-slate-900/50 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 ${
              errors.password 
                ? 'border-red-400 dark:border-red-600 focus:border-red-400' 
                : 'border-slate-200 dark:border-slate-700 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/20'
            }`}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-0.5 text-xs text-red-500 dark:text-red-400 font-medium animate-fadeIn">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Confirm Password</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Lock size={18} />
          </span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
            }}
            onFocus={() => onFocusField('confirmPassword')}
            onBlur={onBlurField}
            placeholder="••••••••"
            disabled={loading}
            className={`w-full pl-10 pr-10 py-2 rounded-xl border bg-white/50 dark:bg-slate-900/50 outline-none transition-all duration-200 text-slate-800 dark:text-slate-100 ${
              errors.confirmPassword 
                ? 'border-red-400 dark:border-red-600 focus:border-red-400' 
                : 'border-slate-200 dark:border-slate-700 focus:border-brand-orange focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/20'
            }`}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowConfirmPassword(prev => !prev)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-0.5 text-xs text-red-500 dark:text-red-400 font-medium animate-fadeIn">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms and Privacy Checkbox */}
      <div>
        <div className="flex items-start">
          <input
            id="agree-terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (errors.agreeTerms) setErrors(prev => ({ ...prev, agreeTerms: null }));
            }}
            disabled={loading}
            className="mt-1 h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-600 text-brand-orange focus:ring-brand-orange focus:ring-offset-0 accent-brand-orange transition-colors"
          />
          <label htmlFor="agree-terms" className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
            I agree to the <span className="text-brand-orange font-bold hover:underline cursor-pointer">Terms & Privacy Policy</span>
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="mt-0.5 text-xs text-red-500 dark:text-red-400 font-medium animate-fadeIn">{errors.agreeTerms}</p>
        )}
      </div>

      {/* Create Account Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-brand-orange to-brand-yellow hover:opacity-95 active:scale-[0.98] transition-all duration-150 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        <span className="mx-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          or sign up with
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
      </div>

      {/* Social Register */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSocialRegister('Google')}
          className="flex items-center justify-center space-x-2 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.97] transition-all duration-150 font-bold text-xs text-slate-600 dark:text-slate-300"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.54 0-6.423-2.883-6.423-6.423 0-3.54 2.883-6.423 6.423-6.423 1.547 0 2.96.549 4.07 1.468l3.078-3.078C18.966 2.058 15.84.977 12.24.977 6.046.977 1 6.024 1 12.217s5.046 11.24 11.24 11.24c5.898 0 10.871-4.212 10.871-11.24 0-.768-.082-1.334-.23-1.932H12.24z"
            />
          </svg>
          <span>Google</span>
        </button>

        {/* Apple OAuth Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSocialRegister('Apple')}
          className="flex items-center justify-center space-x-2 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-[0.97] transition-all duration-150 font-bold text-xs text-slate-600 dark:text-slate-300"
        >
          <svg className="w-4 h-4 fill-slate-700 dark:fill-slate-300" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.56 2.98-1.41z" />
          </svg>
          <span>Apple</span>
        </button>
      </div>

      {/* Switch Form Link */}
      <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mt-3">
        Already have an account?{' '}
        <button
          type="button"
          disabled={loading}
          onClick={onToggleForm}
          className="text-brand-orange hover:text-orange-600 transition-colors font-bold"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}
