-- Create withdrawal_requests table for storing pending withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    method VARCHAR(50) NOT NULL,
    currency VARCHAR(20) NOT NULL,
    account_id INTEGER,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    wallet_address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled')),
    two_fa_verified BOOLEAN DEFAULT false,
    admin_notes TEXT,
    rejection_reason TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawal_requests
-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawal requests" ON withdrawal_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND two_fa_verified = true);

-- Only admins can update withdrawal requests (for approval/rejection)
CREATE POLICY "Admins can update withdrawal requests" ON withdrawal_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_withdrawal_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_withdrawal_requests_updated_at
    BEFORE UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawal_request_updated_at();

-- Function to check 2FA before allowing withdrawal request
CREATE OR REPLACE FUNCTION check_2fa_for_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has 2FA enabled
    IF NOT EXISTS (
        SELECT 1 FROM user_2fa 
        WHERE user_id = NEW.user_id 
        AND enabled = true
    ) THEN
        RAISE EXCEPTION 'Two-factor authentication must be enabled to make withdrawals';
    END IF;
    
    -- Ensure two_fa_verified is true
    IF NEW.two_fa_verified != true THEN
        RAISE EXCEPTION 'Two-factor authentication verification required';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce 2FA verification for withdrawals
CREATE TRIGGER enforce_2fa_for_withdrawals
    BEFORE INSERT ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_2fa_for_withdrawal();

-- Grant permissions
GRANT SELECT ON withdrawal_requests TO authenticated;
GRANT INSERT ON withdrawal_requests TO authenticated;
GRANT UPDATE ON withdrawal_requests TO authenticated;