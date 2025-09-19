
import { useState, useCallback } from 'react';
import type { KeywordData, SearchSource, Feature, BlogPostData, KeywordMetrics, GoogleSerpData } from '../types';
import { generateRelatedKeywords, fetchRelatedKeywords, fetchNaverBlogPosts, analyzeKeywordCompetition } from '../services/keywordService';

export const useSearch = () => {
  const [results, setResults] = useState<(KeywordData | BlogPostData | KeywordMetrics | GoogleSerpData)[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const search = useCallback(async (keyword: string, feature: Feature, source: SearchSource) => {
    if (!keyword.trim()) {
      setError('검색할 키워드를 입력해주세요.');
      return;
    }
    setInitialLoad(false);
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      let data;
      if (feature === 'keywords') {
        data = await fetchRelatedKeywords(keyword, source);
      } else if (feature === 'blogs') {
        data = await fetchNaverBlogPosts(keyword);
      } else if (feature === 'related-keywords') {
        const serpData = await generateRelatedKeywords(keyword);
        data = [serpData];
      } else { // feature === 'competition'
        const competitionData = await analyzeKeywordCompetition(keyword);
        data = [competitionData];
      }
      setResults(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search, initialLoad, setResults, setError, setInitialLoad, setLoading };
};
