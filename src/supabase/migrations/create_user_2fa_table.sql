-- Create user_2fa table for two-factor authentication
CREATE TABLE IF NOT EXISTS public.user_2fa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    backup_codes TEXT[] DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used TIMESTAMPTZ,
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Create policies for user_2fa table
-- Users can only read their own 2FA settings
CREATE POLICY "Users can view own 2FA settings" ON public.user_2fa
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own 2FA settings
CREATE POLICY "Users can insert own 2FA settings" ON public.user_2fa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own 2FA settings
CREATE POLICY "Users can update own 2FA settings" ON public.user_2fa
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own 2FA settings
CREATE POLICY "Users can delete own 2FA settings" ON public.user_2fa
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON public.user_2fa(user_id);

-- Add two_factor_enabled column to users table if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;