import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import BlogWritingModal from './components/BlogWritingModal';
import VideoTutorials from './components/VideoTutorials';
import { generateTopicsFromMainKeyword, generateTopicsFromAllKeywords, generateBlogStrategy, fetchRecommendedKeywords, generateSustainableTopics, generateSerpStrategy, executePromptAsCompetitionAnalysis, generateBlogPost, generateTrendBlogPost } from './services/keywordService';
import { searchNaverKeywords, analyzeNaverCompetition, downloadExcel } from './services/naverKeywordService';
import type { SearchSource, Feature, KeywordData, BlogPostData, KeywordMetrics, GeneratedTopic, BlogStrategyReportData, RecommendedKeyword, SustainableTopicCategory, GoogleSerpData, SerpStrategyReportData, PaaItem, NaverKeywordData } from './types';
import NaverKeywordAnalysis from './components/NaverKeywordAnalysis';
import { config } from './src/config/appConfig';
import { updateAdminAccount, saveNaverApiKeys, getNaverApiKeys, checkUsageLimit, checkSubscriptionExpiry, checkDailyLimit, incrementDailyUsage, PLAN_DAILY_LIMITS } from './src/config/firebase';
import type { NaverApiKeys as FirebaseNaverApiKeys } from './src/config/firebase';

interface NaverApiKeys {
    adApiKey: string;
    adSecretKey: string;
    adCustomerId: string;
    searchClientId: string;
    searchClientSecret: string;
}

const App: React.FC = () => {
    const navigate = useNavigate();
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

    const [naverKeywords, setNaverKeywords] = useState<NaverKeywordData[] | null>(null);
    const [naverKeywordsLoading, setNaverKeywordsLoading] = useState<boolean>(false);
    const [naverKeywordsError, setNaverKeywordsError] = useState<string | null>(null);
    const [naverAnalyzing, setNaverAnalyzing] = useState<boolean>(false);
    const [naverExcelFilename, setNaverExcelFilename] = useState<string>('');

    const [blogPost, setBlogPost] = useState<{ title: string; content: string; format: 'html' | 'markdown' | 'text'; platform: 'naver' | 'google'; schemaMarkup?: string; htmlPreview?: string; metadata?: { keywords: string; imagePrompt: string; seoTitles: string[] } } | null>(null);
    const [blogPostLoading, setBlogPostLoading] = useState<boolean>(false);
    const [blogPostError, setBlogPostError] = useState<string | null>(null);
    
    // PAA용 별도 블로그 포스트 state
    const [paaBlogPost, setPaaBlogPost] = useState<{ title: string; content: string; format: 'html' | 'markdown' | 'text'; platform: 'naver' | 'google'; schemaMarkup?: string; htmlPreview?: string; metadata?: { keywords: string; imagePrompt: string; seoTitles: string[] } } | null>(null);
    const [paaBlogPostLoading, setPaaBlogPostLoading] = useState<boolean>(false);
    const [paaBlogPostError, setPaaBlogPostError] = useState<string | null>(null);

    // SERP용 별도 블로그 포스트 state
    const [serpBlogPost, setSerpBlogPost] = useState<{ title: string; content: string; format: 'html' | 'markdown' | 'text'; platform: 'naver' | 'google'; schemaMarkup?: string; htmlPreview?: string; metadata?: { keywords: string; imagePrompt: string; seoTitles: string[] } } | null>(null);
    const [serpBlogPostLoading, setSerpBlogPostLoading] = useState<boolean>(false);
    const [serpBlogPostError, setSerpBlogPostError] = useState<string | null>(null);

    const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
    const [naverApiKeys, setNaverApiKeys] = useState<NaverApiKeys | null>(() => {
        const saved = localStorage.getItem('naverApiKeys');
        return saved ? JSON.parse(saved) : null;
    });

    // 무료 체험 상태 관리
    const [naverTrialUsed, setNaverTrialUsed] = useState<boolean>(() => {
        const saved = localStorage.getItem('naverTrialUsed');
        return saved === 'true';
    });

    // 모바일 감지
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor;
            const mobileCheck = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            const screenCheck = window.innerWidth <= 768;
            setIsMobile(mobileCheck || screenCheck);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // SaaS 모드 관련 상태
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
    const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
    const [isVideoTutorialsOpen, setIsVideoTutorialsOpen] = useState(false);
    const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
    const [adminRefreshTrigger, setAdminRefreshTrigger] = useState(0);
    const [currentUser, setCurrentUser] = useState<any>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    // 블로그 글쓰기 모달 상태
    const [isBlogWritingModalOpen, setIsBlogWritingModalOpen] = useState(false);
    const [pendingBlogWrite, setPendingBlogWrite] = useState<{
        type: 'topic' | 'strategy' | 'sustainable' | 'serp' | 'paa';
        data: any;
    } | null>(null);

    // 대시보드 상태 디버깅용 useEffect
    useEffect(() => {
        console.log('isUserDashboardOpen changed:', isUserDashboardOpen);
    }, [isUserDashboardOpen]);

    useEffect(() => {
        console.log('currentUser changed:', currentUser);

        // ✅ 로그인 시 구독 만료 자동 체크 추가
        if (currentUser && currentUser.uid && config.mode === 'saas') {
            checkSubscriptionExpiry(currentUser.uid).then((isValid) => {
                if (!isValid && currentUser.plan !== 'enterprise') {
                    console.log('구독이 만료되어 free 플랜으로 변경됨');
                    // 사용자 정보 갱신
                    const updatedUser = { ...currentUser, plan: 'free' as const, subscriptionEnd: undefined, subscriptionDays: undefined };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }).catch((error) => {
                console.error('구독 만료 체크 오류:', error);
            });
        }

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

        // 사용자 로그인 시 Firebase에서 네이버 API 키 불러오기
        if (currentUser && currentUser.uid) {
            getNaverApiKeys(currentUser.uid).then((keys) => {
                if (keys) {
                    console.log('Loaded Naver API keys from Firebase');
                    setNaverApiKeys(keys);
                    localStorage.setItem('naverApiKeys', JSON.stringify(keys));
                }
            }).catch((error) => {
                console.error('Error loading Naver API keys:', error);
            });
        }
    }, [currentUser?.email, currentUser?.uid]);

    // ✅ 검색 성공 시 일일 사용량 증가
    useEffect(() => {
        if (config.mode === 'saas' && currentUser && results.length > 0 && !loading && !error) {
            // 검색이 성공적으로 완료되었을 때만 증가
            incrementDailyUsage(currentUser.uid, 'keywordSearches').catch((error) => {
                console.error('일일 사용량 증가 오류:', error);
            });
        }
    }, [results, loading, error, currentUser?.uid]);

    const handleFeatureSelect = (newFeature: Feature) => {
        if (feature === newFeature) return;

        // 네이버 키워드 분석 선택 시 API 키 확인 (무료 체험 고려, 단 SaaS 모드에서만)
        if (newFeature === 'naver-keyword-analysis' && !naverApiKeys && config.mode === 'saas') {
            if (naverTrialUsed) {
                alert('⚠️ 무료 체험 기회를 이미 사용하셨습니다.\n\n계속 이용하시려면 왼쪽 상단의 "🔑 API 키 입력" 버튼을 클릭하여\n네이버 광고 API와 검색 API 키를 설정해주세요.');
                return;
            } else {
                // 무료 체험 가능 시 안내
                const proceed = confirm('🎁 무료 체험 1회 제공!\n\n네이버 API 키 없이 1회 무료로 체험해보실 수 있습니다.\n계속하시겠습니까?\n\n※ 무료 체험 후에는 본인의 API 키가 필요합니다.');
                if (!proceed) return;
            }
        }

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

        setNaverKeywords(null);
        setNaverKeywordsError(null);
        setNaverKeywordsLoading(false);
        setNaverAnalyzing(false);
        setNaverExcelFilename('');

        setFeature(newFeature);
    };

    const handleSearch = async (searchKeyword: string) => {
        if (!searchKeyword.trim()) return;

        // ✅ 구독 상태 및 사용량 제한 체크 (SaaS 모드에서만)
        if (config.mode === 'saas' && currentUser) {
            try {
                // 1. 구독 만료 여부 확인
                const isSubscriptionValid = await checkSubscriptionExpiry(currentUser.uid);

                // 2. 사용 가능 여부 확인
                const canUse = await checkUsageLimit(currentUser.uid);

                if (!isSubscriptionValid || !canUse) {
                    // 구독이 만료되었거나 사용 제한 초과
                    const confirmUpgrade = confirm(
                        '⏰ 구독 기간이 만료되었습니다\n\n' +
                        '계속 이용하시려면 플랜을 업그레이드해주세요.\n\n' +
                        '✅ Basic: 월 ₩19,900 (무제한 검색)\n' +
                        '✅ Pro: 월 ₩29,900 (무제한 검색 + AI 고급 기능)\n\n' +
                        '대시보드로 이동하시겠습니까?'
                    );

                    // 사용자 정보 갱신 (플랜이 free로 변경되었을 수 있음)
                    const updatedUser = { ...currentUser, plan: 'free' };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));

                    if (confirmUpgrade) {
                        setIsUserDashboardOpen(true);
                    }

                    return; // 검색 중단
                }

                // 3. 일일 사용량 체크
                const dailyLimitCheck = await checkDailyLimit(currentUser.uid, 'keywordSearches');

                if (!dailyLimitCheck.canUse) {
                    const limit = dailyLimitCheck.limit;
                    const planName = currentUser.plan === 'free' ? 'Free' : currentUser.plan === 'basic' ? 'Basic' : currentUser.plan === 'pro' ? 'Pro' : 'Enterprise';

                    const confirmUpgrade = confirm(
                        `⏰ 오늘의 키워드 검색 한도를 초과했습니다\n\n` +
                        `현재 플랜: ${planName}\n` +
                        `일일 한도: ${limit}회\n` +
                        `사용량: ${dailyLimitCheck.current}/${limit}\n\n` +
                        `더 많은 검색을 원하시면 플랜을 업그레이드해주세요.\n\n` +
                        `✅ Basic: 일 30회 검색 (월 ₩19,900)\n` +
                        `✅ Pro: 일 100회 검색 (월 ₩29,900)\n` +
                        `✅ Enterprise: 무제한 (문의)\n\n` +
                        `대시보드로 이동하시겠습니까?`
                    );

                    if (confirmUpgrade) {
                        setIsUserDashboardOpen(true);
                    }
                    return; // 검색 중단
                }
            } catch (error) {
                console.error('구독 상태 확인 오류:', error);
                alert('⚠️ 구독 상태를 확인하는 중 오류가 발생했습니다.\n다시 시도해주세요.');
                return;
            }
        }

        // Reset all states
        setInitialLoad(false);
        setMainKeyword(searchKeyword);
        setKeyword(searchKeyword); // 키워드도 함께 설정
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

        setNaverKeywords(null);
        setNaverKeywordsError(null);
        setNaverExcelFilename('');

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
        } else if (feature === 'naver-keyword-analysis') {
            setNaverKeywordsLoading(true);
            try {
                const data = await searchNaverKeywords(searchKeyword);
                setNaverKeywords(data);
            } catch (err) {
                if (err instanceof Error) {
                    setNaverKeywordsError(err.message);
                } else {
                    setNaverKeywordsError('네이버 키워드 검색 중 알 수 없는 오류가 발생했습니다.');
                }
            } finally {
                setNaverKeywordsLoading(false);

                // 무료 체험 사용 시 표시 저장 (검색 완료 후, SaaS 모드에서만)
                if (!naverApiKeys && !naverTrialUsed && config.mode === 'saas') {
                    setNaverTrialUsed(true);
                    localStorage.setItem('naverTrialUsed', 'true');
                    // 약간의 지연 후 알림 표시 (UI 업데이트 후)
                    setTimeout(() => {
                        alert('✅ 무료 체험이 완료되었습니다!\n\n계속 이용하시려면 왼쪽 상단의 "🔑 API 키 입력"에서\n네이버 API 키를 설정해주세요.');
                    }, 500);
                }
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
        // ✅ 구독 상태 체크 추가
        if (config.mode === 'saas' && currentUser) {
            try {
                const isSubscriptionValid = await checkSubscriptionExpiry(currentUser.uid);
                const canUse = await checkUsageLimit(currentUser.uid);

                if (!isSubscriptionValid || !canUse) {
                    const confirmUpgrade = confirm(
                        '⏰ 구독 기간이 만료되었습니다\n\n' +
                        '계속 이용하시려면 플랜을 업그레이드해주세요.\n\n' +
                        '✅ Basic: 월 ₩19,900 (무제한 검색)\n' +
                        '✅ Pro: 월 ₩29,900 (무제한 검색 + AI 고급 기능)\n\n' +
                        '대시보드로 이동하시겠습니까?'
                    );
                    const updatedUser = { ...currentUser, plan: 'free' };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    if (confirmUpgrade) {
                        setIsUserDashboardOpen(true);
                    }
                    return;
                }
            } catch (error) {
                console.error('구독 상태 확인 오류:', error);
                alert('⚠️ 구독 상태를 확인하는 중 오류가 발생했습니다.');
                return;
            }
        }

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
        // 모달 열기
        setPendingBlogWrite({ type: 'topic', data: topic });
        setIsBlogWritingModalOpen(true);
    };

    // 실제 글쓰기 실행 함수
    const executeGenerateBlogPost = async (
        topic: GeneratedTopic & { platform: 'naver' | 'google' },
        options: {
            contentFormat?: 'comparison' | 'listicle' | 'guide';
            tone: 'friendly' | 'expert' | 'informative';
        }
    ) => {
        console.log('executeGenerateBlogPost called with:', topic, options);

        // ✅ 구독 상태 체크 추가
        if (config.mode === 'saas' && currentUser) {
            try {
                const isSubscriptionValid = await checkSubscriptionExpiry(currentUser.uid);
                const canUse = await checkUsageLimit(currentUser.uid);

                if (!isSubscriptionValid || !canUse) {
                    const confirmUpgrade = confirm(
                        '⏰ 구독 기간이 만료되었습니다\n\n' +
                        '계속 이용하시려면 플랜을 업그레이드해주세요.\n\n' +
                        '✅ Basic: 월 ₩19,900 (무제한 검색)\n' +
                        '✅ Pro: 월 ₩29,900 (무제한 검색 + AI 고급 기능)\n\n' +
                        '대시보드로 이동하시겠습니까?'
                    );
                    const updatedUser = { ...currentUser, plan: 'free' };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    if (confirmUpgrade) {
                        setIsUserDashboardOpen(true);
                    }
                    return;
                }

                // 3. 일일 블로그 생성 한도 체크
                const dailyLimitCheck = await checkDailyLimit(currentUser.uid, 'blogGenerations');

                if (!dailyLimitCheck.canUse) {
                    const limit = dailyLimitCheck.limit;
                    const planName = currentUser.plan === 'free' ? 'Free' : currentUser.plan === 'basic' ? 'Basic' : currentUser.plan === 'pro' ? 'Pro' : 'Enterprise';

                    const confirmUpgrade = confirm(
                        `⏰ 오늘의 블로그 생성 한도를 초과했습니다\n\n` +
                        `현재 플랜: ${planName}\n` +
                        `일일 한도: ${limit}회\n` +
                        `사용량: ${dailyLimitCheck.current}/${limit}\n\n` +
                        `더 많은 블로그를 생성하시려면 플랜을 업그레이드해주세요.\n\n` +
                        `✅ Basic: 일 10회 생성 (월 ₩19,900)\n` +
                        `✅ Pro: 무제한 생성 (월 ₩29,900)\n` +
                        `✅ Enterprise: 무제한 (문의)\n\n` +
                        `대시보드로 이동하시겠습니까?`
                    );

                    if (confirmUpgrade) {
                        setIsUserDashboardOpen(true);
                    }
                    return;
                }
            } catch (error) {
                console.error('구독 상태 확인 오류:', error);
                alert('⚠️ 구독 상태를 확인하는 중 오류가 발생했습니다.');
                return;
            }
        }

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

            const post = await generateBlogPost(topic.title, effectiveKeywords, topic.platform, options.tone, options.contentFormat);
            setBlogPost({ ...post, platform: topic.platform });

            // ✅ 블로그 생성 성공 시 일일 사용량 증가
            if (config.mode === 'saas' && currentUser) {
                await incrementDailyUsage(currentUser.uid, 'blogGenerations');
            }
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
        platform: 'naver' | 'google';
        keyword?: string; // CompetitionAnalysisResults에서 전달하는 키워드
    }) => {
        console.log('handleGenerateBlogPostFromStrategy called with:', suggestion);
        // 모달 열기
        setPendingBlogWrite({ type: 'strategy', data: suggestion });
        setIsBlogWritingModalOpen(true);
    };

    // 실제 전략 글쓰기 실행 함수
    const executeGenerateBlogPostFromStrategy = async (
        suggestion: {
            title: string;
            thumbnailCopy?: string;
            strategy?: string;
            description?: string;
            platform: 'naver' | 'google';
            keyword?: string;
        },
        options: {
            contentFormat?: 'comparison' | 'listicle' | 'guide';
            tone: 'friendly' | 'expert' | 'informative';
        }
    ) => {
        console.log('=== executeGenerateBlogPostFromStrategy START ===');
        console.log('suggestion:', suggestion);
        console.log('options:', options);

        setBlogPostLoading(true);
        setBlogPostError(null);
        setBlogPost(null);

        try {
            let searchKeyword = suggestion.keyword || mainKeyword || keyword;

            if (!searchKeyword && isCompetitionResult(results) && results[0]) {
                searchKeyword = results[0].keyword;
            }

            if (!searchKeyword) {
                throw new Error('키워드를 찾을 수 없습니다. 분석을 다시 실행해주세요.');
            }

            const keywords = [searchKeyword];
            const titleWords = suggestion.title.split(' ').filter(word =>
                word.length > 2 && word !== searchKeyword &&
                !['위한', '하는', '대한', '없는', '있는', '되는', '모든', '통한'].includes(word)
            );
            keywords.push(...titleWords.slice(0, 4));

            // 키워드 경쟁력 분석에서는 실시간 트렌드 블로그 생성 함수 사용 (tone과 contentFormat 추가)
            const result = await generateTrendBlogPost(
                suggestion.title,
                keywords,
                suggestion.platform,
                options.tone,
                options.contentFormat
            );

            if (result) {
                setBlogPost({ ...result, platform: suggestion.platform });

                // ✅ 블로그 생성 성공 시 일일 사용량 증가
                if (config.mode === 'saas' && currentUser) {
                    await incrementDailyUsage(currentUser.uid, 'blogGenerations');
                }
            } else {
                throw new Error('블로그 글 생성 결과가 없습니다.');
            }
        } catch (err) {
            console.error('Error in executeGenerateBlogPostFromStrategy:', err);
            if (err instanceof Error) {
                setBlogPostError(err.message);
            } else {
                setBlogPostError('블로그 글 생성 중 오류가 발생했습니다.');
            }
        } finally {
            setBlogPostLoading(false);
        }
    };
    
    // 4차원 주제발굴에서 사용하는 핸들러
    const handleGenerateBlogPostFromSustainable = async (topic: {
        title: string;
        keywords: string[];
        strategy: string;
        category: string;
        platform: 'naver' | 'google';
    }) => {
        console.log('handleGenerateBlogPostFromSustainable called with:', topic);
        setPendingBlogWrite({ type: 'sustainable', data: topic });
        setIsBlogWritingModalOpen(true);
    };

    // 4차원 주제발굴 실제 글쓰기 실행 함수
    const executeGenerateBlogPostFromSustainable = async (
        topic: {
            title: string;
            keywords: string[];
            strategy: string;
            category: string;
            platform: 'naver' | 'google';
        },
        options: {
            contentFormat?: 'comparison' | 'listicle' | 'guide';
            tone: 'friendly' | 'expert' | 'informative';
        }
    ) => {
        console.log('executeGenerateBlogPostFromSustainable called with:', topic, options);
        setBlogPostLoading(true);
        setBlogPostError(null);
        setBlogPost(null);

        try {
            // generateBlogPost 함수 사용 - 구글일 때 자동으로 제목 5개, 해시태그, 이미지 프롬프트, 색상 테마 포함
            const result = await generateBlogPost(
                topic.title,
                topic.keywords,
                topic.platform,
                options.tone,
                options.contentFormat
            );

            setBlogPost({ ...result, platform: topic.platform });

            // ✅ 블로그 생성 성공 시 일일 사용량 증가
            if (config.mode === 'saas' && currentUser) {
                await incrementDailyUsage(currentUser.uid, 'blogGenerations');
            }
        } catch (err) {
            console.error('Error in executeGenerateBlogPostFromSustainable:', err);
            if (err instanceof Error) {
                setBlogPostError(err.message);
            } else {
                setBlogPostError('블로그 글 생성 중 오류가 발생했습니다.');
            }
        } finally {
            setBlogPostLoading(false);
        }
    };

    // API 키 업데이트 시 관리자 대시보드 새로고침
    const handleApiKeyUpdate = (apiKey: string) => {
        console.log('App.tsx: handleApiKeyUpdate 호출됨');
        console.log('API 키 상태:', apiKey ? '✓ 있음' : '✗ 없음');
        console.log('이전 adminRefreshTrigger:', adminRefreshTrigger);
        setAdminRefreshTrigger(prev => {
            const newValue = prev + 1;
            console.log('새로운 adminRefreshTrigger:', newValue);
            return newValue;
        });
    };

    const handleGenerateBlogPostFromSerp = async (suggestion: { title: string; thumbnailCopy: string; strategy: string; platform: 'naver' | 'google' }) => {
        console.log('handleGenerateBlogPostFromSerp called with:', suggestion);
        setPendingBlogWrite({ type: 'serp', data: suggestion });
        setIsBlogWritingModalOpen(true);
    };

    // SERP 실제 글쓰기 실행 함수
    const executeGenerateBlogPostFromSerp = async (
        suggestion: { title: string; thumbnailCopy: string; strategy: string; platform: 'naver' | 'google' },
        options: {
            contentFormat?: 'comparison' | 'listicle' | 'guide';
            tone: 'friendly' | 'expert' | 'informative';
        }
    ) => {
        console.log('executeGenerateBlogPostFromSerp called with:', suggestion, options);
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
                options.tone,
                options.contentFormat
            );

            setSerpBlogPost({ ...result, platform: suggestion.platform });

            // ✅ 블로그 생성 성공 시 일일 사용량 증가
            if (config.mode === 'saas' && currentUser) {
                await incrementDailyUsage(currentUser.uid, 'blogGenerations');
            }
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
        console.log('handleGenerateBlogPostFromPaa called with:', paaItem);
        setPendingBlogWrite({ type: 'paa', data: paaItem });
        setIsBlogWritingModalOpen(true);
    };

    // PAA 실제 글쓰기 실행 함수
    const executeGenerateBlogPostFromPaa = async (
        paaItem: PaaItem & { platform: 'naver' | 'google' },
        options: {
            contentFormat?: 'comparison' | 'listicle' | 'guide';
            tone: 'friendly' | 'expert' | 'informative';
        }
    ) => {
        console.log('executeGenerateBlogPostFromPaa called with:', paaItem, options);
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
                options.tone,
                options.contentFormat
            );

            setPaaBlogPost({ ...result, platform: paaItem.platform });

            // ✅ 블로그 생성 성공 시 일일 사용량 증가
            if (config.mode === 'saas' && currentUser) {
                await incrementDailyUsage(currentUser.uid, 'blogGenerations');
            }
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
        // ✅ 구독 상태 체크 추가
        if (config.mode === 'saas' && currentUser) {
            try {
                const isSubscriptionValid = await checkSubscriptionExpiry(currentUser.uid);
                const canUse = await checkUsageLimit(currentUser.uid);

                if (!isSubscriptionValid || !canUse) {
                    const confirmUpgrade = confirm(
                        '⏰ 구독 기간이 만료되었습니다\n\n' +
                        '계속 이용하시려면 플랜을 업그레이드해주세요.\n\n' +
                        '✅ Basic: 월 ₩19,900 (무제한 검색)\n' +
                        '✅ Pro: 월 ₩29,900 (무제한 검색 + AI 고급 기능)\n\n' +
                        '대시보드로 이동하시겠습니까?'
                    );
                    const updatedUser = { ...currentUser, plan: 'free' };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    if (confirmUpgrade) {
                        setIsUserDashboardOpen(true);
                    }
                    return;
                }
            } catch (error) {
                console.error('구독 상태 확인 오류:', error);
                alert('⚠️ 구독 상태를 확인하는 중 오류가 발생했습니다.');
                return;
            }
        }

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
        // ✅ 구독 상태 체크 추가
        if (config.mode === 'saas' && currentUser) {
            try {
                const isSubscriptionValid = await checkSubscriptionExpiry(currentUser.uid);
                const canUse = await checkUsageLimit(currentUser.uid);

                if (!isSubscriptionValid || !canUse) {
                    const confirmUpgrade = confirm(
                        '⏰ 구독 기간이 만료되었습니다\n\n' +
                        '계속 이용하시려면 플랜을 업그레이드해주세요.\n\n' +
                        '✅ Basic: 월 ₩19,900 (무제한 검색)\n' +
                        '✅ Pro: 월 ₩29,900 (무제한 검색 + AI 고급 기능)\n\n' +
                        '대시보드로 이동하시겠습니까?'
                    );
                    const updatedUser = { ...currentUser, plan: 'free' };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    if (confirmUpgrade) {
                        setIsUserDashboardOpen(true);
                    }
                    return;
                }
            } catch (error) {
                console.error('구독 상태 확인 오류:', error);
                alert('⚠️ 구독 상태를 확인하는 중 오류가 발생했습니다.');
                return;
            }
        }

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

    const handleNaverAnalyzeCompetition = async (keywordsToAnalyze: NaverKeywordData[]) => {
        if (!keywordsToAnalyze || keywordsToAnalyze.length === 0) return;

        setNaverAnalyzing(true);
        setNaverKeywordsError(null);

        try {
            console.log('[DEBUG] 경쟁도 분석 시작:', keywordsToAnalyze.length, '개 키워드');

            const result = await analyzeNaverCompetition(keywordsToAnalyze);

            console.log('[DEBUG] 경쟁도 분석 완료:', result);

            // result가 배열인 경우와 객체인 경우 모두 처리
            let analyzedData: NaverKeywordData[];
            let filename: string = '';

            if (Array.isArray(result)) {
                // 이전 버전 호환성: 배열만 반환하는 경우
                analyzedData = result;
                const now = new Date();
                filename = `키워드분석_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.xlsx`;
            } else {
                // 새 버전: data와 filename을 포함한 객체 반환
                analyzedData = result.data || result;
                filename = result.filename || '';
            }

            console.log('[DEBUG] 분석된 데이터:', analyzedData.length, '개');
            console.log('[DEBUG] 첫 번째 키워드 데이터:', analyzedData[0]);

            // 전체 데이터에서 분석된 키워드만 업데이트
            if (naverKeywords) {
                const updatedKeywords = naverKeywords.map(keyword => {
                    const analyzed = analyzedData.find(a => a.연관키워드 === keyword.연관키워드);
                    return analyzed || keyword;
                });
                console.log('[DEBUG] 업데이트된 키워드:', updatedKeywords.length, '개');
                setNaverKeywords(updatedKeywords);
            }

            if (filename) {
                setNaverExcelFilename(filename);
            }
        } catch (err) {
            console.error('[ERROR] 경쟁도 분석 오류:', err);
            if (err instanceof Error) {
                setNaverKeywordsError(err.message);
            } else {
                setNaverKeywordsError('네이버 경쟁 분석 중 알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            setNaverAnalyzing(false);
        }
    };

    const handleNaverExcelDownload = (filename: string) => {
        downloadExcel(filename);
    };

    const handleSaveNaverApiKeys = async (keys: NaverApiKeys) => {
        setNaverApiKeys(keys);
        localStorage.setItem('naverApiKeys', JSON.stringify(keys));

        // 관리자 계정인 경우 Firebase에도 저장
        if (currentUser && currentUser.uid) {
            try {
                await saveNaverApiKeys(currentUser.uid, keys);
                alert('✅ 네이버 API 키가 저장되었습니다! (Firebase 동기화 완료)');
            } catch (error) {
                console.error('Error saving to Firebase:', error);
                alert('✅ 네이버 API 키가 로컬에 저장되었습니다. (Firebase 동기화 실패)');
            }
        } else {
            alert('✅ 네이버 API 키가 로컬에 저장되었습니다!');
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

        setNaverKeywords(null);
        setNaverKeywordsError(null);
        setNaverKeywordsLoading(false);
        setNaverAnalyzing(false);
        setNaverExcelFilename('');
    };

    const getWelcomeMessage = () => {
        if (feature === 'keywords') return "분석할 키워드를 입력하고 '키워드 검색' 버튼을 눌러주세요.";
        if (feature === 'related-keywords') return "Google SERP를 분석하고 콘텐츠 전략을 수립할 기준 키워드를 입력해주세요.";
        if (feature === 'blogs') return "상위 10개 포스트를 조회할 키워드를 입력해주세요.";
        if (feature === 'sustainable-topics') return "하나의 키워드를 다양한 관점으로 확장할 '4차원 주제발굴'을 진행할 키워드를 입력해주세요.";
        if (feature === 'naver-keyword-analysis') {
            // SaaS 모드에서만 무료 체험 관련 메시지 표시
            if (config.mode === 'saas') {
                if (!naverApiKeys && !naverTrialUsed) {
                    return "🎁 무료 체험 1회 제공! 네이버 광고 API 기반 키워드 분석을 무료로 체험해보세요.";
                } else if (!naverApiKeys && naverTrialUsed) {
                    return "네이버 광고 API 기반 키워드 분석을 계속 이용하시려면 API 키를 설정해주세요.";
                }
            }
            return "네이버 광고 API 기반 키워드 분석을 시작할 키워드를 입력해주세요.";
        }
        return "";
    }
    
    const getNoResultsMessage = () => {
        if (feature === 'keywords') return "해당 키워드에 대한 자동완성검색어를 찾을 수 없습니다.";
        if (feature === 'related-keywords') return "해당 키워드에 대한 SERP 데이터(관련 검색어, PAA)를 찾을 수 없습니다.";
        if (feature === 'blogs') return "해당 키워드에 대한 블로그 포스트를 찾을 수 없습니다.";
        if (feature === 'sustainable-topics') return "해당 키워드에 대한 '4차원 주제발굴'을 진행할 수 없습니다.";
        if (feature === 'naver-keyword-analysis') return "해당 키워드에 대한 네이버 키워드 분석 결과를 찾을 수 없습니다.";
        return "키워드 경쟁력 분석 결과를 가져올 수 없습니다. 다른 키워드로 시도해보세요.";
    }

    const anyLoading = loading || recoLoading || sustainableTopicsLoading || promptResultLoading || naverKeywordsLoading || naverAnalyzing;

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
                                <ApiKeySettings
                                    onApiKeyUpdate={handleApiKeyUpdate}
                                    onNaverApiKeyUpdate={handleSaveNaverApiKeys}
                                />
                            </div>
                        ) : (
                            <div>
                                {currentUser ? (
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '1rem'
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
                                        {/* API Settings for logged-in users */}
                                        <ApiKeySettings
                                            onApiKeyUpdate={handleApiKeyUpdate}
                                            onNaverApiKeyUpdate={handleSaveNaverApiKeys}
                                        />
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
                        padding: '1.5rem',
                        borderBottom: '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                    }}>
                        <h1 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            margin: '0 0 0.5rem 0',
                            color: '#2563eb',
                            letterSpacing: '-0.025em',
                            textAlign: 'center'
                        }}>
                            Keyword Insight Pro
                        </h1>

                        <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0,
                            fontWeight: '500'
                        }}>
                            Advanced SEO Research Platform
                        </p>
                    </div>

                    {/* 모바일 안내 메시지 */}
                    {isMobile && (
                        <div style={{
                            padding: '1rem',
                            background: '#fffbeb',
                            borderBottom: '1px solid #fbbf24',
                            textAlign: 'center'
                        }}>
                            <p style={{
                                margin: '0 0 0.5rem 0',
                                color: '#92400e',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                            }}>
                                📱 모바일 환경 안내
                            </p>
                            <p style={{
                                margin: 0,
                                color: '#78350f',
                                fontSize: '0.85rem',
                                lineHeight: '1.4'
                            }}>
                                최적의 사용 경험을 위해 <strong>PC 환경</strong>을 권장합니다.<br/>
                                모바일에서는 일부 기능이 제한될 수 있습니다.
                            </p>
                        </div>
                    )}

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

                            {/* Menu - Admin sees all buttons, Users see dropdown */}
                            {currentUser?.role === 'admin' ? (
                                // Admin view - show all buttons
                                <>
                                    <button
                                        onClick={() => navigate('/courses')}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
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
                                        <span>🎓</span>
                                        <span>강의</span>
                                    </button>

                                    <button
                                        onClick={() => setIsVideoTutorialsOpen(true)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
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
                                            boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(124, 58, 237, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(124, 58, 237, 0.2)';
                                        }}
                                    >
                                        <span>🎬</span>
                                        <span>영상강의</span>
                                    </button>

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
                                        <span>기능사용법</span>
                                    </button>
                                </>
                            ) : (
                                // User view - show dropdown menu
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
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
                                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
                                        }}
                                    >
                                        <span>☰</span>
                                        <span>메뉴</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isMenuDropdownOpen && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                marginTop: '0.5rem',
                                                background: '#ffffff',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                                overflow: 'hidden',
                                                minWidth: '200px',
                                                zIndex: 1000
                                            }}
                                        >
                                            <button
                                                onClick={() => {
                                                    navigate('/courses');
                                                    setIsMenuDropdownOpen(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem 1rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    color: '#374151',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#f3f4f6';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <span>🎓</span>
                                                <span>강의</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsVideoTutorialsOpen(true);
                                                    setIsMenuDropdownOpen(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem 1rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    color: '#374151',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#f3f4f6';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <span>🎬</span>
                                                <span>영상강의</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsHelpModalOpen(true);
                                                    setIsMenuDropdownOpen(false);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem 1rem',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    color: '#374151',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#f3f4f6';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <span>📚</span>
                                                <span>기능사용법</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    {recommendedKeywords && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                            <RecommendedKeywordsDisplay data={recommendedKeywords} onGenerateBlogPost={handleGenerateBlogPost} />

                                            {/* 오늘의 글감 블로그 글쓰기 결과 */}
                                            {blogPostLoading && <LoadingSpinner />}
                                            {blogPostError && <ErrorMessage message={blogPostError} />}
                                            {blogPost && <BlogPostDisplay title={blogPost.title} content={blogPost.content} format={blogPost.format} platform={blogPost.platform} schemaMarkup={blogPost.schemaMarkup} htmlPreview={blogPost.htmlPreview} metadata={blogPost.metadata} />}
                                        </div>
                                    )}

                                    {!recoLoading && !recoError && !recommendedKeywords && (
                                        <>
                                            {(loading || sustainableTopicsLoading) && <LoadingSpinner />}
                                            {error && <ErrorMessage message={error} />}
                                            {sustainableTopicsError && <ErrorMessage message={sustainableTopicsError} />}
                                            
                                            {!loading && !error && !sustainableTopicsLoading && !sustainableTopicsError &&(
                                                <>
                                                    {isCompetitionResult(results) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                            <CompetitionAnalysisResults data={results[0]} onGenerateBlogPost={handleGenerateBlogPostFromStrategy} />

                                                            {/* 경쟁력 분석 블로그 글쓰기 결과 */}
                                                            {blogPostLoading && <LoadingSpinner />}
                                                            {blogPostError && <ErrorMessage message={blogPostError} />}
                                                            {blogPost && <BlogPostDisplay title={blogPost.title} content={blogPost.content} format={blogPost.format} platform={blogPost.platform} schemaMarkup={blogPost.schemaMarkup} htmlPreview={blogPost.htmlPreview} metadata={blogPost.metadata} />}
                                                        </div>
                                                    )}
                                                    {isBlogResults(results) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                            <BlogResultsTable data={results} />
                                                            {strategyLoading && <LoadingSpinner />}
                                                            {strategyError && <ErrorMessage message={strategyError} />}
                                                            {blogStrategy && <BlogStrategyReport data={blogStrategy} onGenerateBlogPost={handleGenerateBlogPostFromStrategy} />}

                                                            {/* Strategy 블로그 글쓰기 결과 - BlogStrategy 바로 아래에 표시 */}
                                                            {blogPostLoading && <LoadingSpinner />}
                                                            {blogPostError && <ErrorMessage message={blogPostError} />}
                                                            {blogPost && <BlogPostDisplay title={blogPost.title} content={blogPost.content} format={blogPost.format} platform={blogPost.platform} schemaMarkup={blogPost.schemaMarkup} htmlPreview={blogPost.htmlPreview} metadata={blogPost.metadata} />}
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
                                                            {paaBlogPost && <BlogPostDisplay title={paaBlogPost.title} content={paaBlogPost.content} format={paaBlogPost.format} platform={paaBlogPost.platform} schemaMarkup={paaBlogPost.schemaMarkup} htmlPreview={paaBlogPost.htmlPreview} metadata={paaBlogPost.metadata} />}
                                                            
                                                            {serpStrategyLoading && <LoadingSpinner />}
                                                            {serpStrategyError && <ErrorMessage message={serpStrategyError} />}
                                                            {serpStrategy && <SerpStrategyReport data={serpStrategy} onGenerateBlogPost={handleGenerateBlogPostFromSerp} />}
                                                            
                                                            {/* SERP 블로그 글쓰기 결과 - SERP 전략 바로 아래에 표시 */}
                                                            {serpBlogPostLoading && <LoadingSpinner />}
                                                            {serpBlogPostError && <ErrorMessage message={serpBlogPostError} />}
                                                            {serpBlogPost && <BlogPostDisplay title={serpBlogPost.title} content={serpBlogPost.content} format={serpBlogPost.format} platform={serpBlogPost.platform} schemaMarkup={serpBlogPost.schemaMarkup} htmlPreview={serpBlogPost.htmlPreview} metadata={serpBlogPost.metadata} />}
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
                                                            {blogPost && <BlogPostDisplay title={blogPost.title} content={blogPost.content} format={blogPost.format} platform={blogPost.platform} schemaMarkup={blogPost.schemaMarkup} htmlPreview={blogPost.htmlPreview} metadata={blogPost.metadata} />}
                                                        </div>
                                                    )}
                                                    {sustainableTopics && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                            <SustainableTopicsResults
                                                                data={sustainableTopics}
                                                                onGenerateBlogPost={handleGenerateBlogPostFromSustainable}
                                                            />

                                                            {/* 4차원 주제발굴 글쓰기 결과 */}
                                                            {blogPostLoading && <LoadingSpinner />}
                                                            {blogPostError && <ErrorMessage message={blogPostError} />}
                                                            {blogPost && <BlogPostDisplay title={blogPost.title} content={blogPost.content} format={blogPost.format} platform={blogPost.platform} schemaMarkup={blogPost.schemaMarkup} htmlPreview={blogPost.htmlPreview} metadata={blogPost.metadata} />}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* 네이버 키워드 분석 결과 */}
                                            {(naverKeywordsLoading || naverAnalyzing) && <LoadingSpinner />}
                                            {naverKeywordsError && <ErrorMessage message={naverKeywordsError} />}
                                            {naverKeywords && naverKeywords.length > 0 && (
                                                <NaverKeywordAnalysis
                                                    data={naverKeywords}
                                                    onDownload={handleNaverExcelDownload}
                                                    filename={naverExcelFilename}
                                                    onAnalyzeCompetition={handleNaverAnalyzeCompetition}
                                                    analyzing={naverAnalyzing}
                                                />
                                            )}

                                            {initialLoad && !anyLoading && !error && !recommendedKeywords && !sustainableTopicsError && !naverKeywordsError && (
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
                                            {!initialLoad && results.length === 0 && !sustainableTopics && !naverKeywords && !anyLoading && !error && !recommendedKeywords && !sustainableTopicsError && !naverKeywordsError && (
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

            {/* 관리자 대시보드 모달 */}
            {currentUser && currentUser.role === 'admin' && (
                <AdminDashboard
                    isOpen={isAdminDashboardOpen}
                    onClose={() => setIsAdminDashboardOpen(false)}
                    onRefresh={adminRefreshTrigger}
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
                    onApiKeyUpdate={handleApiKeyUpdate}
                    onNaverApiKeyUpdate={handleSaveNaverApiKeys}
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

            {/* 블로그 글쓰기 모달 */}
            <BlogWritingModal
                isOpen={isBlogWritingModalOpen}
                onClose={() => {
                    setIsBlogWritingModalOpen(false);
                    setPendingBlogWrite(null);
                }}
                onConfirm={(options) => {
                    setIsBlogWritingModalOpen(false);

                    // pendingBlogWrite.type에 따라 적절한 executor 호출
                    if (pendingBlogWrite) {
                        switch (pendingBlogWrite.type) {
                            case 'topic':
                                executeGenerateBlogPost(pendingBlogWrite.data, options);
                                break;
                            case 'strategy':
                                executeGenerateBlogPostFromStrategy(pendingBlogWrite.data, options);
                                break;
                            case 'sustainable':
                                executeGenerateBlogPostFromSustainable(pendingBlogWrite.data, options);
                                break;
                            case 'serp':
                                executeGenerateBlogPostFromSerp(pendingBlogWrite.data, options);
                                break;
                            case 'paa':
                                executeGenerateBlogPostFromPaa(pendingBlogWrite.data, options);
                                break;
                        }
                        setPendingBlogWrite(null);
                    }
                }}
                platform={pendingBlogWrite?.data?.platform || 'naver'}
            />

            {/* 영상 강의 모달 */}
            {isVideoTutorialsOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '1400px',
                        maxHeight: '90vh',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#ffffff',
                                margin: 0
                            }}>
                                사용법 및 강의 영상
                            </h2>
                            <button
                                onClick={() => setIsVideoTutorialsOpen(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    color: '#ffffff',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}
                            >
                                닫기
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            background: '#f9fafb'
                        }}>
                            <VideoTutorials />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;