import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://pxpvhmbcqliuxtyzwyoc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4cHZobWJjcWxpdXh0eXp3eW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNjgxODAsImV4cCI6MjA5OTg0NDE4MH0.7OAb5o469xvQSYXowehLG9pO39cDvyAO6PtofcgVHTw';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
