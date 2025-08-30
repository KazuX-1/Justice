-- Function to update reply count
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_discussions 
    SET reply_count = reply_count + 1,
        updated_at = NOW()
    WHERE id = NEW.discussion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_discussions 
    SET reply_count = reply_count - 1,
        updated_at = NOW()
    WHERE id = OLD.discussion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update hot status based on activity
CREATE OR REPLACE FUNCTION update_hot_discussions()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark discussions as hot if they have recent activity (last 6 hours) and good engagement
  UPDATE forum_discussions 
  SET is_hot = (
    reply_count >= 5 AND 
    updated_at > NOW() - INTERVAL '6 hours'
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to increment resource view count
CREATE OR REPLACE FUNCTION increment_resource_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE education_resources 
  SET view_count = view_count + 1
  WHERE id = NEW.resource_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_reply_count
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();

CREATE TRIGGER trigger_update_hot_discussions
  AFTER INSERT OR UPDATE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_hot_discussions();

-- Insert sample data
INSERT INTO forum_discussions (title, content, category, author_id, author_username) VALUES
('Transparency in Government Spending: What Can We Do?', 'We need to discuss ways to improve government transparency...', 'Transparency', (SELECT id FROM auth.users LIMIT 1), 'CitizenAdvocate'),
('Local Election Integrity: Sharing Experiences', 'Share your experiences with local elections...', 'Elections', (SELECT id FROM auth.users LIMIT 1), 'DemocracyWatcher'),
('Environmental Justice in Industrial Areas', 'Industrial pollution is affecting our communities...', 'Environment', (SELECT id FROM auth.users LIMIT 1), 'GreenActivist'),
('Education Access in Remote Regions', 'Many remote areas lack proper educational facilities...', 'Education', (SELECT id FROM auth.users LIMIT 1), 'TeacherUnion');

INSERT INTO education_resources (title, description, type, category, read_time) VALUES
('Understanding Your Constitutional Rights', 'A comprehensive guide to citizens rights under Indonesian law', 'article', 'Rights', '8 min read'),
('How to File a Legal Complaint', 'Step-by-step process for reporting violations and seeking justice', 'guide', 'Legal Process', '12 min read'),
('Transparency in Government: What to Expect', 'Learn about government accountability and transparency laws', 'video', 'Transparency', '15 min watch'),
('Community Organizing for Change', 'Building grassroots movements for social justice', 'workshop', 'Activism', '2 hour session');
