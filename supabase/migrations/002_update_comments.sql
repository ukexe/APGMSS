-- Add comments to explain the user_id field behavior
COMMENT ON COLUMN public.grievances.user_id IS 'References auth.users(id). NULL for anonymous submissions. Must exist in auth.users table when not NULL.';

-- Add comments to explain the grievances table behavior
COMMENT ON TABLE public.grievances IS 'Stores grievance submissions. Supports both anonymous (user_id is NULL) and authenticated (user_id references auth.users) submissions.'; 