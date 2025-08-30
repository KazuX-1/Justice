-- Add crypto payment support to donations table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'traditional',
ADD COLUMN IF NOT EXISTS crypto_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';

-- Update existing donations to have traditional payment method
UPDATE donations 
SET payment_method = 'traditional' 
WHERE payment_method IS NULL;

-- Create index for faster queries on payment method
CREATE INDEX IF NOT EXISTS idx_donations_payment_method ON donations(payment_method);
CREATE INDEX IF NOT EXISTS idx_donations_verification_status ON donations(verification_status);
