'use client';

import React from 'react';
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

type RecentGrievancesProps = {
  grievances: Grievance[];
};

export default function RecentGrievances({ grievances }: RecentGrievancesProps) {
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

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Grievances</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Latest grievances submitted to the system
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {grievances.map((grievance) => (
            <Link
              key={grievance.id}
              href={`/admin/grievance/${grievance.id}`}
              className="block hover:bg-gray-50"
            >
              <li className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {grievance.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
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
                        {new Date(grievance.created_at).toLocaleDateString()}
                      </time>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <span className="text-indigo-600 hover:text-indigo-900">
                      Manage →
                    </span>
                  </div>
                </div>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
} 