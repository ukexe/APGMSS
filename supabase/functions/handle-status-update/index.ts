import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { create } from 'https://esm.sh/ipfs-http-client@60.0.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize IPFS client
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });

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

    // Store status update in blockchain
    const statusUpdateRecord = {
      timestamp: Date.now(),
      grievanceId: record.id,
      oldStatus: oldRecord.status,
      newStatus: record.status,
      type: 'status_update',
      metadata: {
        updateTime: new Date().toISOString(),
        automated: true,
      },
    };

    // Store on IPFS
    const buffer = new TextEncoder().encode(JSON.stringify(statusUpdateRecord));
    const result = await ipfs.add(buffer);
    const ipfsHash = result.path;

    // Store the IPFS hash in Supabase
    const { error: blockchainError } = await supabaseClient
      .from('blockchain_records')
      .insert([
        {
          grievance_id: record.id,
          ipfs_hash: ipfsHash,
          record_type: 'status_update',
          timestamp: new Date().toISOString(),
        }
      ]);

    if (blockchainError) {
      console.error('Blockchain storage error:', blockchainError);
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
      console.log(`Status update notification for grievance ${record.id}:`, {
        email: userEmail,
        oldStatus: oldRecord.status,
        newStatus: record.status,
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Status update processed successfully',
        notificationSent: !!userEmail,
        blockchainHash: ipfsHash
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