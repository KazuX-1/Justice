-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, kota, provinsi, umur, points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'kota', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'provinsi', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'umur')::integer, 25),
    1000
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update user points after voting
CREATE OR REPLACE FUNCTION public.deduct_voting_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deduct points from user
  UPDATE public.users 
  SET points = points - NEW.points_spent,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to deduct points after voting
DROP TRIGGER IF EXISTS on_vote_created ON public.votes;
CREATE TRIGGER on_vote_created
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_voting_points();

-- Function to get vote statistics
CREATE OR REPLACE FUNCTION public.get_vote_statistics(event_id UUID)
RETURNS TABLE (
  option_name TEXT,
  vote_count BIGINT,
  total_points BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.option_selected as option_name,
    COUNT(*) as vote_count,
    SUM(v.points_spent) as total_points
  FROM public.votes v
  WHERE v.vote_event_id = event_id
  GROUP BY v.option_selected
  ORDER BY vote_count DESC;
END;
$$;
