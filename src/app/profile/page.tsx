'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    statusUpdates: true,
    reminders: true,
  });
  const [preferences, setPreferences] = useState({
    language: 'English',
    theme: 'light',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Fetch user preferences
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (prefs) {
          setNotifications(prefs.notifications);
          setPreferences(prefs.preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotifications = async (updates: any) => {
    try {
      const newNotifications = { ...notifications, ...updates };
      setNotifications(newNotifications);

      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            notifications: newNotifications,
            preferences,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
  };

  const updatePreferences = async (updates: any) => {
    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);

      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            notifications,
            preferences: newPreferences,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Please sign in to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and preferences</p>
          </div>
          
          {/* Profile Information */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Account created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notification Preferences */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Manage how you receive notifications</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <button
                  onClick={() => updateNotifications({ email: !notifications.email })}
                  className={`${
                    notifications.email ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <span className={`${
                    notifications.email ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">In-App Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications within the application</p>
                </div>
                <button
                  onClick={() => updateNotifications({ inApp: !notifications.inApp })}
                  className={`${
                    notifications.inApp ? 'bg-indigo-600' : 'bg-gray-200'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <span className={`${
                    notifications.inApp ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                </button>
              </div>
            </div>
          </div>

          {/* Language and Theme Preferences */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
              <p className="mt-1 text-sm text-gray-500">Customize your experience</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreferences({ language: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => updatePreferences({ theme: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 