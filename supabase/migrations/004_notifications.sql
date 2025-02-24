-- Enable the pg_cron extension if it's available
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping pg_cron extension - insufficient privileges';
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    grievance_id UUID REFERENCES public.grievances(id),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_grievance_id ON public.notifications(grievance_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION public.clean_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND read = true;
END;
$$ LANGUAGE plpgsql; 