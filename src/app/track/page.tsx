'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { verifyGrievanceRecord, getGrievanceHistory } from '../../lib/blockchain';
import type { Database } from '../../types/supabase';
import type { GrievanceResponse, CategoryResponse } from '../../types/api';

type Status = Database['public']['Enums']['grievance_status'];

export default function TrackPage() {
  const [grievances, setGrievances] = useState<(GrievanceResponse & { category: CategoryResponse })[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<Record<string, boolean>>({});
  const [selectedGrievance, setSelectedGrievance] = useState<string | null>(null);
  const [grievanceHistory, setGrievanceHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      const { data, error } = await supabase
        .from('grievances')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setGrievances(data);
        // Verify each grievance
        data.forEach(grievance => {
          verifyGrievance(grievance.id);
        });
      }
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyGrievance = async (grievanceId: string) => {
    try {
      const isVerified = await verifyGrievanceRecord(grievanceId);
      setVerificationStatus(prev => ({
        ...prev,
        [grievanceId]: isVerified
      }));
    } catch (error) {
      console.error('Error verifying grievance:', error);
    }
  };

  const viewHistory = async (grievanceId: string) => {
    setSelectedGrievance(grievanceId);
    try {
      const history = await getGrievanceHistory(grievanceId);
      setGrievanceHistory(history);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Track Grievances</h1>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {grievances.map((grievance) => (
              <li key={grievance.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{grievance.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{grievance.description}</p>
                    </div>
                    <div className="ml-6 flex-shrink-0 flex flex-col items-end space-y-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(grievance.status)}`}>
                        {grievance.status}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        verificationStatus[grievance.id]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {verificationStatus[grievance.id] ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Category: {grievance.category.name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        Language: {grievance.language}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        Priority: {grievance.priority}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <button
                        onClick={() => viewHistory(grievance.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View History
                      </button>
                    </div>
                  </div>
                </div>

                {selectedGrievance === grievance.id && grievanceHistory.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">History</h4>
                    <div className="space-y-2">
                      {grievanceHistory.map((record, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {record.type === 'status_update' ? (
                            <p>
                              Status changed from {record.oldStatus} to {record.newStatus} on{' '}
                              {new Date(record.timestamp).toLocaleString()}
                            </p>
                          ) : (
                            <p>
                              {record.type} recorded on{' '}
                              {new Date(record.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 