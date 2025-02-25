'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getWorkflowHistory } from '../../lib/workflow';
import type { WorkflowState } from '@/types/supabase';

type GrievanceWithWorkflow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  category: {
    name: string;
  };
  workflow?: {
    currentState: WorkflowState;
    history: Array<{
      state: WorkflowState;
      timestamp: string;
      notes: string;
    }>;
  };
};

export default function TrackPage() {
  const [grievances, setGrievances] = useState<GrievanceWithWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<string | null>(null);

  useEffect(() => {
    fetchGrievances();

    // Set up real-time subscription
    const channel = supabase
      .channel('grievances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grievances'
        },
        () => {
          fetchGrievances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGrievances = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please login to view your grievances');
        setGrievances([]);
        setLoading(false);
        return;
      }

      // Fetch grievances with their workflows in a single query
      const { data: grievancesData, error: grievancesError } = await supabase
        .from('grievances')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          category:categories!inner(
            id,
            name
          ),
          workflow:grievance_workflows!left(
            current_state,
            state_history
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (grievancesError) {
        console.error('Error fetching grievances:', grievancesError);
        setError('Failed to load grievances');
        setGrievances([]);
        return;
      }

      if (!grievancesData || grievancesData.length === 0) {
        setGrievances([]);
        return;
      }

      console.log('Raw grievances data:', grievancesData); // Debug log

      // Transform the data to include workflow information
      const transformedGrievances = grievancesData.map(grievance => ({
        id: grievance.id,
        title: grievance.title,
        description: grievance.description,
        status: grievance.status,
        priority: grievance.priority,
        created_at: grievance.created_at,
        category: {
          name: grievance.category?.[0]?.name || 'Unknown'
        },
        workflow: grievance.workflow?.[0] ? {
          currentState: grievance.workflow[0].current_state,
          history: grievance.workflow[0].state_history ? 
            JSON.parse(grievance.workflow[0].state_history) : []
        } : undefined
      }));

      console.log('Transformed grievances:', transformedGrievances); // Debug log
      setGrievances(transformedGrievances);
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  };

  // Add real-time subscription for workflow updates
  useEffect(() => {
    const workflowChannel = supabase
      .channel('workflow_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grievance_workflows'
        },
        () => {
          fetchGrievances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(workflowChannel);
    };
  }, []);

  const formatState = (state: string) => {
    return state.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Track Your Grievances</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View the status and progress of your submitted grievances
          </p>
        </div>

        <div className="border-t border-gray-200">
          {grievances.length === 0 ? (
            <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
              No grievances found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {grievances.map((grievance) => (
                <div key={grievance.id} className="p-4">
                  <div className="mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{grievance.title}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          Category: {grievance.category.name}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedGrievance(
                          selectedGrievance === grievance.id ? null : grievance.id
                        )}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {selectedGrievance === grievance.id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                  </div>

                  {selectedGrievance === grievance.id && grievance.workflow && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-900">Current State</h5>
                        <p className="mt-1 text-sm text-indigo-600">
                          {formatState(grievance.workflow.currentState)}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Progress Timeline</h5>
                        <div className="flow-root">
                          <ul className="-mb-8">
                            {grievance.workflow.history.map((item, index) => (
                              <li key={index}>
                                <div className="relative pb-8">
                                  {index !== grievance.workflow.history.length - 1 && (
                                    <span
                                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                                        <svg
                                          className="h-5 w-5 text-white"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-gray-500">
                                          {formatState(item.state)}
                                          {item.notes && (
                                            <span className="font-medium text-gray-900">
                                              : {item.notes}
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        {new Date(item.timestamp).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 