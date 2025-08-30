-- Create users profile table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  kota TEXT NOT NULL,
  provinsi TEXT NOT NULL,
  umur INTEGER NOT NULL CHECK (umur >= 17 AND umur <= 100),
  points INTEGER DEFAULT 1000 NOT NULL CHECK (points >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Allow public read access for usernames (for voting display)
CREATE POLICY "Public can view usernames" ON public.users
  FOR SELECT USING (true);
