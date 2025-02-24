-- Create enum types for status and language
CREATE TYPE public.grievance_status AS ENUM ('Pending', 'In Progress', 'Resolved');
CREATE TYPE public.grievance_language AS ENUM ('Tamil', 'English');
CREATE TYPE public.grievance_priority AS ENUM ('Low', 'Medium', 'High');

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create grievances table
CREATE TABLE public.grievances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES public.categories(id) NOT NULL,
    language grievance_language NOT NULL,
    status grievance_status DEFAULT 'Pending' NOT NULL,
    priority grievance_priority DEFAULT 'Medium' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grievances policies
CREATE POLICY "Users can view their own grievances" ON public.grievances
    FOR SELECT USING (
        auth.uid() = user_id OR user_id IS NULL
    );

CREATE POLICY "Users can create grievances" ON public.grievances
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Insert default categories
INSERT INTO public.categories (name) VALUES
    ('General'),
    ('Technical'),
    ('Administrative'),
    ('Academic'),
    ('Infrastructure'),
    ('Other');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.grievances
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 