'use client';

class MessageParser {
  actionProvider: any;
  state: any;

  constructor(actionProvider: any, state: any) {
    this.actionProvider = actionProvider;
    this.state = state;
  }

  parse(message: string) {
    const lowerCase = message.toLowerCase();

    if (this.containsWord(lowerCase, ['how', 'submit', 'file', 'create'])) {
      return this.actionProvider.handleSubmissionGuide();
    }

    if (this.containsWord(lowerCase, ['after', 'what happens', 'next', 'then'])) {
      return this.actionProvider.handleAfterSubmission();
    }

    if (this.containsWord(lowerCase, ['anonymous', 'anonymously', 'identity', 'private'])) {
      return this.actionProvider.handleAnonymousInfo();
    }

    if (this.containsWord(lowerCase, ['track', 'status', 'where', 'progress'])) {
      return this.actionProvider.handleTrackingInfo();
    }

    // Default response for unrecognized input
    return this.actionProvider.handleDefault();
  }

  containsWord(message: string, words: string[]) {
    return words.some(word => message.includes(word));
  }
}

export default MessageParser; 
