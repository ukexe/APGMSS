'use client';

import React from 'react';

type LanguageSelectorProps = {
  selectedLanguage: string;
  setState: (state: any) => void;
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, setState }) => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'Tamil' },
  ];

  const handleLanguageChange = (language: string) => {
    setState((prevState: any) => ({
      ...prevState,
      selectedLanguage: language,
    }));
  };

  return (
    <div className="flex flex-col space-y-2">
      <p className="text-sm text-gray-600 mb-2">Select your preferred language:</p>
      <div className="flex space-x-2">
        {languages.map(({ code, name }) => (
          <button
            key={code}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedLanguage === name
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => handleLanguageChange(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector; 