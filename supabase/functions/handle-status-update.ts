import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Hello from handle-status-update!');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the request body
    const { record, oldRecord } = await req.json();

    // Only proceed if there's a status change
    if (record.status === oldRecord.status) {
      return new Response(
        JSON.stringify({ message: 'No status change detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the user's email if the grievance is not anonymous
    let userEmail = null;
    if (record.user_id) {
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('email')
        .eq('id', record.user_id)
        .single();

      if (userError) throw userError;
      if (userData) userEmail = userData.email;
    }

    // Send notification if we have an email
    if (userEmail) {
      // Call your notification service here
      // For this example, we'll just log it
      console.log(`Status update notification for grievance ${record.id}:`, {
        email: userEmail,
        oldStatus: oldRecord.status,
        newStatus: record.status,
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Status update processed successfully',
        notificationSent: !!userEmail 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
}); 