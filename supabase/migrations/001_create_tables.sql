-- =====================================================
-- SUPABASE MIGRATION SCRIPT: Firebase to Supabase
-- Project: AGM Broker
-- Date: 2025
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE (Main user profiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    -- Primary key (matches Supabase Auth UUID)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core user data
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    user_type TEXT DEFAULT 'broker',
    
    -- Profile information
    nombre TEXT,
    apellido TEXT,
    pais TEXT,
    ciudad TEXT,
    phone_code TEXT,
    phone_number TEXT,
    photo_url TEXT,
    fecha_nacimiento DATE,
    
    -- Referral system
    referral_count INTEGER DEFAULT 0,
    referred_by UUID REFERENCES public.users(id),
    
    -- Payment methods (JSONB array)
    payment_methods JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_time TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better query performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_referred_by ON public.users(referred_by);
CREATE INDEX idx_users_user_type ON public.users(user_type);

-- =====================================================
-- 2. TRADING ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key to users
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Account information
    account_number TEXT UNIQUE NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('DEMO', 'Real')),
    account_type_selection TEXT CHECK (account_type_selection IN ('Zero Spread', 'Standard')),
    
    -- Trading parameters
    leverage TEXT,
    balance DECIMAL(20, 2) DEFAULT 0.00,
    equity DECIMAL(20, 2) DEFAULT 0.00,
    margin DECIMAL(20, 2) DEFAULT 0.00,
    free_margin DECIMAL(20, 2) DEFAULT 0.00,
    margin_level DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Platform information
    currency TEXT DEFAULT 'USD',
    server TEXT DEFAULT 'AGM-Server',
    platform TEXT DEFAULT 'MetaTrader 5',
    status TEXT DEFAULT 'Active',
    investor_password TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_trading_accounts_user_id ON public.trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_account_number ON public.trading_accounts(account_number);
CREATE INDEX idx_trading_accounts_status ON public.trading_accounts(status);

-- =====================================================
-- 3. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
    
    -- Transaction details
    account_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('depositar', 'retirar', 'transferir')),
    amount DECIMAL(20, 2) NOT NULL,
    method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    
    -- Optional fields for specific transaction types
    coin TEXT,
    wallet_address TEXT,
    to_account_id UUID REFERENCES public.trading_accounts(id),
    to_account_name TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- =====================================================
-- 4. COPY RELATIONSHIPS TABLE (for copytrading)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.copy_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- MT5 Account IDs (stored as text for compatibility)
    master_mt5_account_id TEXT NOT NULL,
    follower_mt5_account_id TEXT NOT NULL,
    
    -- Relationship details
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
    risk_ratio DECIMAL(5, 2) DEFAULT 1.00,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique relationship
    UNIQUE(master_mt5_account_id, follower_mt5_account_id)
);

-- Create indexes
CREATE INDEX idx_copy_relationships_master ON public.copy_relationships(master_mt5_account_id);
CREATE INDEX idx_copy_relationships_follower ON public.copy_relationships(follower_mt5_account_id);
CREATE INDEX idx_copy_relationships_status ON public.copy_relationships(status);

-- =====================================================
-- 5. REPLICATION QUEUE TABLE (for trade copying)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.replication_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Queue status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'completed_no_followers')),
    
    -- Master trade information
    master_mt5_account_id TEXT NOT NULL,
    master_trade_details JSONB NOT NULL,
    
    -- Processing results
    processed_at TIMESTAMPTZ,
    results JSONB,
    error TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_replication_queue_status ON public.replication_queue(status);
CREATE INDEX idx_replication_queue_master ON public.replication_queue(master_mt5_account_id);
CREATE INDEX idx_replication_queue_created_at ON public.replication_queue(created_at DESC);

-- =====================================================
-- 6. USER PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key to users
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Preferences (stored as JSONB for flexibility)
    favorite_pip_instruments JSONB DEFAULT '[]'::jsonb,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'es',
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Additional preferences
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- =====================================================
-- 7. TRIGGER FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON public.trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copy_relationships_updated_at BEFORE UPDATE ON public.copy_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. REFERRAL COUNT INCREMENT FUNCTION
-- (Replaces Firebase Cloud Function)
-- =====================================================
CREATE OR REPLACE FUNCTION increment_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    -- If new user has a referrer, increment their count
    IF NEW.referred_by IS NOT NULL THEN
        UPDATE public.users 
        SET referral_count = referral_count + 1
        WHERE id = NEW.referred_by;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral count
CREATE TRIGGER increment_referral_on_user_create
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION increment_referral_count();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replication_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow user registration" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trading accounts policies
CREATE POLICY "Users can view own trading accounts" ON public.trading_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trading accounts" ON public.trading_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trading accounts" ON public.trading_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trading accounts" ON public.trading_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Copy relationships policies
CREATE POLICY "Users can view relationships" ON public.copy_relationships
    FOR SELECT USING (true); -- Public visibility for copytrading

CREATE POLICY "Users can manage own relationships" ON public.copy_relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.trading_accounts
            WHERE (account_number = master_mt5_account_id OR account_number = follower_mt5_account_id)
            AND user_id = auth.uid()
        )
    );

-- Replication queue policies (admin only, handled by service role)
CREATE POLICY "Service role only" ON public.replication_queue
    FOR ALL USING (auth.role() = 'service_role');

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Function to create a new user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    
    -- Also create default user preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 11. INITIAL DATA / SEED (Optional)
-- =====================================================

-- Add any initial data here if needed
-- Example: INSERT INTO public.users (...) VALUES (...);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Note: After running this migration:
-- 1. Test all RLS policies
-- 2. Verify triggers are working
-- 3. Check indexes performance
-- 4. Set up storage buckets via Supabase Dashboard
-- =====================================================