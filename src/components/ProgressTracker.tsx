'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { GrievanceResponse, CategoryResponse } from '../types/api';

type Status = Database['public']['Enums']['grievance_status'];
type Grievance = GrievanceResponse & {
  category: CategoryResponse;
};

export default function ProgressTracker() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrievances();
    const subscription = setupRealtimeSubscription();

    return () => {
      subscription.unsubscribe();
    };
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
        setGrievances(data as Grievance[]);
      }
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('grievances_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grievances',
        },
        async (payload) => {
          // Fetch the updated grievance with category information
          if (payload.new) {
            const { data } = await supabase
              .from('grievances')
              .select(`
                *,
                category:categories(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setGrievances(current => {
                const index = current.findIndex(g => g.id === data.id);
                if (index >= 0) {
                  const newGrievances = [...current];
                  newGrievances[index] = data as Grievance;
                  return newGrievances;
                }
                return [data as Grievance, ...current];
              });
            }
          }
        }
      )
      .subscribe();

    return subscription;
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

  const getProgressPercentage = (status: Status) => {
    switch (status) {
      case 'Pending':
        return 33;
      case 'In Progress':
        return 66;
      case 'Resolved':
        return 100;
      default:
        return 0;
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
          {grievances.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No grievances found
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {grievances.map((grievance) => (
                <li key={grievance.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{grievance.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{grievance.description}</p>
                    </div>
                    <div className="ml-6 flex-shrink-0">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(grievance.status)}`}>
                        {grievance.status}
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {getProgressPercentage(grievance.status)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                      <div
                        style={{ width: `${getProgressPercentage(grievance.status)}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 sm:flex sm:justify-between">
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
                      <p>
                        Submitted: {new Date(grievance.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 