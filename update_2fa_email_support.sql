-- Update database to support email 2FA method
-- This script adds support for multiple 2FA methods (email and authenticator)

-- Add column to track 2FA method if it doesn't exist
ALTER TABLE user_2fa 
ADD COLUMN IF NOT EXISTS two_fa_method VARCHAR(20) DEFAULT 'authenticator';

-- Add constraint for valid methods
ALTER TABLE user_2fa 
DROP CONSTRAINT IF EXISTS check_two_fa_method;

ALTER TABLE user_2fa 
ADD CONSTRAINT check_two_fa_method 
CHECK (two_fa_method IN ('email', 'authenticator'));

-- Add column to users table to track preferred 2FA method
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_2fa_method 
ON user_2fa(user_id, two_fa_method);

-- Update existing records to have the default method
UPDATE user_2fa 
SET two_fa_method = 'authenticator' 
WHERE two_fa_method IS NULL;

-- Create table for email 2FA codes if needed (for persistent storage)
CREATE TABLE IF NOT EXISTS email_2fa_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    used BOOLEAN DEFAULT FALSE,
    
    -- Index for faster lookups
    CONSTRAINT unique_active_code UNIQUE (user_id, code)
);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_2fa_codes_expires 
ON email_2fa_codes(expires_at) 
WHERE used = FALSE;

-- Enable RLS on email_2fa_codes
ALTER TABLE email_2fa_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for email_2fa_codes
CREATE POLICY "Users can only see their own codes" ON email_2fa_codes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all codes" ON email_2fa_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM email_2fa_codes 
    WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired codes
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-2fa-codes', '*/10 * * * *', 'SELECT cleanup_expired_2fa_codes();');

COMMENT ON COLUMN user_2fa.two_fa_method IS 'Method used for 2FA: email or authenticator';
COMMENT ON TABLE email_2fa_codes IS 'Temporary storage for email 2FA verification codes';
COMMENT ON FUNCTION cleanup_expired_2fa_codes() IS 'Removes expired or used 2FA codes from the database';