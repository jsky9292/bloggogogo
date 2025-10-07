
export interface KeywordData {
  id: number;
  keyword: string;
}

export interface BlogPostData {
  id: number;
  title: string;
  url: string;
}

export interface BlogTopic {
  title: string;
  description: string;
}

export interface SeoStrategy {
  expandedKeywords: string[];
  blogTopics: BlogTopic[];
}

export interface GeneratedTopic {
  id: number;
  title: string;
  thumbnailCopy: string;
  strategy: string;
}

export interface RecommendedKeyword {
  id: number;
  keyword: string;
  reason: string;
  title: string;
  thumbnailCopy: string;
  strategy: string;
}

export interface KeywordMetrics {
  keyword: string;
  opportunityScore: number;
  searchVolumeEstimate: number; // Label: 검색 관심도 지수
  competitionScore: number;     // Label: 경쟁 난이도 지수
  competitionLevel: string;
  documentCount: number;
  analysis: {
    title: string;
    reason: string;
    opportunity: string;
    threat: string;
    consumptionAndIssues: string;
    conclusion: string;
  };
  keywordLength: number;
  wordCount: number;
  strategy?: SeoStrategy;
}

export interface BlogStrategySuggestion {
  id: number;
  title: string;
  thumbnailCopy: string;
  strategy: string;
}

export interface BlogStrategyAnalysis {
  structure: string;
  characteristics: string;
  commonKeywords: string;
}

export interface BlogStrategyReportData {
  analysis: BlogStrategyAnalysis;
  suggestions: BlogStrategySuggestion[];
}

export interface SustainableTopicSuggestion {
  title: string;
  keywords: string[];
  strategy: string;
}

export interface SustainableTopicCategory {
  category: string;
  suggestions: SustainableTopicSuggestion[];
}

export interface PaaItem {
  question: string;
  answer: string;
  content_gap_analysis: string;
}

export interface GoogleSerpData {
  related_searches: string[];
  people_also_ask: PaaItem[];
}

export interface SerpStrategySuggestion {
  id: number;
  title: string;
  thumbnailCopy: string;
  strategy: string;
}

export interface SerpStrategyReportData {
  analysis: {
    userIntent: string;
    pillarPostSuggestion: string;
  };
  suggestions: SerpStrategySuggestion[];
}

export interface WeatherData {
  temperature: string;
  condition: string;
  wind: string;
  humidity: string;
}

export interface NaverKeywordData {
  연관키워드: string;
  모바일검색량: number;
  PC검색량: number;
  총검색량: number;
  경쟁강도: string;
  총문서수?: number;
  경쟁률?: number;
}

export type SearchSource = 'google' | 'naver';

export type Feature = 'keywords' | 'blogs' | 'competition' | 'sustainable-topics' | 'related-keywords' | 'naver-keyword-analysis';