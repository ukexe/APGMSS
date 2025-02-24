import { createChatBotMessage } from 'react-chatbot-kit';
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import widgets to avoid SSR issues
const GrievanceGuide = dynamic(() => import('./widgets/GrievanceGuide'));
const FAQList = dynamic(() => import('./widgets/FAQList'));
const QuickSolutions = dynamic(() => import('./widgets/QuickSolutions'));
const LanguageSelector = dynamic(() => import('./widgets/LanguageSelector'));
const BotHeader = dynamic(() => import('./widgets/BotHeader'));

const botName = 'GrievanceBot';

interface ChatbotWidget {
  widgetName: string;
  widgetFunc: (props: any) => JSX.Element;
  mapStateToProps: string[];
}

interface ChatbotConfig {
  initialMessages: any[];
  botName: string;
  customStyles: {
    botMessageBox: {
      backgroundColor: string;
    };
    chatButton: {
      backgroundColor: string;
    };
  };
  widgets: ChatbotWidget[];
  customComponents: {
    header: () => JSX.Element;
  };
  state: {
    currentStep: number;
    solutions: string[];
    selectedLanguage: string;
  };
}

const config: ChatbotConfig = {
  initialMessages: [
    createChatBotMessage(`Hi! I'm ${botName}, your grievance assistant.`, {}),
    createChatBotMessage(
      'How can I help you today?',
      {
        widget: 'options',
      }
    ),
  ],
  botName: botName,
  customStyles: {
    botMessageBox: {
      backgroundColor: '#4F46E5',
    },
    chatButton: {
      backgroundColor: '#4F46E5',
    },
  },
  widgets: [
    {
      widgetName: 'options',
      widgetFunc: (props: any) => <FAQList {...props} />,
      mapStateToProps: ['messages'],
    },
    {
      widgetName: 'grievanceGuide',
      widgetFunc: (props: any) => <GrievanceGuide {...props} />,
      mapStateToProps: ['messages', 'currentStep'],
    },
    {
      widgetName: 'quickSolutions',
      widgetFunc: (props: any) => <QuickSolutions {...props} />,
      mapStateToProps: ['messages', 'solutions'],
    },
    {
      widgetName: 'languageSelector',
      widgetFunc: (props: any) => <LanguageSelector {...props} />,
      mapStateToProps: ['messages', 'selectedLanguage'],
    },
  ],
  customComponents: {
    header: () => <BotHeader />,
  },
  state: {
    currentStep: 0,
    solutions: [],
    selectedLanguage: 'English',
  },
};

export default config; 