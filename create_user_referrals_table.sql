-- Create user_referrals table for the affiliate system
-- This table tracks referral relationships and commissions
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 
-- OR use psql command line:
-- psql -h your-host -p 5432 -U postgres -d your-database -f create_user_referrals_table.sql

CREATE TABLE IF NOT EXISTS user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL,
    referred_user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    commission_earned DECIMAL(10,2) DEFAULT 0.00,
    commission_currency VARCHAR(3) DEFAULT 'USD',
    referral_code VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints
    CONSTRAINT fk_referrer_user FOREIGN KEY (referrer_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_referred_user FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate referrals
    CONSTRAINT unique_referral UNIQUE (referrer_user_id, referred_user_id),
    
    -- Check constraints
    CONSTRAINT check_status CHECK (status IN ('pending', 'active', 'inactive', 'cancelled')),
    CONSTRAINT check_commission_positive CHECK (commission_earned >= 0),
    CONSTRAINT check_no_self_referral CHECK (referrer_user_id != referred_user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer_status ON user_referrals(referrer_user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_created_at ON user_referrals(created_at);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referral_code ON user_referrals(referral_code);

-- Create affiliate_payments table for payment history
CREATE TABLE IF NOT EXISTS affiliate_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraint
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT check_payment_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT check_payment_amount_positive CHECK (amount > 0)
);

-- Create indexes for affiliate_payments
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_user_id ON affiliate_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_status ON affiliate_payments(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_created_at ON affiliate_payments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_referrals
CREATE POLICY "Users can view their own referrals" ON user_referrals
    FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can insert referrals where they are the referrer" ON user_referrals
    FOR INSERT WITH CHECK (referrer_user_id = auth.uid());

CREATE POLICY "Users can update their own referrals" ON user_referrals
    FOR UPDATE USING (referrer_user_id = auth.uid());

-- Create RLS policies for affiliate_payments
CREATE POLICY "Users can view their own payments" ON affiliate_payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment requests" ON affiliate_payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_referrals_updated_at 
    BEFORE UPDATE ON user_referrals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- Note: Replace these UUIDs with actual user IDs from your system
/*
INSERT INTO user_referrals (referrer_user_id, referred_user_id, status, commission_earned) VALUES
('dfe5c068-bddf-419d-b816-08303dd276ea', '11111111-1111-1111-1111-111111111111', 'active', 25.50),
('dfe5c068-bddf-419d-b816-08303dd276ea', '22222222-2222-2222-2222-222222222222', 'active', 15.75),
('dfe5c068-bddf-419d-b816-08303dd276ea', '33333333-3333-3333-3333-333333333333', 'pending', 0.00);
*/

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON user_referrals TO authenticated;
-- GRANT SELECT, INSERT ON affiliate_payments TO authenticated;

COMMENT ON TABLE user_referrals IS 'Tracks referral relationships between users and commission earnings';
COMMENT ON TABLE affiliate_payments IS 'Tracks affiliate commission payments and withdrawal requests';