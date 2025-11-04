
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

// 블로그 랭킹 추적
export type SearchArea = 'smartblock' | 'blog' | 'blog_tab';

export interface RankingCheckResult {
  found: boolean;
  rank: number | null;
  area: SearchArea;
  areaName: string; // '통합검색-스마트블록', '통합검색-블로그', '블로그탭'
  title?: string;
  snippet?: string;
  checkedAt: Date;
}

export interface AllRankingResults {
  smartblock: RankingCheckResult;  // 통합검색 - 스마트블록 (구 VIEW)
  mainBlog: RankingCheckResult;    // 통합검색 - 블로그 영역
  blogTab: RankingCheckResult;     // 블로그 탭
}

export interface RankingHistory {
  date: string; // YYYY-MM-DD
  smartblockRank: number | null;  // 통합검색 스마트블록 순위
  mainBlogRank: number | null;    // 통합검색 블로그 영역 순위
  blogTabRank: number | null;     // 블로그 탭 순위
  checkedAt: Date;
}

export interface BlogRankingTracker {
  id?: string;
  userId: string;
  blogUrl: string;
  blogTitle?: string;
  targetKeyword: string;
  // 현재 순위
  currentSmartblockRank: number | null;
  currentMainBlogRank: number | null;
  currentBlogTabRank: number | null;
  // 이전 순위
  previousSmartblockRank: number | null;
  previousMainBlogRank: number | null;
  previousBlogTabRank: number | null;
  rankHistory: RankingHistory[];
  createdAt: Date;
  lastChecked: Date | null;
  isActive: boolean;
}