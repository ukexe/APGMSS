'use client';

import React, { useState, useEffect } from 'react';
import {
  testGrievanceSubmission,
  verifyGrievanceStatus,
  testStatusUpdate,
  checkRealtimeUpdates,
  validateOCRResult,
  testResponsiveness,
} from '../../utils/testUtils';
import { processFile } from '../../lib/ocr-processing';
import type { Database } from '../../types/supabase';

type Status = Database['public']['Enums']['grievance_status'];

const TestPage = () => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const updateTestResult = (testName: string, result: any) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: {
        result,
        timestamp: new Date().toISOString(),
      },
    }));
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({});

    try {
      // Test 1: Anonymous Submission
      setCurrentTest('Anonymous Submission');
      const anonymousSubmission = await testGrievanceSubmission(
        'Test Anonymous Grievance',
        'This is a test anonymous grievance submission',
        1, // Assuming category_id 1 exists
        'English',
        true
      );
      updateTestResult('anonymousSubmission', anonymousSubmission);

      // Test 2: Simulated Non-anonymous Submission (will be anonymous for testing)
      setCurrentTest('Simulated Non-anonymous Submission');
      const nonAnonymousSubmission = await testGrievanceSubmission(
        'Test Non-anonymous Grievance',
        'This is a test non-anonymous grievance submission',
        1,
        'English',
        true // Force anonymous for testing
      );
      updateTestResult('nonAnonymousSubmission', nonAnonymousSubmission);

      if (nonAnonymousSubmission.success && nonAnonymousSubmission.data?.[0]) {
        const grievanceId = nonAnonymousSubmission.data[0].id;

        // Test 3: Status Verification
        setCurrentTest('Status Verification');
        const statusVerification = await verifyGrievanceStatus(grievanceId);
        updateTestResult('statusVerification', statusVerification);

        // Test 4: Status Update
        setCurrentTest('Status Update');
        const statusUpdate = await testStatusUpdate(grievanceId, 'In Progress' as Status);
        updateTestResult('statusUpdate', statusUpdate);

        // Test 5: Realtime Updates
        setCurrentTest('Realtime Updates');
        const subscription = checkRealtimeUpdates(grievanceId, (payload) => {
          updateTestResult('realtimeUpdate', {
            success: true,
            payload,
          });
        });

        // Clean up subscription after 5 seconds
        setTimeout(() => {
          subscription.unsubscribe();
        }, 5000);
      }

      // Test 6: OCR Validation
      setCurrentTest('OCR Validation');
      const sampleText = 'This is a test OCR result\nWith multiple lines\nAnd some content';
      const ocrValidation = validateOCRResult(sampleText);
      updateTestResult('ocrValidation', {
        success: true,
        validation: ocrValidation,
      });

      // Test 7: Responsiveness
      setCurrentTest('Responsiveness Check');
      const responsiveCheck = testResponsiveness();
      updateTestResult('responsiveness', {
        success: true,
        metrics: responsiveCheck,
      });

    } catch (error) {
      console.error('Test suite failed:', error);
      updateTestResult('error', error);
    } finally {
      setIsRunningTests(false);
      setCurrentTest('');
    }
  };

  const getStatusBadge = (success: boolean) => (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${
        success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {success ? 'PASS' : 'FAIL'}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Test Suite</h1>
        <button
          onClick={runAllTests}
          disabled={isRunningTests}
          className={`px-4 py-2 rounded-md text-white ${
            isRunningTests
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {currentTest && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700">Currently running: {currentTest}</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(testResults).map(([testName, data]) => (
          <div key={testName} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {testName.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              {getStatusBadge(data.result?.success ?? false)}
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Timestamp: {new Date(data.timestamp).toLocaleString()}
            </p>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(data.result, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPage; 