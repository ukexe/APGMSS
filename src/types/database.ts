export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  created_at: string;
};

export type Status = 'Pending' | 'In Progress' | 'Resolved';

export type Language = 'Tamil' | 'English';

export type Grievance = {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  category_id: number;
  language: Language;
  status: Status;
  priority: 'Low' | 'Medium' | 'High';
  created_at: string;
  updated_at: string;
}; 