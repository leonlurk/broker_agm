-- Migration: Add pending closed positions table
-- Description: Stores provisional closed positions for optimistic UI updates until real position is synced from MT5

-- Create table for pending closed positions
CREATE TABLE IF NOT EXISTS public.pending_closed_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number BIGINT NOT NULL,
  ticket BIGINT NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL, -- 'BUY' or 'SELL'
  volume DECIMAL(10, 2) NOT NULL,
  open_price DECIMAL(20, 5) NOT NULL,
  open_time TIMESTAMPTZ NOT NULL,
  close_price DECIMAL(20, 5), -- Estimated from current price at close time
  close_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stop_loss DECIMAL(20, 5),
  take_profit DECIMAL(20, 5),
  profit DECIMAL(10, 2), -- Estimated profit at close time
  commission DECIMAL(10, 2),
  swap DECIMAL(10, 2),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '3 days', -- Auto-cleanup after 3 days

  -- Prevent duplicates
  UNIQUE(account_number, ticket)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_closed_account ON public.pending_closed_positions(account_number);
CREATE INDEX IF NOT EXISTS idx_pending_closed_user ON public.pending_closed_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_closed_ticket ON public.pending_closed_positions(ticket);
CREATE INDEX IF NOT EXISTS idx_pending_closed_expires ON public.pending_closed_positions(expires_at);

-- Enable RLS
ALTER TABLE public.pending_closed_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage their own pending positions
DROP POLICY IF EXISTS "Users can view their own pending closed positions" ON public.pending_closed_positions;
CREATE POLICY "Users can view their own pending closed positions"
  ON public.pending_closed_positions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pending closed positions" ON public.pending_closed_positions;
CREATE POLICY "Users can insert their own pending closed positions"
  ON public.pending_closed_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pending closed positions" ON public.pending_closed_positions;
CREATE POLICY "Users can delete their own pending closed positions"
  ON public.pending_closed_positions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically cleanup expired pending positions
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.pending_closed_positions
    WHERE expires_at < NOW();

    RAISE NOTICE 'Cleaned up expired pending closed positions';
END;
$$;

-- Function to remove pending position when real position is detected
CREATE OR REPLACE FUNCTION public.remove_pending_if_real_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When a closed position is inserted/updated in mt5_operations
    -- Remove any matching pending position
    DELETE FROM public.pending_closed_positions
    WHERE account_number = NEW.login
      AND ticket = NEW.position_id
      AND NEW.close_time IS NOT NULL; -- Only if it's actually closed

    RETURN NEW;
END;
$$;

-- Create trigger to auto-remove pending when real appears
DROP TRIGGER IF EXISTS trigger_remove_pending_on_real_position ON public.mt5_operations;
CREATE TRIGGER trigger_remove_pending_on_real_position
    AFTER INSERT OR UPDATE ON public.mt5_operations
    FOR EACH ROW
    WHEN (NEW.close_time IS NOT NULL)
    EXECUTE FUNCTION public.remove_pending_if_real_exists();

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.pending_closed_positions TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_pending_positions TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.pending_closed_positions IS 'Temporary storage for closed positions pending MT5 sync - enables optimistic UI updates';
COMMENT ON COLUMN public.pending_closed_positions.expires_at IS 'Auto-cleanup timestamp - positions older than 3 days are automatically removed';
COMMENT ON FUNCTION public.cleanup_expired_pending_positions IS 'Removes pending positions that have expired (older than 3 days)';
COMMENT ON FUNCTION public.remove_pending_if_real_exists IS 'Trigger function that removes pending position when real closed position appears in mt5_operations';
