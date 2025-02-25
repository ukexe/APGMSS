-- Create workflow states enum
CREATE TYPE public.workflow_state AS ENUM (
    -- Administrative
    'Received',
    'Verification_Categorization',
    'Stakeholder_Assignment',
    'Resolution_Planning',
    'Implementation_Response',
    'Completed',
    
    -- General
    'Complaint_Submission',
    'Initial_Assessment',
    'Internal_Review',
    'Resolution_Execution',
    'Final_Confirmation',
    
    -- Infrastructure
    'Issue_Logged',
    'Site_Inspection',
    'Resource_Allocation',
    'Repair_Execution',
    'Quality_Check',
    
    -- Technical
    'Technical_Issue_Reported',
    'Issue_Diagnosis',
    'Root_Cause_Analysis',
    'Fix_Implementation',
    'Testing_Verification',
    
    -- Other
    'Complaint_Registration',
    'Review_Classification',
    'Action_Plan_Development',
    'Solution_Execution',
    'Feedback_Collection'
);

-- Create workflow templates table
CREATE TABLE public.workflow_templates (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id),
    workflow_states workflow_state[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create grievance workflow table
CREATE TABLE public.grievance_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grievance_id UUID REFERENCES public.grievances(id),
    current_state workflow_state NOT NULL,
    state_history JSONB NOT NULL DEFAULT '[]',
    assigned_to UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert workflow templates for each category
INSERT INTO public.workflow_templates (category_id, workflow_states) VALUES
    -- Administrative
    ((SELECT id FROM public.categories WHERE name = 'Administrative'), 
     ARRAY['Received', 'Verification_Categorization', 'Stakeholder_Assignment', 'Resolution_Planning', 'Implementation_Response', 'Completed']::workflow_state[]),
    
    -- General
    ((SELECT id FROM public.categories WHERE name = 'General'), 
     ARRAY['Complaint_Submission', 'Initial_Assessment', 'Internal_Review', 'Resolution_Execution', 'Final_Confirmation', 'Completed']::workflow_state[]),
    
    -- Infrastructure
    ((SELECT id FROM public.categories WHERE name = 'Infrastructure'), 
     ARRAY['Issue_Logged', 'Site_Inspection', 'Resource_Allocation', 'Repair_Execution', 'Quality_Check', 'Completed']::workflow_state[]),
    
    -- Technical
    ((SELECT id FROM public.categories WHERE name = 'Technical'), 
     ARRAY['Technical_Issue_Reported', 'Issue_Diagnosis', 'Root_Cause_Analysis', 'Fix_Implementation', 'Testing_Verification', 'Completed']::workflow_state[]),
    
    -- Other
    ((SELECT id FROM public.categories WHERE name = 'Other'), 
     ARRAY['Complaint_Registration', 'Review_Classification', 'Action_Plan_Development', 'Solution_Execution', 'Feedback_Collection', 'Completed']::workflow_state[]);

-- Add trigger for updated_at
CREATE TRIGGER handle_workflow_updated_at
    BEFORE UPDATE ON public.grievance_workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add RLS policies
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_workflows ENABLE ROW LEVEL SECURITY;

-- Workflow templates can be read by all
CREATE POLICY "Workflow templates are viewable by all" ON public.workflow_templates
    FOR SELECT USING (true);

-- Grievance workflows can be viewed by admins and owners
CREATE POLICY "Grievance workflows viewable by admins and owners" ON public.grievance_workflows
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.grievances g
                WHERE g.id = grievance_workflows.grievance_id
                AND (g.user_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'))
            )
        )
    );

-- Only admins can update workflows
CREATE POLICY "Only admins can update workflows" ON public.grievance_workflows
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin')
    ); 