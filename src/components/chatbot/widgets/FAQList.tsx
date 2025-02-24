import React from 'react';

const faqs = [
  {
    text: 'How do I submit a grievance?',
    handler: 'handleSubmissionGuide',
    id: 1,
  },
  {
    text: 'What happens after I submit?',
    handler: 'handleAfterSubmission',
    id: 2,
  },
  {
    text: 'Can I submit anonymously?',
    handler: 'handleAnonymousInfo',
    id: 3,
  },
  {
    text: 'How can I track my grievance?',
    handler: 'handleTrackingInfo',
    id: 4,
  },
];

type FAQListProps = {
  actionProvider: {
    handleSubmissionGuide: () => void;
    handleAfterSubmission: () => void;
    handleAnonymousInfo: () => void;
    handleTrackingInfo: () => void;
  };
};

const FAQList: React.FC<FAQListProps> = ({ actionProvider }) => {
  return (
    <div className="flex flex-col space-y-2">
      {faqs.map((faq) => (
        <button
          key={faq.id}
          className="text-left px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          onClick={() => actionProvider[faq.handler as keyof typeof actionProvider]()}
        >
          {faq.text}
        </button>
      ))}
    </div>
  );
};

export default FAQList; 