-- Migration: Add account_type to broker_accounts
-- Date: 2025-01-03
-- Description: Add account type field to identify Market Direct vs Institucional accounts

-- Add account_type column if it doesn't exist
ALTER TABLE broker_accounts
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'Market Direct';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_broker_accounts_account_type ON broker_accounts(account_type);

-- Update existing accounts based on group_name
UPDATE broker_accounts
SET account_type = CASE
    WHEN group_name ILIKE '%institutional%' OR group_name ILIKE '%inst%' THEN 'Institucional'
    ELSE 'Market Direct'
END
WHERE account_type IS NULL OR account_type = 'Market Direct';

-- Add comment
COMMENT ON COLUMN broker_accounts.account_type IS 'Account type: Market Direct (all instruments) or Institucional (Forex/Metals only)';
