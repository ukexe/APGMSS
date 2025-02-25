export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          created_at?: string;
        };
      };
      grievances: {
        Row: {
          id: string;
          user_id?: string;
          title: string;
          description: string;
          category_id: number;
          language: 'Tamil' | 'English';
          status: 'Pending' | 'In Progress' | 'Resolved';
          priority: 'Low' | 'Medium' | 'High';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description: string;
          category_id: number;
          language: 'Tamil' | 'English';
          status?: 'Pending' | 'In Progress' | 'Resolved';
          priority?: 'Low' | 'Medium' | 'High';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category_id?: number;
          language?: 'Tamil' | 'English';
          status?: 'Pending' | 'In Progress' | 'Resolved';
          priority?: 'Low' | 'Medium' | 'High';
          created_at?: string;
          updated_at?: string;
        };
      };
      workflow_templates: {
        Row: {
          id: number;
          category_id: number;
          workflow_states: WorkflowState[];
          created_at: string;
        };
        Insert: {
          id?: number;
          category_id: number;
          workflow_states: WorkflowState[];
          created_at?: string;
        };
        Update: {
          id?: number;
          category_id?: number;
          workflow_states?: WorkflowState[];
          created_at?: string;
        };
      };
      grievance_workflows: {
        Row: {
          id: string;
          grievance_id: string;
          current_state: WorkflowState;
          state_history: string;
          assigned_to: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          grievance_id: string;
          current_state: WorkflowState;
          state_history: string;
          assigned_to?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          grievance_id?: string;
          current_state?: WorkflowState;
          state_history?: string;
          assigned_to?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      grievance_language: 'Tamil' | 'English';
      grievance_status: 'Pending' | 'In Progress' | 'Resolved';
      grievance_priority: 'Low' | 'Medium' | 'High';
      workflow_state: 
        | 'Received'
        | 'Verification_Categorization'
        | 'Stakeholder_Assignment'
        | 'Resolution_Planning'
        | 'Implementation_Response'
        | 'Completed'
        | 'Complaint_Submission'
        | 'Initial_Assessment'
        | 'Internal_Review'
        | 'Resolution_Execution'
        | 'Final_Confirmation'
        | 'Issue_Logged'
        | 'Site_Inspection'
        | 'Resource_Allocation'
        | 'Repair_Execution'
        | 'Quality_Check'
        | 'Technical_Issue_Reported'
        | 'Issue_Diagnosis'
        | 'Root_Cause_Analysis'
        | 'Fix_Implementation'
        | 'Testing_Verification'
        | 'Complaint_Registration'
        | 'Review_Classification'
        | 'Action_Plan_Development'
        | 'Solution_Execution'
        | 'Feedback_Collection';
    };
  };
};

export type WorkflowState = Database['public']['Enums']['workflow_state']; 