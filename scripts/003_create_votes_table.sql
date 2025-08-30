-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_event_id UUID REFERENCES public.vote_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  option_selected TEXT NOT NULL,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vote_event_id, user_id) -- One vote per user per event
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for votes table
CREATE POLICY "Users can view their own votes" ON public.votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can view vote counts (aggregated data)
CREATE POLICY "Public can view vote statistics" ON public.votes
  FOR SELECT USING (true);
