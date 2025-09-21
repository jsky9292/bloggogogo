import React, { useState } from 'react';
import type { SustainableTopicCategory } from '../types';
import CopyButton from './CopyButton';

interface SustainableTopicsResultsProps {
    data: SustainableTopicCategory[];
    onGenerateBlogPost?: (topic: {
        title: string;
        keywords: string[];
        strategy: string;
        category: string;
        platform: 'naver' | 'google';
    }) => void;
}

const SustainableTopicsResults: React.FC<SustainableTopicsResultsProps> = ({ data, onGenerateBlogPost }) => {
    const [openCategory, setOpenCategory] = useState<string | null>(data.length > 0 ? data[0].category : null);

    const toggleCategory = (category: string) => {
        setOpenCategory(openCategory === category ? null : category);
    };

    const formatAllDataForCopy = () => {
        let text = `[4차원 주제발굴]\n\n`;
        data.forEach(categoryItem => {
            text += `== ${categoryItem.category} ==\n\n`;
            categoryItem.suggestions.forEach((suggestion, index) => {
                text += `${index + 1}. 제목: ${suggestion.title}\n`;
                text += `   - 핵심 키워드: ${suggestion.keywords.join(', ')}\n`;
                text += `   - SEO 전략: ${suggestion.strategy}\n\n`;
            });
        });
        return text.trim();
    };

    // 카테고리별 설정
    const getCategoryConfig = (category: string) => {
        const configs: { [key: string]: { icon: string; color: string; bgColor: string; borderColor: string; description: string } } = {
            '즉각적 호기심': {
                icon: '🔥',
                color: 'text-red-400',
                bgColor: 'bg-red-900/20',
                borderColor: 'border-red-800',
                description: '지금 바로 클릭하고 싶은 매력적인 주제'
            },
            '문제 해결': {
                icon: '💡',
                color: 'text-blue-400',
                bgColor: 'bg-blue-900/20',
                borderColor: 'border-blue-800',
                description: '독자의 실질적인 문제를 해결하는 주제'
            },
            '장기적 관심': {
                icon: '📈',
                color: 'text-green-400',
                bgColor: 'bg-green-900/20',
                borderColor: 'border-green-800',
                description: '꾸준히 검색되는 에버그린 콘텐츠'
            },
            '사회적 연결': {
                icon: '🤝',
                color: 'text-purple-400',
                bgColor: 'bg-purple-900/20',
                borderColor: 'border-purple-800',
                description: '공감과 소통을 이끌어내는 주제'
            }
        };
        return configs[category] || {
            icon: '📝',
            color: 'text-gray-400',
            bgColor: 'bg-gray-900/20',
            borderColor: 'border-gray-800',
            description: '다양한 관점의 블로그 주제'
        };
    };

    // 가상의 경쟁도와 트렌드 생성 (실제로는 API에서 받아와야 함)
    const getTopicMetrics = (title: string, category: string) => {
        // 간단한 해시 기반 랜덤 값 생성
        const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const competition = ['낮음', '중간', '높음'][hash % 3];
        const competitionColor = competition === '낮음' ? 'text-green-400' : competition === '중간' ? 'text-yellow-400' : 'text-red-400';

        const trends = ['↑', '↗', '→'][hash % 3];
        const trendColor = trends === '↑' ? 'text-green-400' : trends === '↗' ? 'text-yellow-400' : 'text-gray-400';

        return { competition, competitionColor, trends, trendColor };
    };

    return (
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-800 animate-fade-in space-y-4">
            <h3 className="flex items-center justify-between text-lg font-bold text-yellow-400">
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="ml-2">4차원 주제발굴</span>
                </span>
                <CopyButton textToCopy={formatAllDataForCopy()} />
            </h3>

            {/* 카테고리 카드 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.map((categoryItem) => {
                    const config = getCategoryConfig(categoryItem.category);
                    const isOpen = openCategory === categoryItem.category;

                    return (
                        <div
                            key={categoryItem.category}
                            className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'lg:col-span-2' : ''}`}
                        >
                            <button
                                onClick={() => toggleCategory(categoryItem.category)}
                                className={`w-full text-left p-4 hover:bg-black/30 transition-colors`}
                                aria-expanded={isOpen}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{config.icon}</span>
                                            <span className={`font-bold text-lg ${config.color}`}>
                                                {categoryItem.category}
                                            </span>
                                            <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">
                                                {categoryItem.suggestions.length}개 주제
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm">{config.description}</p>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transform transition-transform mt-1 ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="p-4 border-t-2 border-gray-800 bg-black/50 animate-fade-in">
                                    <div className="space-y-4">
                                        {categoryItem.suggestions.map((suggestion, sIndex) => {
                                            const metrics = getTopicMetrics(suggestion.title, categoryItem.category);

                                            return (
                                                <div
                                                    key={sIndex}
                                                    className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className={`font-bold ${config.color} text-md flex-1 pr-2`}>
                                                            {sIndex + 1}. {suggestion.title}
                                                        </h4>
                                                        <div className="flex gap-2">
                                                            {onGenerateBlogPost && (
                                                                <>
                                                                    <button
                                                                        onClick={() => onGenerateBlogPost({
                                                                            title: suggestion.title,
                                                                            keywords: suggestion.keywords,
                                                                            strategy: suggestion.strategy,
                                                                            category: categoryItem.category,
                                                                            platform: 'naver'
                                                                        })}
                                                                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-all flex items-center gap-1"
                                                                        title="네이버 블로그용 글 작성"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                                        </svg>
                                                                        네이버
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onGenerateBlogPost({
                                                                            title: suggestion.title,
                                                                            keywords: suggestion.keywords,
                                                                            strategy: suggestion.strategy,
                                                                            category: categoryItem.category,
                                                                            platform: 'google'
                                                                        })}
                                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-all flex items-center gap-1"
                                                                        title="구글 SEO용 글 작성"
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                                        </svg>
                                                                        구글
                                                                    </button>
                                                                </>
                                                            )}
                                                            <CopyButton textToCopy={`제목: ${suggestion.title}\n핵심 키워드: ${suggestion.keywords.join(', ')}\nSEO 전략: ${suggestion.strategy}`} />
                                                        </div>
                                                    </div>

                                                    {/* 지표 표시 */}
                                                    <div className="flex gap-4 mb-3">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 text-xs">경쟁도:</span>
                                                            <span className={`text-xs font-bold ${metrics.competitionColor}`}>
                                                                {metrics.competition}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-gray-500 text-xs">트렌드:</span>
                                                            <span className={`text-xs font-bold ${metrics.trendColor}`}>
                                                                {metrics.trends}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* 키워드 태그 */}
                                                    <div className="mb-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {suggestion.keywords.map((kw, kwIndex) => (
                                                                <span
                                                                    key={kwIndex}
                                                                    className={`bg-gray-800 ${config.color} text-xs font-medium px-2 py-1 rounded-full`}
                                                                >
                                                                    #{kw}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* SEO 전략 */}
                                                    <div className="mt-3">
                                                        <p className="text-gray-400 text-xs font-bold mb-1">📍 SEO 전략:</p>
                                                        <p className="text-gray-300 text-xs leading-relaxed">
                                                            {suggestion.strategy}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 사용 팁 */}
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg">
                <p className="text-xs text-blue-300">
                    💡 <strong>Tip:</strong> 각 카테고리는 독자의 검색 의도를 반영합니다.
                    <span className="text-red-400"> 즉각적 호기심</span>은 바이럴 가능성이 높고,
                    <span className="text-green-400"> 장기적 관심</span>은 꾸준한 트래픽을 보장합니다.
                </p>
            </div>
        </div>
    );
};

export default SustainableTopicsResults;