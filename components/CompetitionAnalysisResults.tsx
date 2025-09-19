
import React, { useState } from 'react';
import type { KeywordMetrics } from '../types';
import CopyButton from './CopyButton';

const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
};

const formatTextWithBold = (text: string) => {
    if (!text) return null;
    const parts = text.split('**');
    return (
        <>
            {parts.map((part, index) => 
                index % 2 === 1 ? <b key={index} className="font-bold text-cyan-300">{part}</b> : <span key={index}>{part}</span>
            )}
        </>
    );
};

const formatNumberWithUnit = (num: number): string => {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return num.toLocaleString();
};

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const color = getScoreColor(score);
    const circumference = 2 * Math.PI * 45;
    const [offset, setOffset] = useState(circumference);

    React.useEffect(() => {
        const progress = score / 100;
        const newOffset = circumference - progress * circumference;
        const timer = setTimeout(() => setOffset(newOffset), 100);
        return () => clearTimeout(timer);
    }, [score, circumference]);

    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-slate-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                <circle
                    className={color}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${color}`}>
                {score}
            </div>
        </div>
    );
};

const MetricCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center ${className}`}>
        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">{title}</h3>
        {children}
    </div>
);

interface BlogTopicProps {
    topics: { title: string; description: string }[];
    onGenerateBlogPost?: (topic: { title: string; strategy: string; platform: 'naver' | 'google' }) => void;
}

const SeoStrategyAccordion: React.FC<BlogTopicProps> = ({ topics, onGenerateBlogPost }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="space-y-2">
            {topics.map((topic, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleAccordion(index)}
                        className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-700/50 transition-colors"
                        aria-expanded={openIndex === index}
                    >
                        <span className="font-bold text-cyan-300">{index + 1}. {topic.title}</span>
                        <svg
                            className={`w-5 h-5 text-slate-400 transform transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>
                    {openIndex === index && (
                        <div className="p-4 border-t border-slate-700 bg-slate-900/50 animate-fade-in">
                            <div className="flex justify-between mb-2">
                                <div className="flex gap-2">
                                    {onGenerateBlogPost && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onGenerateBlogPost({
                                                        title: topic.title,
                                                        strategy: topic.description,
                                                        platform: 'naver'
                                                    });
                                                }}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                                                title="네이버 블로그용 글 작성"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                네이버 글쓰기
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onGenerateBlogPost({
                                                        title: topic.title,
                                                        strategy: topic.description,
                                                        platform: 'google'
                                                    });
                                                }}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                                                title="구글 SEO용 글 작성"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                구글 글쓰기
                                            </button>
                                        </>
                                    )}
                                </div>
                                <CopyButton textToCopy={`제목: ${topic.title}\n\n공략법: ${topic.description}`} />
                            </div>
                            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">{topic.description}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const AnalysisSection: React.FC<{ title: string; icon: React.ReactNode; colorClass: string; content: string; }> = ({ title, icon, colorClass, content }) => (
    <div>
         <h4 className={`flex items-center text-lg font-bold mb-3 ${colorClass}`}>
            {icon}
            <span className="ml-2">{title}</span>
        </h4>
        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm space-y-2 pl-8">
            {formatTextWithBold(content)}
        </div>
    </div>
);

interface CompetitionAnalysisResultsProps {
    data: KeywordMetrics;
    onGenerateBlogPost?: (topic: { title: string; strategy: string; platform: 'naver' | 'google' }) => void;
}

const CompetitionAnalysisResults: React.FC<CompetitionAnalysisResultsProps> = ({ data, onGenerateBlogPost }) => {

    const formatAllDataForCopy = () => {
        let text = `[키워드: ${data.keyword} SEO 전문가 종합 분석]\n\n`;
        text += `== 종합 점수 및 지표 ==\n`;
        text += `- 성공 가능성 점수: ${data.opportunityScore}\n`;
        text += `- 검색 관심도 지수: ${data.searchVolumeEstimate}\n`;
        text += `- 경쟁 난이도 지수: ${data.competitionScore}\n`;
        text += `- 총 문서 노출 수: ${data.documentCount.toLocaleString()}\n`;
        text += `- 키워드 길이: ${data.keywordLength}\n`;
        text += `- 단어 수: ${data.wordCount}\n\n`;
        
        text += `== 상세 분석 ==\n`;
        text += `제목: ${data.analysis.title}\n`;
        text += `점수 산정 이유: ${data.analysis.reason}\n\n`;
        text += `기회 요인:\n${data.analysis.opportunity}\n\n`;
        text += `위협 요인:\n${data.analysis.threat}\n\n`;
        text += `소비 현황 및 최신 이슈:\n${data.analysis.consumptionAndIssues}\n\n`;
        text += `최종 결론 및 전략:\n${data.analysis.conclusion}\n\n`;

        if (data.strategy && data.strategy.expandedKeywords.length > 0) {
            text += `== SEO 공략 전략 ==\n`;
            text += `확장 키워드: ${data.strategy.expandedKeywords.join(', ')}\n\n`;
            text += `추천 블로그 제목 및 공략법:\n`;
            data.strategy.blogTopics.forEach((topic, index) => {
                text += `${index + 1}. ${topic.title}\n`;
                text += `   - 공략법: ${topic.description}\n\n`;
            });
        }
        
        return text.trim();
    };

    return (
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-800 animate-fade-in space-y-6">
            <header className="flex justify-between items-center">
                 <div className="flex-1"></div>
                 <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-700">
                        <span className="text-gray-400 font-normal">키워드:</span> {data.keyword}
                    </h2>
                    <p className="text-gray-400">SEO 전문가 종합 분석</p>
                 </div>
                 <div className="flex-1 flex justify-end">
                    <CopyButton textToCopy={formatAllDataForCopy()} />
                 </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <MetricCard title="성공 가능성 점수" className="h-auto">
                        <ScoreCircle score={data.opportunityScore} />
                    </MetricCard>
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard title="검색 관심도 지수">
                            <p className={`text-3xl font-bold ${getScoreColor(data.searchVolumeEstimate)}`}>{data.searchVolumeEstimate}</p>
                        </MetricCard>
                        <MetricCard title="경쟁 난이도 지수">
                             <p className={`text-3xl font-bold ${getScoreColor(100 - data.competitionScore)}`}>{data.competitionScore}</p>
                        </MetricCard>
                        <MetricCard title="문서 노출 수">
                            <p className="text-3xl font-bold text-blue-700">{formatNumberWithUnit(data.documentCount)}</p>
                        </MetricCard>
                        <MetricCard title="키워드 길이">
                            <p className="text-3xl font-bold text-blue-700">{data.keywordLength}</p>
                        </MetricCard>
                        <MetricCard title="단어 수" className="col-span-2">
                            <p className="text-3xl font-bold text-blue-700">{data.wordCount}</p>
                        </MetricCard>
                    </div>
                    <div className="text-xs text-gray-400 p-3 bg-gray-900 border border-gray-800 rounded-lg space-y-2">
                        <h4 className="font-bold text-white">포스팅 우선순위 결정 Tip</h4>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>성공 가능성 점수가 70점 이상인 키워드들을 1순위로 분류합니다.</li>
                            <li>50-70점 사이 키워드들은 제안된 확장 키워드를 활용해서 2순위로 분류합니다.</li>
                            <li>점수와 예상 트래픽을 고려해서 주간/월간 포스팅 계획을 수립합니다.</li>
                        </ol>
                    </div>
                </div>

                <div className="lg:col-span-3">
                     <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 h-full space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-blue-700 mb-2">{formatTextWithBold(data.analysis.title)}</h3>
                            <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{formatTextWithBold(data.analysis.reason)}</p>
                        </div>
                        <hr className="border-gray-800" />
                        <AnalysisSection 
                            title="기회 요인" 
                            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"></path></svg>}
                            colorClass="text-green-400"
                            content={data.analysis.opportunity}
                        />
                         <AnalysisSection 
                            title="위협 요인" 
                            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></svg>}
                            colorClass="text-red-400"
                            content={data.analysis.threat}
                        />
                        <AnalysisSection 
                            title="소비 현황 및 최신 이슈"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 16H4v-2h8v2zm0-4H4v-2h8v2zm0-4H4V9h8v2zm0-4H4V5h8v2zm8 8h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V9h6v2zm0-4h-6V5h6v2z"/></svg>}
                            colorClass="text-blue-700"
                            content={data.analysis.consumptionAndIssues}
                        />
                        <AnalysisSection 
                            title="최종 결론 및 전략"
                            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>}
                            colorClass="text-blue-700"
                            content={data.analysis.conclusion}
                        />
                    </div>
                </div>
            </div>

            {data.strategy && data.strategy.expandedKeywords.length > 0 && (
                <div className="bg-gray-900 mt-6 p-6 rounded-lg border border-gray-800">
                    <h3 className="flex items-center text-lg font-bold mb-4 text-yellow-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21v-1m-4.663-2H16.34" /></svg>
                        <span className="ml-2">SEO 공략 전략</span>
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-white mb-2">확장 키워드</h4>
                             <div className="flex flex-wrap gap-2">
                                {data.strategy.expandedKeywords.map((kw, index) => (
                                    <span key={index} className="bg-gray-800 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-bold text-white mb-3">추천 블로그 제목 및 공략법</h4>
                            <SeoStrategyAccordion topics={data.strategy.blogTopics} onGenerateBlogPost={onGenerateBlogPost} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitionAnalysisResults;
