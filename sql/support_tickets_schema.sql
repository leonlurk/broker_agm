-- Enhanced Chat Support System Schema
-- Run this SQL in your Supabase SQL editor

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'archived', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    user_email TEXT,
    user_name TEXT,
    subject TEXT DEFAULT 'Soporte General'
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'ai')),
    sender_id TEXT,
    sender_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Interventions Table
CREATE TABLE IF NOT EXISTS admin_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    admin_id TEXT NOT NULL,
    admin_name TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_message ON support_tickets(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_interventions_ticket_id ON admin_interventions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_admin_interventions_active ON admin_interventions(ticket_id) WHERE ended_at IS NULL;

-- Function to update ticket's last_message_at
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_tickets
    SET last_message_at = NEW.created_at,
        updated_at = NOW(),
        status = CASE
            WHEN status = 'archived' THEN 'open'
            ELSE status
        END
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_message_at
DROP TRIGGER IF EXISTS trigger_update_last_message ON support_messages;
CREATE TRIGGER trigger_update_last_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_ticket_last_message();

-- Function to auto-archive inactive tickets (run via cron job or scheduled function)
CREATE OR REPLACE FUNCTION auto_archive_inactive_tickets()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE support_tickets
    SET status = 'archived',
        updated_at = NOW()
    WHERE status = 'open'
    AND last_message_at < NOW() - INTERVAL '24 hours';

    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (adjust based on your auth setup)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_interventions ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid()::text OR auth.jwt() ->> 'role' = 'admin');

-- Users can insert their own tickets
CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Admins can update any ticket
CREATE POLICY "Admins can update tickets" ON support_tickets
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Messages policies
CREATE POLICY "Users can view messages of own tickets" ON support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_messages.ticket_id
            AND (support_tickets.user_id = auth.uid()::text OR auth.jwt() ->> 'role' = 'admin')
        )
    );

CREATE POLICY "Users can send messages to own tickets" ON support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets
            WHERE support_tickets.id = support_messages.ticket_id
            AND support_tickets.user_id = auth.uid()::text
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

-- Interventions visible to admins only
CREATE POLICY "Admins can manage interventions" ON admin_interventions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime for messages
ALTER publication supabase_realtime ADD TABLE support_messages;
ALTER publication supabase_realtime ADD TABLE support_tickets;

-- View for active interventions
CREATE OR REPLACE VIEW active_interventions AS
SELECT
    ai.id,
    ai.ticket_id,
    ai.admin_id,
    ai.admin_name,
    ai.started_at,
    st.user_id,
    st.user_name,
    st.status as ticket_status
FROM admin_interventions ai
JOIN support_tickets st ON st.id = ai.ticket_id
WHERE ai.ended_at IS NULL;

-- Grant permissions
GRANT SELECT ON active_interventions TO authenticated;
