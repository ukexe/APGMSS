import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Status = Database['public']['Enums']['grievance_status'];

export const testGrievanceSubmission = async (
  title: string,
  description: string,
  category_id: number,
  language: 'English' | 'Tamil',
  isAnonymous: boolean,
  user_id?: string
) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .insert([
        {
          title,
          description,
          category_id,
          language,
          status: 'Pending' as Status,
          priority: 'Medium',
          user_id: isAnonymous ? null : user_id,
        },
      ])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Test grievance submission failed:', error);
    return { success: false, error };
  }
};

export const verifyGrievanceStatus = async (grievanceId: string) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', grievanceId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Status verification failed:', error);
    return { success: false, error };
  }
};

export const testStatusUpdate = async (
  grievanceId: string,
  newStatus: Status
) => {
  try {
    const { data, error } = await supabase
      .from('grievances')
      .update({ status: newStatus })
      .eq('id', grievanceId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Status update test failed:', error);
    return { success: false, error };
  }
};

export const checkRealtimeUpdates = (
  grievanceId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'grievances',
        filter: `id=eq.${grievanceId}`,
      },
      callback
    )
    .subscribe();
};

export const validateOCRResult = (text: string) => {
  // Basic validation of OCR output
  return {
    hasContent: text.length > 0,
    hasValidStructure: text.split('\n').length > 0,
    approximateWordCount: text.split(/\s+/).length,
  };
};

export const testResponsiveness = () => {
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  };

  return {
    isMobile: window.innerWidth < breakpoints.md,
    isTablet: window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg,
    isDesktop: window.innerWidth >= breakpoints.lg,
    currentWidth: window.innerWidth,
    currentHeight: window.innerHeight,
  };
}; 