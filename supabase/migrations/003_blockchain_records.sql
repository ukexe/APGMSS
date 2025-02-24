-- Create blockchain_records table
CREATE TABLE public.blockchain_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grievance_id UUID REFERENCES public.grievances(id),
    ipfs_hash TEXT NOT NULL,
    record_type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.blockchain_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.blockchain_records
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.blockchain_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX idx_blockchain_records_grievance_id ON public.blockchain_records(grievance_id);

-- Create function to verify record integrity
CREATE OR REPLACE FUNCTION verify_blockchain_record(record_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    record_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM blockchain_records 
        WHERE id = record_id
    ) INTO record_exists;
    
    RETURN record_exists;
END;
$$ LANGUAGE plpgsql; 