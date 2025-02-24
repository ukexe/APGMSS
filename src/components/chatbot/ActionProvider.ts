'use client';

import { analyzeGrievance } from '../../lib/ai-processing';
import { supabase } from '../../lib/supabase';

class ActionProvider {
  createChatBotMessage: any;
  setState: any;
  createClientMessage: any;

  constructor(createChatBotMessage: any, setState: any, createClientMessage: any) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setState;
    this.createClientMessage = createClientMessage;
  }

  handleSubmissionGuide = () => {
    const messages = [
      this.createChatBotMessage(
        "I'll guide you through the grievance submission process.",
        {
          widget: 'grievanceGuide',
        }
      ),
    ];

    this.updateChatbotState(messages);
  };

  handleAfterSubmission = () => {
    const messages = [
      this.createChatBotMessage(
        "After you submit a grievance:",
        { delay: 500 }
      ),
      this.createChatBotMessage(
        "1. Our AI system analyzes your grievance",
        { delay: 1000 }
      ),
      this.createChatBotMessage(
        "2. It's categorized and prioritized automatically",
        { delay: 1500 }
      ),
      this.createChatBotMessage(
        "3. Similar cases are checked for faster resolution",
        { delay: 2000 }
      ),
      this.createChatBotMessage(
        "4. You'll receive real-time updates via email and notifications",
        { delay: 2500 }
      ),
      this.createChatBotMessage(
        "5. All updates are recorded on blockchain for transparency",
        { delay: 3000 }
      ),
    ];

    this.updateChatbotState(messages);
  };

  handleAnonymousInfo = () => {
    const messages = [
      this.createChatBotMessage(
        "Yes, you can submit grievances anonymously.",
        { delay: 500 }
      ),
      this.createChatBotMessage(
        "Simply check the 'Submit Anonymously' box when filing your grievance.",
        { delay: 1000 }
      ),
      this.createChatBotMessage(
        "Note: While anonymous submissions are fully supported:",
        { delay: 1500 }
      ),
      this.createChatBotMessage(
        "- You won't receive email notifications",
        { delay: 2000 }
      ),
      this.createChatBotMessage(
        "- You'll need to manually check the status",
        { delay: 2500 }
      ),
      this.createChatBotMessage(
        "- The grievance is still recorded on blockchain",
        { delay: 3000 }
      ),
    ];

    this.updateChatbotState(messages);
  };

  handleTrackingInfo = () => {
    const messages = [
      this.createChatBotMessage(
        "To track your grievance:",
        { delay: 500 }
      ),
      this.createChatBotMessage(
        "1. Click on 'Track Grievances' in the navigation",
        { delay: 1000 }
      ),
      this.createChatBotMessage(
        "2. View all your submitted grievances",
        { delay: 1500 }
      ),
      this.createChatBotMessage(
        "3. Each grievance shows:",
        { delay: 2000 }
      ),
      this.createChatBotMessage(
        "   - Current status and progress",
        { delay: 2500 }
      ),
      this.createChatBotMessage(
        "   - Blockchain verification status",
        { delay: 3000 }
      ),
      this.createChatBotMessage(
        "   - Complete history of updates",
        { delay: 3500 }
      ),
    ];

    this.updateChatbotState(messages);
  };

  handleQuickSolution = async (text: string) => {
    try {
      // Analyze the query for quick solutions
      const analysis = await analyzeGrievance(
        'Quick Query',
        text,
        'English'
      );

      const messages = [
        this.createChatBotMessage(
          "I'll try to help you with a quick solution.",
          { delay: 500 }
        ),
      ];

      if (analysis.recommendations.length > 0) {
        messages.push(
          this.createChatBotMessage(
            "Based on your query, here are some suggestions:",
            { delay: 1000 }
          )
        );

        analysis.recommendations.forEach((recommendation, index) => {
          messages.push(
            this.createChatBotMessage(recommendation, { delay: 1500 + (index * 500) })
          );
        });
      }

      // Check for similar resolved grievances
      if (analysis.similarGrievances.length > 0) {
        messages.push(
          this.createChatBotMessage(
            "I found some similar cases that were resolved successfully:",
            { delay: 3000 }
          )
        );

        analysis.similarGrievances
          .filter(g => g.status === 'Resolved')
          .slice(0, 3)
          .forEach((grievance, index) => {
            messages.push(
              this.createChatBotMessage(
                `Similar case: ${grievance.title}`,
                { delay: 3500 + (index * 500) }
              )
            );
          });
      }

      messages.push(
        this.createChatBotMessage(
          "Would you like to submit a formal grievance for this issue?",
          {
            delay: 4000,
            widget: 'options',
          }
        )
      );

      this.updateChatbotState(messages);
    } catch (error) {
      this.handleDefault();
    }
  };

  handleLanguageSupport = () => {
    const messages = [
      this.createChatBotMessage(
        "We support both English and Tamil languages.",
        { delay: 500 }
      ),
      this.createChatBotMessage(
        "You can:",
        { delay: 1000 }
      ),
      this.createChatBotMessage(
        "1. Select your preferred language when submitting",
        { delay: 1500 }
      ),
      this.createChatBotMessage(
        "2. Upload documents in either language",
        { delay: 2000 }
      ),
      this.createChatBotMessage(
        "3. Receive notifications in your chosen language",
        { delay: 2500 }
      ),
    ];

    this.updateChatbotState(messages);
  };

  handleDefault = () => {
    const messages = [
      this.createChatBotMessage(
        "I'm here to help! Would you like assistance with any of these topics?",
        {
          widget: 'options',
        }
      ),
    ];

    this.updateChatbotState(messages);
  };

  updateChatbotState(messages: any[]) {
    this.setState((prevState: any) => ({
      ...prevState,
      messages: [...prevState.messages, ...messages],
    }));
  }
}

export default ActionProvider; 
