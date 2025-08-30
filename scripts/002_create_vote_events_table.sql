-- Create vote events table (admin-created voting topics)
CREATE TABLE IF NOT EXISTS public.vote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of voting options
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  points_required INTEGER DEFAULT 100 CHECK (points_required > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.vote_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vote_events table
CREATE POLICY "Anyone can view active vote events" ON public.vote_events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage vote events" ON public.vote_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND username LIKE 'admin_%'
    )
  );
