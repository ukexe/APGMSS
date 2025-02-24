import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import ChatbotWidget from '../components/chatbot/ChatbotWidget';
import { AuthProvider } from '../contexts/AuthContext';
import NavigationMenu from '../components/NavigationMenu';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI-Powered Grievance Management System',
  description: 'An intelligent system for managing and tracking grievances with AI-powered solutions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            <NavigationMenu />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <ChatbotWidget />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 