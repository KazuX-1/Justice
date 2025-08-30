-- Adding article content and banner image to donation causes
ALTER TABLE donation_causes 
ADD COLUMN IF NOT EXISTS banner_image TEXT,
ADD COLUMN IF NOT EXISTS article_content TEXT,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Creating donation comments table
CREATE TABLE IF NOT EXISTS donation_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cause_id UUID REFERENCES donation_causes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creating donation comment likes table
CREATE TABLE IF NOT EXISTS donation_comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES donation_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Adding RLS policies for donation comments
ALTER TABLE donation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view donation comments" ON donation_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert donation comments" ON donation_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own donation comments" ON donation_comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view donation comment likes" ON donation_comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage donation likes" ON donation_comment_likes FOR ALL USING (auth.uid() = user_id);

-- Function to update donation comment like count
CREATE OR REPLACE FUNCTION update_donation_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE donation_comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE donation_comments 
        SET like_count = like_count - 1 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for donation comment like count updates
CREATE TRIGGER donation_comment_like_count_trigger
    AFTER INSERT OR DELETE ON donation_comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_donation_comment_like_count();
