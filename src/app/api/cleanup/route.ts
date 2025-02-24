import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: Request) {
  try {
    // Basic security check using an API key
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.CLEANUP_API_KEY;
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the cleanup function
    const { error } = await supabase.rpc('clean_old_notifications');
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clean up notifications' },
      { status: 500 }
    );
  }
} 