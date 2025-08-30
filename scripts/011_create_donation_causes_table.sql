-- Create donation_causes table for admin-managed donation campaigns
CREATE TABLE IF NOT EXISTS donation_causes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  goal_amount BIGINT NOT NULL DEFAULT 0,
  current_amount BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  crypto_address VARCHAR(255) NOT NULL DEFAULT '0x552288268cdb748ee4164e981fb6b261631cd367',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE donation_causes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active donation causes
CREATE POLICY "Anyone can view active donation causes" ON donation_causes
  FOR SELECT USING (is_active = true);

-- Allow admins to manage donation causes
CREATE POLICY "Admins can manage donation causes" ON donation_causes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.username LIKE 'admin_%'
    )
  );

-- Create function to update current_amount when donations are made
CREATE OR REPLACE FUNCTION update_donation_cause_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_amount in donation_causes when a new donation is added
  UPDATE donation_causes 
  SET current_amount = current_amount + NEW.amount,
      updated_at = NOW()
  WHERE title = NEW.cause;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update donation amounts
DROP TRIGGER IF EXISTS update_cause_amount_trigger ON donations;
CREATE TRIGGER update_cause_amount_trigger
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_cause_amount();

-- Insert some sample donation causes
INSERT INTO donation_causes (title, description, goal_amount, crypto_address) VALUES
('Legal Aid for Marginalized Communities', 'Providing free legal representation for those who cannot afford justice', 100000000, '0x552288268cdb748ee4164e981fb6b261631cd367'),
('Anti-Corruption Investigation Fund', 'Supporting independent investigations into government corruption', 150000000, '0x552288268cdb748ee4164e981fb6b261631cd367'),
('Environmental Justice Advocacy', 'Fighting for communities affected by environmental violations', 75000000, '0x552288268cdb748ee4164e981fb6b261631cd367');
