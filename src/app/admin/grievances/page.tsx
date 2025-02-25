'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Grievance = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  category: {
    name: string;
  };
};

export default function AdminGrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrievances();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-grievances')
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
      const { data, error } = await supabase
        .from('grievances')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGrievances(data || []);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Grievances</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage and track all grievances in the system
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
                <Link
                  key={grievance.id}
                  href={`/admin/grievance/${grievance.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-indigo-600">
                          {grievance.title}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          Category: {grievance.category.name}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex space-x-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(
                            grievance.priority
                          )}`}
                        >
                          {grievance.priority}
                        </span>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            grievance.status
                          )}`}
                        >
                          {grievance.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <time dateTime={grievance.created_at}>
                            {new Date(grievance.created_at).toLocaleString()}
                          </time>
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <span className="text-indigo-600 hover:text-indigo-900">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 