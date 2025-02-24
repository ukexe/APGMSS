'use client';

import React from 'react';

const steps = [
  {
    text: 'Fill in the title of your grievance',
    example: 'Example: "Delay in Document Processing"',
  },
  {
    text: 'Provide a detailed description',
    example: 'Example: "I submitted my documents on [date] but haven\'t received any update..."',
  },
  {
    text: 'Select the appropriate category',
    example: 'Choose from: Technical, Administrative, Academic, etc.',
  },
  {
    text: 'Choose your preferred language',
    example: 'English or Tamil',
  },
  {
    text: 'Decide if you want to submit anonymously',
    example: 'Check the anonymous submission box if you prefer not to share your identity',
  },
];

type GrievanceGuideProps = {
  setState: (state: any) => void;
  state: {
    currentStep: number;
  };
};

const GrievanceGuide: React.FC<GrievanceGuideProps> = ({ setState, state }) => {
  const handleNext = () => {
    if (state.currentStep < steps.length - 1) {
      setState((prev: any) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const handlePrevious = () => {
    if (state.currentStep > 0) {
      setState((prev: any) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const currentStep = steps[state.currentStep];

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="mb-4">
        <h4 className="font-medium text-gray-900">Step {state.currentStep + 1}</h4>
        <p className="text-gray-700 mt-1">{currentStep.text}</p>
        <p className="text-gray-500 text-sm mt-2 italic">{currentStep.example}</p>
      </div>
      
      <div className="flex justify-between mt-4">
        <button
          onClick={handlePrevious}
          disabled={state.currentStep === 0}
          className={`px-3 py-1 rounded ${
            state.currentStep === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={state.currentStep === steps.length - 1}
          className={`px-3 py-1 rounded ${
            state.currentStep === steps.length - 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default GrievanceGuide; 