'use client';

import React from 'react';

type QuickSolutionsProps = {
  solutions: string[];
  actionProvider: {
    handleSubmissionGuide: () => void;
  };
};

const QuickSolutions: React.FC<QuickSolutionsProps> = ({ solutions, actionProvider }) => {
  if (!solutions || solutions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col space-y-2">
      {solutions.map((solution, index) => (
        <div
          key={index}
          className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700"
        >
          {solution}
        </div>
      ))}
      <button
        className="mt-4 text-left px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors text-indigo-700"
        onClick={() => actionProvider.handleSubmissionGuide()}
      >
        Submit a New Grievance
      </button>
    </div>
  );
};

export default QuickSolutions; 