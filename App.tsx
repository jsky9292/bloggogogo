import React, { useState, useEffect } from 'react';
import { useSearch } from './hooks/useKeywordSearch';
import KeywordInputForm from './components/KeywordInputForm';
import ResultsTable from './components/ResultsTable';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SearchEngineSelector from './components/SearchEngineSelector';
import FeatureSelector from './components/FeatureSelector';
import BlogResultsTable from './components/BlogResultsTable';
import CompetitionAnalysisResults from './components/CompetitionAnalysisResults';
import PromptResultDisplay from './components/PromptResultDisplay';
import BlogTopicSuggestions from './components/BlogTopicSuggestions';
import BlogStrategyReport from './components/BlogStrategyReport';
import RealtimeKeywordsSidebar from './components/RealtimeKeywordsSidebar';
import RecommendedKeywordsDisplay from './components/RecommendedKeywordsDisplay';
import SustainableTopicsResults from './components/SustainableTopicsResults';
import HelpModal from './components/HelpModal';
import PeopleAlsoAsk from './components/PeopleAlsoAsk';
import SerpStrategyReport from './components/SerpStrategyReport';
import CurrentStatus from './components/CurrentStatus';
import ApiKeySettings from './components/ApiKeySettings';
import ApiKeyStatus from './components/ApiKeyStatus';
import BlogPostDisplay from './components/BlogPostDisplay';
import ModeToggle from './components/ModeToggle';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import { generateTopicsFromMainKeyword, generateTopicsFromAllKeywords, generateBlogStrategy, fetchRecommendedKeywords, generateSustainableTopics, generateSerpStrategy, executePromptAsCompetitionAnalysis, generateBlogPost } from './services/keywordService';
import type { SearchSource, Feature, KeywordData, BlogPostData, KeywordMetrics, GeneratedTopic, BlogStrategyReportData, RecommendedKeyword, SustainableTopicCategory, GoogleSerpData, SerpStrategyReportData, PaaItem } from './types';
import { config } from './src/config/appConfig';
import { updateAdminAccount } from './src/config/firebase';

const App: React.FC = () => {
    const { results, loading, error, search, initialLoad, setResults, setError, setInitialLoad, setLoading } = useSearch();
    const [source, setSource] = useState<SearchSource>('google');
    const [feature, setFeature] = useState<Feature>('competition');

    const [keyword, setKeyword] = useState<string>('');
    const [mainKeyword, setMainKeyword] = useState<string>('');
    const [blogTopics, setBlogTopics] = useState<GeneratedTopic[] | null>(null);
    const [topicTitle, setTopicTitle] = useState<string>('');
    const [topicLoading, setTopicLoading] = useState<boolean>(false);
    const [topicError, setTopicError] = useState<string | null>(null);

    const [blogStrategy, setBlogStrategy] = useState<BlogStrategyReportData | null>(null);
    const [strategyLoading, setStrategyLoading] = useState<boolean>(false);
    const [strategyError, setStrategyError] = useState<string | null>(null);
    
    const [serpStrategy, setSerpStrategy] = useState<SerpStrategyReportData | null>(null);
    const [serpStrategyLoading, setSerpStrategyLoading] = useState<boolean>(false);
    const [serpStrategyError, setSerpStrategyError] = useState<string | null>(null);

    const [recommendedKeywords, setRecommendedKeywords] = useState<RecommendedKeyword[] | null>(null);
    const [recoLoading, setRecoLoading] = useState<boolean>(false);
    const [recoError, setRecoError] = useState<string | null>(null);

    const [sustainableTopics, setSustainableTopics] = useState<SustainableTopicCategory[] | null>(null);
    const [sustainableTopicsLoading, setSustainableTopicsLoading] = useState<boolean>(false);
    const [sustainableTopicsError, setSustainableTopicsError] = useState<string | null>(null);

    const [promptResult, setPromptResult] = useState<KeywordMetrics | null>(null);
    const [promptResultLoading, setPromptResultLoading] = useState<boolean>(false);
    const [promptResultError, setPromptResultError] = useState<string | null>(null);

    const [blogPost, setBlogPost] = useState<{ title: string; content: string; format: 'html' | 'markdown'; platform: 'naver' | 'google'; schemaMarkup?: string } | null>(null);
    const [blogPostLoading, setBlogPostLoading] = useState<boolean>(false);
    const [blogPostError, setBlogPostError] = useState<string | null>(null);
    
    // PAA용 별도 블로그 포스트 state
    const [paaBlogPost, setPaaBlogPost] = useState<{ title: string; content: string; format: 'html' | 'markdown'; platform: 'naver' | 'google'; schemaMarkup?: string } | null>(null);
    const [paaBlogPostLoading, setPaaBlogPostLoading] = useState<boolean>(false);
    const [paaBlogPostError, setPaaBlogPostError] = useState<string | null>(null);
    
    // SERP용 별도 블로그 포스트 state  
    const [serpBlogPost, setSerpBlogPost] = useState<{ title: string; content: string; format: 'html' | 'markdown'; platform: 'naver' | 'google'; schemaMarkup?: string } | null>(null);
    const [serpBlogPostLoading, setSerpBlogPostLoading] = useState<boolean>(false);
    const [serpBlogPostError, setSerpBlogPostError] = useState<string | null>(null);

    const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
    
    // SaaS 모드 관련 상태
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
    const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    // 대시보드 상태 디버깅용 useEffect
    useEffect(() => {
        console.log('isUserDashboardOpen changed:', isUserDashboardOpen);
    }, [isUserDashboardOpen]);

    useEffect(() => {
        console.log('currentUser changed:', currentUser);
        // 관리자 계정인 경우 자동으로 Enterprise 플랜으로 업데이트
        if (currentUser && currentUser.email === 'admin@keywordinsight.com') {
            updateAdminAccount(currentUser.uid, currentUser.email).then(() => {
                // 업데이트 후 현재 사용자 정보 갱신
                setCurrentUser({
                    ...currentUser,
                    name: '관리자',
                    plan: 'enterprise',
                    role: 'admin'
                });
            });
        }
    }, [currentUser?.email]);

    const handleFeatureSelect = (newFeature: Feature) => {
        if (feature === newFeature) return;

        setResults([]);
        setError(null);
        setInitialLoad(true);
        setKeyword('');
        setMainKeyword('');
        setBlogTopics(null);
        setTopicTitle('');
        setTopicLoading(false);
        setTopicError(null);
        setBlogStrategy(null);
        setStrategyLoading(false);
        setStrategyError(null);
        setSerpStrategy(null);
        setSerpStrategyLoading(false);
        setSerpStrategyError(null);
        setRecommendedKeywords(null);
        setRecoLoading(false);
        setRecoError(null);
        setSustainableTopics(null);
        setSustainableTopicsError(null);
        setSustainableTopicsLoading(false);
        
        setPromptResult(null);
        setPromptResultError(null);
        
        setFeature(newFeature);
    };

    const handleSearch = async (searchKeyword: string) => {
        if (!searchKeyword.trim()) return;

        // Reset all states
        setInitialLoad(false);
        setMainKeyword(searchKeyword);
        setResults([]);
        setError(null);
        setBlogTopics(null);
        setTopicError(null);
        setBlogStrategy(null);
        setStrategyError(null);
        setSerpStrategy(null);
        setSerpStrategyError(null);
        setRecommendedKeywords(null);
        setRecoError(null);
        setSustainableTopics(null);
        setSustainableTopicsError(null);

        setPromptResult(null);
        setPromptResultError(null);

        if (feature === 'sustainable-topics') {
            setSustainableTopicsLoading(true);
            try {
                const data = await generateSustainableTopics(searchKeyword);
                setSustainableTopics(data);
            } catch (err) {
                if (err instanceof Error) {
                    setSustainableTopicsError(err.message);
                } else {
                    setSustainableTopicsError('지속 가능 주제를 생성하는 중 알 수 없는 오류가 발생했습니다.');
                }
            } finally {
                setSustainableTopicsLoading(false);
            }
        } else {
            search(searchKeyword, feature, source);
        }
    };

    const handleKeywordClick = (clickedKeyword: string) => {
        setKeyword(clickedKeyword);
        handleSearch(clickedKeyword);
    };
    
    const isBlogResults = (data: (KeywordData | BlogPostData | KeywordMetrics | GoogleSerpData)[]): data is BlogPostData[] => {
        return data.length > 0 && 'url' in data[0];
    }
    
    const isCompetitionResult = (data: (KeywordData | BlogPostData | KeywordMetrics | GoogleSerpData)[]): data is KeywordMetrics[] => {
        return data.length > 0 && 'analysis' in data[0];
    }

    const isKeywordResults = (data: (KeywordData | BlogPostData | KeywordMetrics | GoogleSerpData)[]): data is KeywordData[] => {
        return data.length > 0 && 'keyword' in data[0] && !('url' in data[0]) && !('analysis' in data[0]);
    }

    const isGoogleSerpResult = (data: (KeywordData | BlogPostData | KeywordMetrics | GoogleSerpData)[]): data is GoogleSerpData[] => {
        return data.length > 0 && 'related_searches' in data[0] && 'people_also_ask' in data[0];
    }

    const handleGenerateTopics = async (type: 'main' | 'all') => {
        setTopicLoading(true);
        setTopicError(null);
        setBlogTopics(null);

        try {
            let topics;
            if (type === 'main') {
                setTopicTitle(`'${mainKeyword}' 키워드 블로그 주제 추천`);
                topics = await generateTopicsFromMainKeyword(mainKeyword);
            } else {
                const relatedKeywords = (results as KeywordData[]).map(r => r.keyword);
                setTopicTitle(`'${mainKeyword}' 및 자동완성 키워드 조합 블로그 주제 추천`);
                topics = await generateTopicsFromAllKeywords(mainKeyword, relatedKeywords);
            }
            setBlogTopics(topics);
        } catch (err) {
            if (err instanceof Error) {
                setTopicError(err.message);
            } else {
                setTopicError('알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setTopicLoading(false);
        }
    };

    const handleGenerateBlogPost = async (topic: GeneratedTopic & { platform: 'naver' | 'google' }) => {
        console.log('handleGenerateBlogPost called with:', topic);
        setBlogPostLoading(true);
        setBlogPostError(null);
        setBlogPost(null);

        try {
            // Better keyword extraction including main keyword
            const keywords = [mainKeyword];
            const titleWords = topic.title.split(' ').filter(word =>
                word.length > 2 && word !== mainKeyword &&
                !['위한', '하는', '대한', '없는', '있는', '되는'].includes(word)
            );
            keywords.push(...titleWords.slice(0, 4));
            
            // If keywords from topic object are available, use them
            const effectiveKeywords = topic.keywords && topic.keywords.length > 0 
                ? topic.keywords 
                : keywords;
            
            // Determine tone based on topic
            let tone: 'friendly' | 'expert' | 'informative' = 'informative';
            if (topic.strategy.includes('친근') || topic.strategy.includes('일상')) {
                tone = 'friendly';
            } else if (topic.strategy.includes('전문') || topic.strategy.includes('분석')) {
                tone = 'expert';
            }

            const post = await generateBlogPost(topic.title, effectiveKeywords, topic.platform, tone);
            setBlogPost({ ...post, platform: topic.platform });
        } catch (err) {
            if (err instanceof Error) {
                setBlogPostError(err.message);
            } else {
                setBlogPostError('블로그 글 작성 중 알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setBlogPostLoading(false);
        }
    };
    
    // CompetitionAnalysisResults와 BlogStrategyReport에서 사용하는 핸들러
    const handleGenerateBlogPostFromStrategy = async (suggestion: {
        title: string;
        thumbnailCopy?: string;
        strategy?: string;
        description?: string;
        platform: 'naver' | 'google'
    }) => {
        console.log('handleGenerateBlogPostFromStrategy called with:', suggestion);
        console.log('Current mainKeyword:', mainKeyword);
        console.log('Current keyword:', keyword);

        setBlogPostLoading(true);
        setBlogPostError(null);
        setBlogPost(null);

        try {
            // mainKeyword가 없으면 keyword 사용
            const searchKeyword = mainKeyword || keyword;

            if (!searchKeyword) {
                throw new Error('키워드를 먼저 입력해주세요.');
            }

            // Better keyword extraction including main keyword
            const keywords = [searchKeyword];
            const titleWords = suggestion.title.split(' ').filter(word =>
                word.length > 2 && word !== searchKeyword &&
                !['위한', '하는', '대한', '없는', '있는', '되는', '모든', '통한'].includes(word)
            );
            keywords.push(...titleWords.slice(0, 4));

            console.log('Generated keywords:', keywords);
            console.log('Platform:', suggestion.platform);

            // Use title as the topic
            const result = await generateBlogPost(
                suggestion.title,
                keywords,
                suggestion.platform,
                'informative'
            );

            if (result) {
                setBlogPost({ ...result, platform: suggestion.platform });
                console.log('Blog post generated successfully');
            } else {
                throw new Error('블로그 글 생성 결과가 없습니다.');
            }
        } catch (err) {
            console.error('Error in handleGenerateBlogPostFromStrategy:', err);
            if (err instanceof Error) {
                setBlogPostError(err.message);
            } else {
                setBlogPostError('블로그 글 생성 중 오류가 발생했습니다.');
            }
        } finally {
            setBlogPostLoading(false);
        }
    };
    
    const handleGenerateBlogPostFromSerp = async (suggestion: { title: string; thumbnailCopy: string; strategy: string; platform: 'naver' | 'google' }) => {
        console.log('handleGenerateBlogPostFromSerp called with:', suggestion);
        setSerpBlogPostLoading(true);
        setSerpBlogPostError(null);
        setSerpBlogPost(null);

        try {
            // Better keyword extraction including main keyword
            const keywords = [mainKeyword];
            const titleWords = suggestion.title.split(' ').filter(word =>
                word.length > 2 && word !== mainKeyword &&
                !['위한', '하는', '대한', '없는', '있는', '되는', '모든', '통한'].includes(word)
            );
            keywords.push(...titleWords.slice(0, 4));

            console.log('Generated keywords:', keywords);

            // Use title as the topic
            const result = await generateBlogPost(
                suggestion.title,
                keywords,
                suggestion.platform,
                'informative'
            );

            setSerpBlogPost({ ...result, platform: suggestion.platform });
        } catch (err) {
            if (err instanceof Error) {
                setSerpBlogPostError(err.message);
            } else {
                setSerpBlogPostError('블로그 글 생성 중 오류가 발생했습니다.');
            }
        } finally {
            setSerpBlogPostLoading(false);
        }
    };

    const handleGenerateBlogPostFromPaa = async (paaItem: PaaItem & { platform: 'naver' | 'google' }) => {
        setPaaBlogPostLoading(true);
        setPaaBlogPostError(null);
        setPaaBlogPost(null);

        try {
            // Better keyword extraction from question
            const keywords = [mainKeyword];
            const questionWords = paaItem.question.replace(/[?]/g, '').split(' ').filter(word => 
                word.length > 2 && word !== mainKeyword &&
                !['어떻게', '무엇', '왜', '언제', '어디', '누가', '어느', '얼마나'].includes(word)
            );
            keywords.push(...questionWords.slice(0, 4));
            
            // Use question as the topic
            const result = await generateBlogPost(
                paaItem.question,
                keywords,
                paaItem.platform,
                'informative'
            );

            setPaaBlogPost({ ...result, platform: paaItem.platform });
        } catch (err) {
            if (err instanceof Error) {
                setPaaBlogPostError(err.message);
            } else {
                setPaaBlogPostError('블로그 글 생성 중 오류가 발생했습니다.');
            }
        } finally {
            setPaaBlogPostLoading(false);
        }
    };
    
    const analyzeBlogStrategy = async () => {
        if (!loading && !error && feature === 'blogs' && isBlogResults(results) && results.length > 0) {
            setStrategyLoading(true);
            setStrategyError(null);
            try {
                const strategyData = await generateBlogStrategy(mainKeyword, results);
                setBlogStrategy(strategyData);
            } catch (err) {
                if (err instanceof Error) {
                    setStrategyError(err.message);
                } else {
                    setStrategyError('블로그 공략법을 생성하는 중 알 수 없는 오류가 발생했습니다.');
                }
            } finally {
                setStrategyLoading(false);
            }
        }
    };

    const analyzeSerpStrategy = async () => {
        if (!loading && !error && feature === 'related-keywords' && isGoogleSerpResult(results) && results.length > 0) {
            setSerpStrategyLoading(true);
            setSerpStrategyError(null);
            try {
                const strategyData = await generateSerpStrategy(mainKeyword, results[0]);
                setSerpStrategy(strategyData);
            } catch (err) {
                if (err instanceof Error) {
                    setSerpStrategyError(err.message);
                } else {
                    setSerpStrategyError('SERP 분석 리포트를 생성하는 중 알 수 없는 오류가 발생했습니다.');
                }
            } finally {
                setSerpStrategyLoading(false);
            }
        }
    };


    React.useEffect(() => {
        // 무한 루프 방지를 위한 로딩 상태 체크
        if (!loading && !strategyLoading && !serpStrategyLoading) {
            if (feature === 'blogs' && results.length > 0) {
                analyzeBlogStrategy();
            } else {
                setBlogStrategy(null);
                setStrategyError(null);
            }
            
            if (feature === 'related-keywords' && results.length > 0 && isGoogleSerpResult(results)) {
                analyzeSerpStrategy();
            } else {
                setSerpStrategy(null);
                setSerpStrategyError(null);
            }
        }
    }, [results, feature, loading]);


    const handleFetchRecommendations = async () => {
        setRecoLoading(true);
        setRecoError(null);
        setRecommendedKeywords(null);

        // Clear all other states
        setResults([]);
        setError(null);
        setMainKeyword('');
        setBlogTopics(null);
        setTopicError(null);
        setBlogStrategy(null);
        setStrategyError(null);
        setSerpStrategy(null);
        setSerpStrategyError(null);
        setSustainableTopics(null);
        setSustainableTopicsError(null);
        setInitialLoad(false);

        setPromptResult(null);
        setPromptResultError(null);

        try {
            const recommendations = await fetchRecommendedKeywords();
            setRecommendedKeywords(recommendations);
        } catch (err) {
            if (err instanceof Error) {
                setRecoError(err.message);
            } else {
                setRecoError('전략 키워드를 분석하는 중 알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setRecoLoading(false);
        }
    };

    const handlePromptExecute = async (promptText: string) => {
        // Clear all visible results from main features to make space for the prompt result
        setResults([]);
        setRecommendedKeywords(null);
        setSustainableTopics(null);
        setBlogTopics(null);
        setBlogStrategy(null);
        setSerpStrategy(null);
        setInitialLoad(false); // So welcome/no-result messages don't conflict

        // Clear all main feature error states
        setError(null);
        setTopicError(null);
        setStrategyError(null);
        setSerpStrategyError(null);
        setRecoError(null);
        setSustainableTopicsError(null);
        
        // Clear its own state first
        setPromptResult(null);
        setPromptResultError(null);
    
        setPromptResultLoading(true);
    
        try {
            const data = await executePromptAsCompetitionAnalysis(promptText);
            setPromptResult(data);
            setKeyword(data.keyword);
        } catch (err) {
            if (err instanceof Error) {
                setPromptResultError(err.message);
            } else {
                setPromptResultError('프롬프트 실행 중 알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setPromptResultLoading(false);
        }
    };

    const handleReset = () => {
        setResults([]);
        setError(null);
        setInitialLoad(true);
        setSource('google');
        setFeature('competition');
        setKeyword('');
        setMainKeyword('');
        setBlogTopics(null);
        setTopicTitle('');
        setTopicLoading(false);
        setTopicError(null);
        setBlogStrategy(null);
        setStrategyLoading(false);
        setStrategyError(null);
        setSerpStrategy(null);
        setSerpStrategyLoading(false);
        setSerpStrategyError(null);
        setRecommendedKeywords(null);
        setRecoLoading(false);
        setRecoError(null);
        setSustainableTopics(null);
        setSustainableTopicsError(null);
        setSustainableTopicsLoading(false);

        setPromptResult(null);
        setPromptResultError(null);
    };

    const getWelcomeMessage = () => {
        if (feature === 'keywords') return "분석할 키워드를 입력하고 '키워드 검색' 버튼을 눌러주세요.";
        if (feature === 'related-keywords') return "Google SERP를 분석하고 콘텐츠 전략을 수립할 기준 키워드를 입력해주세요.";
        if (feature === 'blogs') return "상위 10개 포스트를 조회할 키워드를 입력해주세요.";
        if (feature === 'sustainable-topics') return "하나의 키워드를 다양한 관점으로 확장할 '다각도 블로그 주제'를 발굴할 키워드를 입력해주세요.";
        return "";
    }
    
    const getNoResultsMessage = () => {
        if (feature === 'keywords') return "해당 키워드에 대한 자동완성검색어를 찾을 수 없습니다.";
        if (feature === 'related-keywords') return "해당 키워드에 대한 SERP 데이터(관련 검색어, PAA)를 찾을 수 없습니다.";
        if (feature === 'blogs') return "해당 키워드에 대한 블로그 포스트를 찾을 수 없습니다.";
        if (feature === 'sustainable-topics') return "해당 키워드에 대한 '다각도 블로그 주제'를 발굴할 수 없습니다.";
        return "키워드 경쟁력 분석 결과를 가져올 수 없습니다. 다른 키워드로 시도해보세요.";
    }

    const anyLoading = loading || recoLoading || sustainableTopicsLoading || promptResultLoading;

    // 로그인하지 않은 경우 랜딩 페이지 표시
    if (!currentUser) {
        return (
            <>
                <LandingPage
                    onLogin={() => setIsAuthModalOpen(true)}
                    onRegister={() => {
                        setIsAuthModalOpen(true);
                        // 회원가입 모드로 설정하는 로직은 AuthModal 내부에서 처리
                    }}
                />
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onSuccess={(user) => {
                        setCurrentUser(user);
                        setIsAuthModalOpen(false);
                    }}
                />
            </>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            color: '#1f2937',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            position: 'relative'
        }}>
            {/* Main Layout Container */}
            <div style={{ 
                display: 'flex',
                height: '100vh'
            }}>
                {/* Left Sidebar - Controls */}
                <aside style={{
                    width: '380px',
                    background: '#f8fafc',
                    borderRight: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* API Key Settings or User Profile - Top */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        background: '#ffffff',
                        borderBottom: '1px solid #e2e8f0'
                    }}>
                        {config.mode === 'local' ? (
                            <div>
                                <ApiKeyStatus />
                                <ApiKeySettings />
                            </div>
                        ) : (
                            <div>
                                {currentUser ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                                {currentUser.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                {currentUser.plan === 'free' ? '무료' : currentUser.plan === 'pro' ? '프로' : currentUser.plan} 플랜
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                localStorage.removeItem('user');
                                                setCurrentUser(null);
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                background: '#f3f4f6',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                color: '#374151'
                                            }}
                                        >
                                            로그아웃
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-500 transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        로그인 / 회원가입
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Logo Section */}
                    <div style={{
                        padding: '2rem 1.5rem',
                        borderBottom: '1px solid #e2e8f0',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '0.4rem 1rem',
                            borderRadius: '50px',
                            marginBottom: '0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#667eea',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
                        }}>
                            ✨ Professional SEO Tool
                        </div>
                        
                        <h1 style={{
                            fontSize: '1.75rem',
                            fontWeight: '800',
                            margin: '0 0 0.5rem 0',
                            color: '#ffffff',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}>
                            Keyword Insight Pro
                        </h1>
                        
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            margin: 0
                        }}>
                            Advanced SEO Research Platform
                        </p>
                    </div>

                    {/* Controls Section */}
                    <div style={{
                        flex: 1,
                        padding: '1.5rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {/* Current Status */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '1rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <CurrentStatus />
                        </div>

                        {/* Feature Selector */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '1rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h3 style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.75rem',
                                color: '#4b5563'
                            }}>
                                기능 선택
                            </h3>
                            <FeatureSelector 
                                selectedFeature={feature} 
                                onSelectFeature={handleFeatureSelect} 
                                loading={anyLoading}
                                onFetchRecommendations={handleFetchRecommendations}
                                recoLoading={recoLoading}
                                onReset={handleReset}
                            />
                        </div>

                        {/* Search Engine Selector (conditional) */}
                        {feature === 'keywords' && (
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                padding: '1rem',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}>
                                <h3 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    marginBottom: '0.75rem',
                                    color: '#4b5563'
                                }}>
                                    검색 엔진
                                </h3>
                                <SearchEngineSelector selectedSource={source} onSelectSource={setSource} loading={anyLoading} />
                            </div>
                        )}

                        {/* Keyword Input */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '1rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h3 style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                marginBottom: '0.75rem',
                                color: '#4b5563'
                            }}>
                                키워드 입력
                            </h3>
                            <KeywordInputForm 
                                onSearch={handleSearch} 
                                loading={anyLoading} 
                                keyword={keyword} 
                                setKeyword={setKeyword} 
                                feature={feature} 
                            />
                        </div>

                        {/* Realtime Keywords Sidebar */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '1rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            flex: 1,
                            minHeight: '200px'
                        }}>
                            <RealtimeKeywordsSidebar onPromptExecute={handlePromptExecute} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        textAlign: 'center',
                        background: '#f8fafc'
                    }}>
                        <div>© 2025 Keyword Insight Pro</div>
                        <div style={{ marginTop: '0.25rem' }}>Version 2.0</div>
                    </div>
                </aside>

                {/* Right Main Content Area */}
                <main style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: '#ffffff'
                }}>
                    {/* Top Header Bar */}
                    <header style={{
                        padding: '1.5rem 2rem',
                        background: '#ffffff',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            margin: 0,
                            color: '#1f2937'
                        }}>
                            Analysis Results
                        </h2>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            {/* User Profile or Login Button */}
                            {currentUser ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    background: '#f3f4f6',
                                    borderRadius: '8px'
                                }}>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: '#4b5563',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('User name clicked');
                                        setIsUserDashboardOpen(true);
                                    }}
                                    >
                                        {currentUser.name || currentUser.email}
                                    </span>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        background: currentUser.plan === 'pro' || currentUser.plan === 'enterprise'
                                            ? 'linear-gradient(135deg, #eab308, #f59e0b)'
                                            : '#e5e7eb',
                                        color: currentUser.plan === 'pro' || currentUser.plan === 'enterprise'
                                            ? '#ffffff'
                                            : '#6b7280',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                                        {currentUser.plan || 'free'}
                                    </span>
                                    {currentUser.role === 'admin' && (
                                        <button
                                            onClick={() => setIsAdminDashboardOpen(true)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                color: '#ffffff',
                                                fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            관리자
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Dashboard button clicked');
                                            setIsUserDashboardOpen(true);
                                        }}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            color: '#ffffff',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        대시보드
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('user');
                                            setCurrentUser(null);
                                        }}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            background: 'transparent',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            color: '#6b7280',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f3f4f6';
                                            e.currentTarget.style.borderColor = '#d1d5db';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                        }}
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        color: '#ffffff',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                                    }}
                                >
                                    로그인 / 회원가입
                                </button>
                            )}

                            <button
                                onClick={() => setIsHelpModalOpen(true)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: '#ffffff',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.2)';
                                }}
                            >
                                <span>📚</span>
                                <span>Help & Docs</span>
                            </button>
                        </div>
                    </header>

                    {/* Results Content Area */}
                    <div style={{
                        flex: 1,
                        padding: '2rem',
                        overflowY: 'auto',
                        background: '#f9fafb'
                    }}>
                        <div style={{
                            maxWidth: '1200px',
                            margin: '0 auto'
                        }}>
                            {promptResultLoading && <LoadingSpinner />}
                            {promptResultError && <ErrorMessage message={promptResultError} />}
                            {promptResult && <PromptResultDisplay data={promptResult} />}
                            
                            {!promptResultLoading && !promptResultError && !promptResult && (
                                <>
                                    {recoLoading && <LoadingSpinner />}
                                    {recoError && <ErrorMessage message={recoError} />}
                                    {recommendedKeywords && <RecommendedKeywordsDisplay data={recommendedKeywords} />}

                                    {!recoLoading && !recoError && !recommendedKeywords && (
                                        <>
                                            {(loading || sustainableTopicsLoading) && <LoadingSpinner />}
                                            {error && <ErrorMessage message={error} />}
                                            {sustainableTopicsError && <ErrorMessage message={sustainableTopicsError} />}
                                            
                                            {!loading && !error && !sustainableTopicsLoading && !sustainableTopicsError &&(
                                                <>
                                                    {isCompetitionResult(results) && <CompetitionAnalysisResults data={results[0]} onGenerateBlogPost={handleGenerateBlogPostFromStrategy} />}
                                                    {isBlogResults(results) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                            <BlogResultsTable data={results} />
                                                            {strategyLoading && <LoadingSpinner />}
                                                            {strategyError && <ErrorMessage message={strategyError} />}
                                                            {blogStrategy && <BlogStrategyReport data={blogStrategy} onGenerateBlogPost={handleGenerateBlogPostFromStrategy} />}

                                                            {/* Strategy 블로그 글쓰기 결과 - BlogStrategy 바로 아래에 표시 */}
                                                            {blogPostLoading && <LoadingSpinner />}
                                                            {blogPostError && <ErrorMessage message={blogPostError} />}
                                                            {blogPost && <BlogPostDisplay title={blogPost.title} content={blogPost.content} format={blogPost.format} platform={blogPost.platform} schemaMarkup={blogPost.schemaMarkup} />}
                                                        </div>
                                                    )}
                                                    {isGoogleSerpResult(results) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                            <ResultsTable
                                                                data={results[0].related_searches.map((kw, i) => ({ id: i + 1, keyword: kw }))}
                                                                onKeywordClick={handleKeywordClick}
                                                                onGenerateTopicsFromMain={() => {}}
                                                                onGenerateTopicsFromAll={() => {}}
                                                                loading={false}
                                                                feature={feature}
                                                            />
                                                            <PeopleAlsoAsk data={results[0].people_also_ask} onGenerateBlogPost={handleGenerateBlogPostFromPaa} />
                                                            
                                                            {/* PAA 블로그 글쓰기 결과 - PAA 바로 아래에 표시 */}
                                                            {paaBlogPostLoading && <LoadingSpinner />}
                                                            {paaBlogPostError && <ErrorMessage message={paaBlogPostError} />}
                                                            {paaBlogPost && <BlogPostDisplay title={paaBlogPost.title} content={paaBlogPost.content} format={paaBlogPost.format} platform={paaBlogPost.platform} schemaMarkup={paaBlogPost.schemaMarkup} />}
                                                            
                                                            {serpStrategyLoading && <LoadingSpinner />}
                                                            {serpStrategyError && <ErrorMessage message={serpStrategyError} />}
                                                            {serpStrategy && <SerpStrategyReport data={serpStrategy} onGenerateBlogPost={handleGenerateBlogPostFromSerp} />}
                                                            
                                                            {/* SERP 블로그 글쓰기 결과 - SERP 전략 바로 아래에 표시 */}
                                                            {serpBlogPostLoading && <LoadingSpinner />}
                                                            {serpBlogPostError && <ErrorMessage message={serpBlogPostError} />}
                                                            {serpBlogPost && <BlogPostDisplay title={serpBlogPost.title} content={serpBlogPost.content} format={serpBlogPost.format} platform={serpBlogPost.platform} schemaMarkup={serpBlogPost.schemaMarkup} />}
                                                        </div>
                                                    )}
                                                    {isKeywordResults(results) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                            <ResultsTable 
                                                                data={results}
                                                                onKeywordClick={handleKeywordClick}
                                                                onGenerateTopicsFromMain={() => handleGenerateTopics('main')}
                                                                onGenerateTopicsFromAll={() => handleGenerateTopics('all')}
                                                                loading={topicLoading}
                                                                feature={feature}
                                                            />
                                                            {topicLoading && <LoadingSpinner />}
                                                            {topicError && <ErrorMessage message={topicError} />}
                                                            {blogTopics && <BlogTopicSuggestions title={topicTitle} data={blogTopics} onGenerateBlogPost={handleGenerateBlogPost} />}
                                                            {blogPostLoading && <LoadingSpinner />}
                                                            {blogPostError && <ErrorMessage message={blogPostError} />}
                                                            {blogPost && <BlogPostDisplay title={blogPost.title} content={blogPost.content} format={blogPost.format} platform={blogPost.platform} schemaMarkup={blogPost.schemaMarkup} />}
                                                        </div>
                                                    )}
                                                    {sustainableTopics && <SustainableTopicsResults data={sustainableTopics} />}
                                                </>
                                            )}
                                        
                                            {initialLoad && !anyLoading && !error && !recommendedKeywords && !sustainableTopicsError && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '4rem',
                                                    background: '#ffffff',
                                                    borderRadius: '16px',
                                                    border: '1px solid #e5e7eb',
                                                    maxWidth: '600px',
                                                    margin: '4rem auto',
                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                                }}>
                                                    <div style={{
                                                        fontSize: '3rem',
                                                        marginBottom: '1rem'
                                                    }}>
                                                        🔍
                                                    </div>
                                                    <h3 style={{
                                                        fontSize: '1.8rem',
                                                        fontWeight: '700',
                                                        marginBottom: '1rem',
                                                        color: '#1f2937',
                                                        lineHeight: '1.3'
                                                    }}>
                                                        <span style={{ color: '#ef4444', fontWeight: '800' }}>단순글쓰기 NO!</span>
                                                        <br />
                                                        <span style={{ color: '#10b981', fontWeight: '800' }}>상위노출되는 글쓰기 YES!</span>
                                                    </h3>
                                                    <p style={{ 
                                                        color: '#6b7280', 
                                                        fontSize: '1rem',
                                                        lineHeight: '1.6'
                                                    }}>
                                                        {getWelcomeMessage()}
                                                    </p>
                                                </div>
                                            )}
                                            {!initialLoad && results.length === 0 && !sustainableTopics && !anyLoading && !error && !recommendedKeywords && !sustainableTopicsError && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '4rem',
                                                    background: '#fef2f2',
                                                    borderRadius: '16px',
                                                    border: '1px solid #fecaca',
                                                    maxWidth: '600px',
                                                    margin: '4rem auto'
                                                }}>
                                                    <div style={{
                                                        fontSize: '3rem',
                                                        marginBottom: '1rem'
                                                    }}>
                                                        ⚠️
                                                    </div>
                                                    <h3 style={{
                                                        fontSize: '1.5rem',
                                                        fontWeight: '600',
                                                        marginBottom: '1rem',
                                                        color: '#991b1b'
                                                    }}>
                                                        No Results Found
                                                    </h3>
                                                    <p style={{ 
                                                        color: '#dc2626', 
                                                        fontSize: '1rem',
                                                        lineHeight: '1.6'
                                                    }}>
                                                        {getNoResultsMessage()}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                     )}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
            
            {/* 모드 전환 버튼 */}
            <ModeToggle />
            
            {/* 관리자 대시보드 모달 */}
            {currentUser && currentUser.role === 'admin' && (
                <AdminDashboard
                    isOpen={isAdminDashboardOpen}
                    onClose={() => setIsAdminDashboardOpen(false)}
                />
            )}

            {/* 사용자 대시보드 모달 */}
            {currentUser && isUserDashboardOpen && (
                <UserDashboard
                    user={currentUser}
                    onClose={() => setIsUserDashboardOpen(false)}
                    onUpgradePlan={() => {
                        setIsUserDashboardOpen(false);
                        // 결제 페이지로 이동하는 로직 추가 예정
                        alert('결제 시스템 준비 중입니다.');
                    }}
                />
            )}

            {/* 인증 모달 */}
            {isAuthModalOpen && (
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    onSuccess={(user) => {
                        setCurrentUser(user);
                        setIsAuthModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default App;