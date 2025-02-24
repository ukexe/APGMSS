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
    };
    Enums: {
      grievance_language: 'Tamil' | 'English';
      grievance_status: 'Pending' | 'In Progress' | 'Resolved';
      grievance_priority: 'Low' | 'Medium' | 'High';
    };
  };
}; 