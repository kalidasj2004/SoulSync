-- SQL schema setup for SoulSync AI (Idempotent - Re-runnable)
-- Copy and paste this script directly into your Supabase project SQL Editor

-- 1. PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  preferred_language text default 'en' not null, -- 'en', 'ml', 'hi'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for Profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile." on public.profiles;
create policy "Users can view their own profile." on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);


-- 2. MOOD ENTRIES TABLE
create table if not exists public.mood_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mood text not null check (mood in ('happy', 'neutral', 'sad', 'stressed', 'angry')),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Mood Entries
alter table public.mood_entries enable row level security;

drop policy if exists "Users can view and manage their own mood entries." on public.mood_entries;
create policy "Users can view and manage their own mood entries." on public.mood_entries
  for all using (auth.uid() = user_id);


-- 3. JOURNAL ENTRIES TABLE
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  mood_tag text check (mood_tag in ('happy', 'neutral', 'sad', 'stressed', 'angry', null)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Journal Entries
alter table public.journal_entries enable row level security;

drop policy if exists "Users can manage their own journal entries." on public.journal_entries;
create policy "Users can manage their own journal entries." on public.journal_entries
  for all using (auth.uid() = user_id);


-- 4. CHAT HISTORY TABLE
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender text not null check (sender in ('user', 'assistant')),
  message text not null,
  sentiment text, -- Happy, Sad, Neutral, Angry, etc. (for analytics)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Chat Messages
alter table public.chat_messages enable row level security;

drop policy if exists "Users can manage their own chat messages." on public.chat_messages;
create policy "Users can manage their own chat messages." on public.chat_messages
  for all using (auth.uid() = user_id);


-- 5. PROFILE CREATION TRIGGER
-- Automatically inserts a record into profiles when a new user registers in Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'SoulSync User'), 'en');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
