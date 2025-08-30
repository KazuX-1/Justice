-- Adding image banner, article content, and interaction tracking to vote events
ALTER TABLE vote_events 
ADD COLUMN banner_image TEXT,
ADD COLUMN article_content TEXT,
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN interaction_score INTEGER DEFAULT 0;

-- Creating comments table for vote discussions
CREATE TABLE IF NOT EXISTS vote_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vote_event_id UUID REFERENCES vote_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creating comment likes table for tracking user likes
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES vote_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Creating vote interactions table for popularity tracking
CREATE TABLE IF NOT EXISTS vote_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vote_event_id UUID REFERENCES vote_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'vote', 'comment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vote_event_id, user_id, interaction_type)
);

-- Adding RLS policies for new tables
ALTER TABLE vote_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for vote_comments
CREATE POLICY "Anyone can view comments" ON vote_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON vote_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON vote_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON vote_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for comment_likes
CREATE POLICY "Anyone can view comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage likes" ON comment_likes FOR ALL USING (auth.uid() = user_id);

-- RLS policies for vote_interactions
CREATE POLICY "Anyone can view interactions" ON vote_interactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can track interactions" ON vote_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update comment like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE vote_comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE vote_comments 
        SET like_count = like_count - 1 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment like count updates
CREATE TRIGGER comment_like_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- Function to update vote interaction score
CREATE OR REPLACE FUNCTION update_vote_interaction_score()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE vote_events 
        SET interaction_score = interaction_score + 
            CASE NEW.interaction_type
                WHEN 'view' THEN 1
                WHEN 'vote' THEN 5
                WHEN 'comment' THEN 3
                ELSE 1
            END,
            view_count = CASE WHEN NEW.interaction_type = 'view' THEN view_count + 1 ELSE view_count END
        WHERE id = NEW.vote_event_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote interaction score updates
CREATE TRIGGER vote_interaction_score_trigger
    AFTER INSERT ON vote_interactions
    FOR EACH ROW EXECUTE FUNCTION update_vote_interaction_score();
