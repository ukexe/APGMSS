'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getWorkflowHistory, updateWorkflowState, getWorkflowTemplate } from '@/lib/workflow';
import { sendNotification } from '@/lib/notification-service';
import type { WorkflowState } from '@/types/supabase';

type GrievanceDetails = {
  id: string;
  title: string;
  description: string;
  category: { id: number; name: string };
  status: string;
  priority: string;
  created_at: string;
  user_id: string | null;
};

type WorkflowHistoryItem = {
  state: WorkflowState;
  timestamp: string;
  notes: string;
  assignedTo?: string;
};

export default function AdminGrievancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [grievance, setGrievance] = useState<GrievanceDetails | null>(null);
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>([]);
  const [currentState, setCurrentState] = useState<WorkflowState | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistoryItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGrievanceDetails();
    fetchAdmins();

    // Set up real-time subscription
    const channel = supabase
      .channel('grievance-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grievance_workflows',
          filter: `grievance_id=eq.${params.id}`
        },
        () => {
          fetchGrievanceDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const fetchGrievanceDetails = async () => {
    try {
      // Fetch grievance details with category and workflow in a single query
      const { data: grievanceData, error: grievanceError } = await supabase
        .from('grievances')
        .select(`
          *,
          category:categories!inner(*),
          workflow:grievance_workflows!left(
            id,
            current_state,
            state_history,
            assigned_to
          )
        `)
        .eq('id', params.id)
        .single();

      if (grievanceError) {
        console.error('Error fetching grievance:', grievanceError);
        setError('Failed to load grievance details');
        return;
      }

      if (!grievanceData) {
        setError('Grievance not found');
        return;
      }

      setGrievance(grievanceData);

      // Fetch workflow template for the category
      const workflowStates = await getWorkflowTemplate(grievanceData.category.id);
      setWorkflowStates(workflowStates);

      // Get current state and history from workflow data
      if (grievanceData.workflow?.[0]) {
        const workflow = grievanceData.workflow[0];
        setCurrentState(workflow.current_state);
        setWorkflowHistory(workflow.state_history ? JSON.parse(workflow.state_history) : []);
        if (workflow.assigned_to) {
          setSelectedAdmin(workflow.assigned_to);
        }
      } else {
        // Initialize new workflow if none exists
        setCurrentState(workflowStates[0]);
        setWorkflowHistory([]);
      }

      console.log('Grievance data loaded:', grievanceData); // Debug log
    } catch (error) {
      console.error('Error fetching details:', error);
      setError('Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'admin');

      if (error) throw error;
      setAdmins(data || []);
      // Auto-select the first admin if none is selected
      if (data && data.length > 0 && !selectedAdmin) {
        setSelectedAdmin(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleStateUpdate = async (newState: WorkflowState) => {
    try {
      setUpdating(true);
      setError(null);

      if (!selectedAdmin) {
        setError('Please select an admin to assign this task to');
        return;
      }

      if (!notes.trim()) {
        setError('Please add notes about this state change');
        return;
      }

      // Update workflow state
      await updateWorkflowState(params.id, newState, notes, selectedAdmin);
      
      // Send notification to the grievance owner
      if (grievance?.user_id) {
        await sendNotification(
          grievance.user_id,
          'status_update',
          `Your grievance "${grievance.title}" has been updated to ${formatState(newState)}`,
          params.id,
          'status_update'
        );
      }

      // Send notification to the assigned admin
      await sendNotification(
        selectedAdmin,
        'assignment',
        `You have been assigned to handle the state "${formatState(newState)}" for grievance "${grievance?.title}"`,
        params.id,
        'assignment'
      );

      // Refresh data
      await fetchGrievanceDetails();
      setNotes('');
    } catch (error) {
      console.error('Error updating state:', error);
      setError('Failed to update workflow state');
    } finally {
      setUpdating(false);
    }
  };

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

  if (!grievance) {
    return <div>Grievance not found</div>;
  }

  const currentStateIndex = workflowStates.indexOf(currentState || workflowStates[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-900 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Grievances
        </button>
        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            grievance.priority === 'High' ? 'bg-red-100 text-red-800' :
            grievance.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {grievance.priority} Priority
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            grievance.status === 'Resolved' ? 'bg-green-100 text-green-800' :
            grievance.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {grievance.status}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {grievance.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Category: <span className="font-medium text-gray-900">{grievance.category.name}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Submitted: <span className="font-medium text-gray-900">{new Date(grievance.created_at).toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="prose max-w-none text-gray-700">
              {grievance.description}
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Column - Workflow States */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Workflow Progress</h4>
              <div className="space-y-4">
                {workflowStates.map((state, index) => {
                  const isCompleted = workflowHistory.some(h => h.state === state);
                  const isCurrent = currentState === state;
                  const isNext = index === currentStateIndex + 1;
                  
                  return (
                    <div
                      key={state}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        isCurrent ? 'bg-indigo-50 border border-indigo-200' : 
                        isCompleted ? 'bg-green-50' : 'bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => isNext && handleStateUpdate(state)}
                        className={`h-5 w-5 ${
                          isNext
                            ? 'text-indigo-600 focus:ring-indigo-500 cursor-pointer'
                            : 'text-gray-400 cursor-not-allowed'
                        } border-gray-300 rounded`}
                        disabled={!isNext || updating}
                      />
                      <span className={`flex-1 ${isCurrent ? 'font-bold text-indigo-600' : isCompleted ? 'text-green-700' : ''}`}>
                        {formatState(state)}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* State Update Form */}
              <div className="mt-6 space-y-4 bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-medium text-gray-900">Update State</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assigned Admin
                  </label>
                  <select
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    disabled={updating || admins.length <= 1}
                  >
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this state change..."
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={updating}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - History */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Workflow History</h4>
              <div className="flow-root">
                <ul className="-mb-8">
                  {workflowHistory.map((item, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== workflowHistory.length - 1 && (
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
                          <div className="min-w-0 flex-1 bg-white p-4 rounded-lg shadow-sm">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatState(item.state)}
                              </p>
                              {item.notes && (
                                <p className="mt-1 text-sm text-gray-700">
                                  {item.notes}
                                </p>
                              )}
                              {item.assignedTo && (
                                <p className="mt-2 text-xs text-gray-500">
                                  Assigned to: {admins.find(a => a.id === item.assignedTo)?.email}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleString()}
                              </p>
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
        </div>
      </div>
    </div>
  );
} 