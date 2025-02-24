import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer/';
import { supabase } from './supabase';
import './fetch-polyfill';

// Initialize IPFS client with Infura credentials
const projectId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
const ipfsEndpoint = process.env.NEXT_PUBLIC_IPFS_ENDPOINT;

if (!projectId || !ipfsEndpoint) {
  throw new Error('Missing Infura configuration');
}

// Create authorization header
const auth = 'Basic ' + Buffer.from(projectId + ':').toString('base64');

// Initialize IPFS client
const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth
  }
});

export interface BlockchainRecord {
  id: string;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
}

export async function storeGrievanceRecord(grievanceData: any): Promise<string> {
  try {
    // Create a record with timestamp and data
    const record = {
      timestamp: Date.now(),
      data: grievanceData,
      type: 'grievance_record'
    };

    // Convert record to Buffer
    const buffer = Buffer.from(JSON.stringify(record));

    // Store on IPFS
    const result = await ipfs.add(buffer);
    const ipfsHash = result.path;

    // Store the IPFS hash in Supabase
    const { error } = await supabase
      .from('blockchain_records')
      .insert([
        {
          grievance_id: grievanceData.id,
          ipfs_hash: ipfsHash,
          record_type: 'grievance',
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    return ipfsHash;
  } catch (error) {
    console.error('Error storing grievance record:', error);
    throw error;
  }
}

export async function verifyGrievanceRecord(grievanceId: string): Promise<boolean> {
  try {
    // Get the IPFS hash from Supabase
    const { data, error } = await supabase
      .from('blockchain_records')
      .select('ipfs_hash')
      .eq('grievance_id', grievanceId)
      .single();

    if (error) throw error;
    if (!data) return false;

    // Retrieve the record from IPFS
    const chunks: Uint8Array[] = [];
    for await (const chunk of ipfs.cat(data.ipfs_hash)) {
      chunks.push(chunk);
    }
    const retrievedData = Buffer.concat(chunks).toString();

    // Verify the record
    const record = JSON.parse(retrievedData);
    return record.type === 'grievance_record' && record.data.id === grievanceId;
  } catch (error) {
    console.error('Error verifying grievance record:', error);
    return false;
  }
}

export async function getGrievanceHistory(grievanceId: string): Promise<any[]> {
  try {
    // Get all IPFS hashes for the grievance
    const { data, error } = await supabase
      .from('blockchain_records')
      .select('*')
      .eq('grievance_id', grievanceId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    // Retrieve all records from IPFS
    const history = await Promise.all(
      data.map(async (record) => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of ipfs.cat(record.ipfs_hash)) {
          chunks.push(chunk);
        }
        const retrievedData = Buffer.concat(chunks).toString();
        return JSON.parse(retrievedData);
      })
    );

    return history;
  } catch (error) {
    console.error('Error retrieving grievance history:', error);
    return [];
  }
}

export async function storeStatusUpdate(
  grievanceId: string,
  oldStatus: string,
  newStatus: string
): Promise<string> {
  try {
    const updateRecord = {
      timestamp: Date.now(),
      grievanceId,
      oldStatus,
      newStatus,
      type: 'status_update'
    };

    // Store on IPFS
    const buffer = Buffer.from(JSON.stringify(updateRecord));
    const result = await ipfs.add(buffer);
    const ipfsHash = result.path;

    // Store the reference in Supabase
    const { error } = await supabase
      .from('blockchain_records')
      .insert([
        {
          grievance_id: grievanceId,
          ipfs_hash: ipfsHash,
          record_type: 'status_update',
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    return ipfsHash;
  } catch (error) {
    console.error('Error storing status update:', error);
    throw error;
  }
} 