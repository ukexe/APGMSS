import Sentiment from 'sentiment';
import stringSimilarity from 'string-similarity';
import { Database } from '../types/supabase';
import { supabase } from './supabase';
import { TfIdf } from 'natural/lib/natural/tfidf';
import { NGrams } from 'natural/lib/natural/ngrams';
import { WordTokenizer } from 'natural/lib/natural/tokenizers';
import { JaroWinklerDistance } from 'natural/lib/natural/distance';

type Priority = Database['public']['Enums']['grievance_priority'];

// Initialize NLP tools
const tokenizer = new WordTokenizer();
const tfidf = new TfIdf();

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Category keywords with weighted importance
const categoryKeywords: Record<string, Array<{ word: string, weight: number }>> = {
  'Technical': [
    { word: 'software', weight: 1.5 },
    { word: 'hardware', weight: 1.5 },
    { word: 'system', weight: 1.2 },
    { word: 'network', weight: 1.3 },
    { word: 'error', weight: 1.4 }
  ],
  'Administrative': [
    { word: 'document', weight: 1.4 },
    { word: 'process', weight: 1.3 },
    { word: 'approval', weight: 1.5 },
    { word: 'registration', weight: 1.4 },
    { word: 'deadline', weight: 1.2 }
  ],
  'Academic': [
    { word: 'course', weight: 1.0 },
    { word: 'class', weight: 1.0 },
    { word: 'lecture', weight: 1.0 },
    { word: 'exam', weight: 1.2 },
    { word: 'grade', weight: 1.1 },
    { word: 'assignment', weight: 1.0 },
    { word: 'teacher', weight: 1.0 },
    { word: 'professor', weight: 1.0 },
    { word: 'study', weight: 0.9 },
    { word: 'curriculum', weight: 1.1 },
    { word: 'academic', weight: 1.2 }
  ],
  'Infrastructure': [
    { word: 'building', weight: 1.0 },
    { word: 'facility', weight: 1.0 },
    { word: 'maintenance', weight: 1.1 },
    { word: 'repair', weight: 1.2 },
    { word: 'cleaning', weight: 0.9 },
    { word: 'parking', weight: 0.9 },
    { word: 'room', weight: 0.8 },
    { word: 'hall', weight: 0.8 },
    { word: 'laboratory', weight: 1.1 },
    { word: 'equipment', weight: 1.2 }
  ],
  'General': [
    { word: 'service', weight: 1.0 },
    { word: 'support', weight: 1.0 },
    { word: 'help', weight: 0.9 },
    { word: 'information', weight: 0.8 },
    { word: 'inquiry', weight: 0.9 },
    { word: 'request', weight: 0.9 },
    { word: 'complaint', weight: 1.1 },
    { word: 'feedback', weight: 0.9 },
    { word: 'suggestion', weight: 0.8 }
  ]
};

// Enhanced translation with Google Cloud Translation API
async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      throw new Error('Google Cloud API key not found');
    }

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'Tamil' ? 'ta' : 'en',
          target: targetLang === 'Tamil' ? 'ta' : 'en',
          format: 'text'
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Translation request failed');
    }

    const data = await response.json();
    if (data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    }

    throw new Error('Invalid translation response');
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
}

// Enhanced grievance analysis with NLP
export async function analyzeGrievance(title: string, description: string, language: string) {
  try {
    let processedTitle = title;
    let processedDescription = description;
    
    if (language === 'Tamil') {
      processedTitle = await translateText(title, 'ta', 'en');
      processedDescription = await translateText(description, 'ta', 'en');
    }

    const fullText = `${processedTitle} ${processedDescription}`.toLowerCase();
    
    // Tokenize and analyze text
    const tokens = tokenizer.tokenize(fullText) || [];
    const uniqueTokens = [...new Set(tokens)];
    
    // Perform TF-IDF analysis
    tfidf.addDocument(fullText);
    
    // Enhanced category determination
    const category = await determineCategory(fullText, uniqueTokens);
    
    // Enhanced priority determination
    const priority = await determinePriority(fullText, tokens);
    
    // Find similar grievances and patterns
    const { similarGrievances, patterns } = await findSimilarGrievancesAndPatterns(fullText);
    
    // Generate solution recommendations
    const recommendations = await generateSolutionRecommendations(fullText, category, similarGrievances || []);

    return {
      category,
      priority,
      similarGrievances: similarGrievances || [],
      patterns,
      recommendations,
      isRecurring: (similarGrievances || []).length > 0,
      analysis: {
        sentiment: sentiment.analyze(fullText),
        keyPhrases: extractKeyPhrases(tokens),
        complexity: calculateComplexity(fullText),
      }
    };
  } catch (error) {
    console.error('Error in AI processing:', error);
    return {
      category: 'General',
      priority: 'Medium' as Priority,
      similarGrievances: [],
      patterns: [],
      recommendations: [],
      isRecurring: false,
      analysis: null
    };
  }
}

async function determineCategory(text: string, tokens: string[]): Promise<string> {
  const categoryScores = Object.entries(categoryKeywords).map(([category, keywords]) => {
    const score = keywords.reduce((acc, { word, weight }) => {
      return acc + (text.includes(word) ? weight : 0);
    }, 0);
    return { category, score };
  });

  // Use TF-IDF for additional scoring
  categoryScores.forEach(({ category }) => {
    const categoryTerms = categoryKeywords[category].map(k => k.word);
    const tfidfScore = categoryTerms.reduce((acc, term) => {
      return acc + tfidf.tfidf(term, 0);
    }, 0);
    categoryScores.find(c => c.category === category)!.score += tfidfScore;
  });

  const bestMatch = categoryScores.reduce((best, current) => {
    return current.score > best.score ? current : best;
  });

  return bestMatch.score > 0 ? bestMatch.category : 'General';
}

async function determinePriority(text: string, tokens: string[]): Promise<Priority> {
  const sentimentResult = sentiment.analyze(text);
  
  // Enhanced urgency detection
  const urgencyScore = calculateUrgencyScore(text, tokens);
  
  // Impact assessment
  const impactScore = assessImpact(text, tokens);
  
  // Combined score calculation
  const totalScore = (
    (sentimentResult.score * -0.3) + // Negative sentiment increases priority
    (urgencyScore * 0.4) +
    (impactScore * 0.3)
  );

  if (totalScore > 7) return 'High';
  if (totalScore > 4) return 'Medium';
  return 'Low';
}

async function findSimilarGrievancesAndPatterns(text: string) {
  try {
    const { data: recentGrievances } = await supabase
      .from('grievances')
      .select('title, description, category_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!recentGrievances) return { similarGrievances: [], patterns: [] };

    // Find similar grievances
    const similarGrievances = recentGrievances.filter(grievance => {
      const comparison = `${grievance.title} ${grievance.description}`.toLowerCase();
      const similarity = stringSimilarity.compareTwoStrings(text, comparison);
      return similarity > 0.6;
    });

    // Analyze patterns
    const patterns = analyzePatterns(recentGrievances);

    return { similarGrievances, patterns };
  } catch (error) {
    console.error('Error finding similar grievances:', error);
    return { similarGrievances: [], patterns: [] };
  }
}

function analyzePatterns(grievances: any[]) {
  const patterns = {
    timeBasedPatterns: findTimeBasedPatterns(grievances),
    categoryPatterns: findCategoryPatterns(grievances),
    resolutionPatterns: analyzeResolutionPatterns(grievances)
  };
  return patterns;
}

function findTimeBasedPatterns(grievances: any[]) {
  // Analyze submission timing patterns
  const timePatterns = grievances.reduce((acc: any, grievance) => {
    const date = new Date(grievance.created_at);
    const hour = date.getHours();
    const day = date.getDay();

    acc.hourly[hour] = (acc.hourly[hour] || 0) + 1;
    acc.daily[day] = (acc.daily[day] || 0) + 1;

    return acc;
  }, { hourly: {}, daily: {} });

  return timePatterns;
}

function findCategoryPatterns(grievances: any[]) {
  // Analyze category distribution and relationships
  return grievances.reduce((acc: any, grievance) => {
    const category = grievance.category_id;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

function analyzeResolutionPatterns(grievances: any[]) {
  // Analyze resolution times and success rates
  return grievances.reduce((acc: any, grievance) => {
    const status = grievance.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

async function generateSolutionRecommendations(text: string, category: string, similarGrievances: any[]) {
  try {
    const recommendations: string[] = [];
    
    // Use TF-IDF to identify key terms
    const keyTerms = extractKeyPhrases(tokenizer.tokenize(text));
    
    // Generate recommendations based on category
    switch(category) {
      case 'Technical':
        recommendations.push('Check system requirements and compatibility');
        recommendations.push('Clear cache and temporary files');
        recommendations.push('Update software to the latest version');
        break;
      case 'Administrative':
        recommendations.push('Review submission guidelines and requirements');
        recommendations.push('Ensure all required documents are attached');
        recommendations.push('Follow up with the relevant department');
        break;
      case 'Academic':
        recommendations.push('Consult course syllabus and guidelines');
        recommendations.push('Schedule a meeting with the professor/advisor');
        recommendations.push('Review academic policies');
        break;
      case 'Infrastructure':
        recommendations.push('Submit detailed maintenance request');
        recommendations.push('Report to facility management');
        recommendations.push('Document the issue with photos if applicable');
        break;
      default:
        recommendations.push('Submit detailed description of the issue');
        recommendations.push('Contact relevant department for assistance');
        recommendations.push('Keep track of communication and follow-ups');
    }
    
    // Add recommendations from similar cases if available
    if (similarGrievances.length > 0) {
      const resolvedGrievances = similarGrievances.filter(g => g.status === 'Resolved');
      if (resolvedGrievances.length > 0) {
        recommendations.push('Similar cases were resolved successfully - consider following similar steps');
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      'Submit a detailed description of the issue',
      'Follow up with relevant department',
      'Keep track of all communication'
    ];
  }
}

function extractKeyPhrases(tokens: string[] | null): string[] {
  if (!tokens) return [];
  
  const nGrams = NGrams.bigrams(tokens).concat(NGrams.trigrams(tokens));
  const keyPhrases = new Set<string>();
  
  nGrams.forEach(gram => {
    const phrase = gram.join(' ');
    if (phrase.length > 3) { // Filter out very short phrases
      keyPhrases.add(phrase);
    }
  });
  
  return Array.from(keyPhrases).slice(0, 5); // Return top 5 key phrases
}

function calculateComplexity(text: string) {
  // Calculate text complexity metrics
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;
  
  return {
    words,
    sentences,
    avgWordsPerSentence,
    complexity: avgWordsPerSentence > 20 ? 'High' : avgWordsPerSentence > 10 ? 'Medium' : 'Low'
  };
}

function calculateUrgencyScore(text: string, tokens: string[]) {
  const urgentKeywords = [
    { word: 'urgent', weight: 2.0 },
    { word: 'emergency', weight: 2.0 },
    { word: 'immediate', weight: 1.8 },
    { word: 'critical', weight: 1.7 },
    { word: 'asap', weight: 1.5 },
    { word: 'deadline', weight: 1.3 }
  ];

  return urgentKeywords.reduce((score, { word, weight }) => {
    return score + (tokens.includes(word) ? weight : 0);
  }, 0);
}

function assessImpact(text: string, tokens: string[]) {
  const impactKeywords = [
    { word: 'all', weight: 1.5 },
    { word: 'everyone', weight: 1.5 },
    { word: 'system', weight: 1.3 },
    { word: 'safety', weight: 1.8 },
    { word: 'security', weight: 1.8 },
    { word: 'health', weight: 1.8 }
  ];

  return impactKeywords.reduce((score, { word, weight }) => {
    return score + (tokens.includes(word) ? weight : 0);
  }, 0);
} 