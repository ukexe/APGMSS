import { Database } from './supabase';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type GrievanceResponse = Tables<'grievances'>;
export type CategoryResponse = Tables<'categories'>;

export type ApiError = {
  message: string;
  status: number;
}; 