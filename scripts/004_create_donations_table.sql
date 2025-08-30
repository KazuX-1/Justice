-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT, -- For anonymous donations
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  message TEXT,
  cause TEXT NOT NULL, -- What they're donating for
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donations table
CREATE POLICY "Users can view their own donations" ON public.donations
  FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Users can insert their own donations" ON public.donations
  FOR INSERT WITH CHECK (auth.uid() = donor_id OR donor_id IS NULL);

-- Public can view non-anonymous donations
CREATE POLICY "Public can view public donations" ON public.donations
  FOR SELECT USING (is_anonymous = false);
