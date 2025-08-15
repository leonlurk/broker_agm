-- Create KYC verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    residence_country TEXT NOT NULL,
    document_country TEXT NOT NULL,
    document_type TEXT NOT NULL,
    front_document_url TEXT NOT NULL,
    back_document_url TEXT NOT NULL,
    selfie_document_url TEXT NOT NULL,
    address_proof_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_email ON kyc_verifications(email);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);

-- Add KYC status fields to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted';

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for KYC verifications table
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own KYC submissions
CREATE POLICY "Users can view own KYC" ON kyc_verifications
    FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own KYC submissions
CREATE POLICY "Users can submit KYC" ON kyc_verifications
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Service role can do everything (for admin functions)
CREATE POLICY "Service role full access" ON kyc_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Set up storage policies for KYC documents
CREATE POLICY "Users can upload KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own KYC documents
CREATE POLICY "Users can view own KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own KYC documents (for re-submission)
CREATE POLICY "Users can delete own KYC documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'kyc-documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Service role can access all KYC documents
CREATE POLICY "Service role can access all KYC documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'kyc-documents' AND 
        auth.role() = 'service_role'
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_kyc_verifications_updated_at 
    BEFORE UPDATE ON kyc_verifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();