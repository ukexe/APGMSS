'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const NavigationMenu: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, userRole, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const renderAuthLinks = () => {
    if (!isAuthenticated) {
      return (
        <Link
          href="/login"
          className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          Login
        </Link>
      );
    }

    const links = [
      { href: '/', text: 'Submit Grievance' },
      { href: '/track', text: 'Track Grievances' },
      { href: '/notifications', text: 'Notifications' },
      { href: '/profile', text: 'Profile' },
    ];

    if (userRole === 'admin') {
      links.push({ href: '/admin', text: 'Admin Dashboard' });
    }

    if (process.env.NODE_ENV === 'development') {
      links.push({ href: '/test', text: 'System Tests' });
    }

    return (
      <>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            {link.text}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          Logout
        </button>
      </>
    );
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Grievance Management System
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {renderAuthLinks()}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {renderAuthLinks()}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationMenu; 