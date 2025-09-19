
import React, { useState } from 'react';
import type { SerpStrategyReportData } from '../types';
import CopyButton from './CopyButton';

const AnalysisCard: React.FC<{ title: string; content: string; icon: JSX.Element }> = ({ title, content, icon }) => (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 h-full">
        <h4 className="flex items-center text-md font-bold text-cyan-300 mb-2">
            {icon}
            <span className="ml-2">{title}</span>
        </h4>
        <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{content}</p>
    </div>
);

interface SerpStrategyReportProps {
    data: SerpStrategyReportData;
    onGenerateBlogPost?: (suggestion: { title: string; thumbnailCopy: string; strategy: string; platform: 'naver' | 'google' }) => void;
}

const SerpStrategyReport: React.FC<SerpStrategyReportProps> = ({ data, onGenerateBlogPost }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const formatAllDataForCopy = () => {
        let text = `[AI SERP 분석 기반 콘텐츠 전략]\n\n`;
        text += `== 핵심 분석 ==\n`;
        text += `사용자 핵심 의도: ${data.analysis.userIntent}\n`;
        text += `필러 포스트 제안: ${data.analysis.pillarPostSuggestion}\n\n`;
        
        text += `== 세부 콘텐츠 제안 (${data.suggestions.length}개) ==\n\n`;
        data.suggestions.forEach((suggestion, index) => {
            text += `${index + 1}. 제목: ${suggestion.title}\n`;
            text += `   - 썸네일 문구: ${suggestion.thumbnailCopy}\n`;
            text += `   - 공략법: ${suggestion.strategy}\n\n`;
        });
        
        return text.trim();
    };

    return (
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-800 animate-fade-in space-y-6">
            <h3 className="flex items-center justify-between text-lg font-bold text-green-400">
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span className="ml-2">AI SERP 분석 기반 콘텐츠 전략</span>
                </span>
                <CopyButton textToCopy={formatAllDataForCopy()} />
            </h3>

            <div className="space-y-4">
                 <h4 className="text-white font-bold">핵심 분석</h4>
                 <div className="grid md:grid-cols-2 gap-4">
                    <AnalysisCard 
                        title="사용자 핵심 의도" 
                        content={data.analysis.userIntent}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    />
                    <AnalysisCard 
                        title="필러 포스트(Pillar Post) 제안" 
                        content={data.analysis.pillarPostSuggestion}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    />
                 </div>
            </div>

            <div>
                 <h4 className="text-white font-bold mb-3">세부 콘텐츠 제안 (10개)</h4>
                 <div className="space-y-2">
                     {data.suggestions.map((suggestion, index) => (
                        <div key={suggestion.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleAccordion(index)}
                                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
                                aria-expanded={openIndex === index}
                                aria-controls={`serp-suggestion-content-${index}`}
                            >
                                <span className="font-bold text-cyan-300 flex-1 pr-4">{index + 1}. {suggestion.title}</span>
                                <svg
                                    className={`w-5 h-5 text-slate-400 transform transition-transform shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                            {openIndex === index && (
                                <div id={`serp-suggestion-content-${index}`} className="p-4 border-t border-gray-700 bg-black animate-fade-in space-y-4">
                                    <div className="flex justify-between -mb-2">
                                        <div className="flex gap-2">
                                            {onGenerateBlogPost && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('SERP Naver button clicked');
                                                            console.log('Suggestion:', suggestion);
                                                            console.log('onGenerateBlogPost exists:', !!onGenerateBlogPost);
                                                            
                                                            const payload = { 
                                                                title: suggestion.title,
                                                                thumbnailCopy: suggestion.thumbnailCopy,
                                                                strategy: suggestion.strategy,
                                                                platform: 'naver' as const
                                                            };
                                                            console.log('Payload:', payload);
                                                            
                                                            try {
                                                                if (onGenerateBlogPost) {
                                                                    onGenerateBlogPost(payload);
                                                                    console.log('Called onGenerateBlogPost successfully');
                                                                } else {
                                                                    console.error('onGenerateBlogPost is undefined');
                                                                }
                                                            } catch (error) {
                                                                console.error('Error calling onGenerateBlogPost:', error);
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer relative z-50"
                                                        title="네이버 블로그용 글 작성"
                                                        type="button"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        네이버 글쓰기
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            console.log('SERP Google button clicked');
                                                            console.log('Suggestion:', suggestion);
                                                            console.log('onGenerateBlogPost exists:', !!onGenerateBlogPost);
                                                            
                                                            const payload = { 
                                                                title: suggestion.title,
                                                                thumbnailCopy: suggestion.thumbnailCopy,
                                                                strategy: suggestion.strategy,
                                                                platform: 'google' as const
                                                            };
                                                            console.log('Payload:', payload);
                                                            
                                                            try {
                                                                if (onGenerateBlogPost) {
                                                                    onGenerateBlogPost(payload);
                                                                    console.log('Called onGenerateBlogPost successfully');
                                                                } else {
                                                                    console.error('onGenerateBlogPost is undefined');
                                                                }
                                                            } catch (error) {
                                                                console.error('Error calling onGenerateBlogPost:', error);
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer relative z-50"
                                                        title="구글 SEO용 글 작성"
                                                        type="button"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        구글 글쓰기
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <CopyButton textToCopy={`제목: ${suggestion.title}\n썸네일 문구: ${suggestion.thumbnailCopy}\n공략법: ${suggestion.strategy}`} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-bold mb-1">썸네일 문구:</p>
                                        <p className="text-yellow-300 whitespace-pre-wrap text-sm font-semibold bg-gray-900 p-2 rounded-md">{suggestion.thumbnailCopy}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm font-bold mb-1">공략법:</p>
                                        <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{suggestion.strategy}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                     ))}
                 </div>
            </div>
        </div>
    );
};

export default SerpStrategyReport;
