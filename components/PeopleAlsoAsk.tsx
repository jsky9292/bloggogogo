
import React, { useState } from 'react';
import type { PaaItem } from '../types';
import CopyButton from './CopyButton';

interface PeopleAlsoAskProps {
    data: PaaItem[];
    onGenerateBlogPost?: (item: PaaItem & { platform: 'naver' | 'google' }) => void;
}

const PeopleAlsoAsk: React.FC<PeopleAlsoAskProps> = ({ data, onGenerateBlogPost }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (!data || data.length === 0) {
        return null;
    }

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const formatAllDataForCopy = () => {
        let text = "[다른 사람들이 함께 찾는 질문 (People Also Ask)]\n\n";
        data.forEach((item, index) => {
            text += `${index + 1}. 질문: ${item.question}\n`;
            text += `   - 답변: ${item.answer}\n`;
            text += `   - 콘텐츠 갭 분석: ${item.content_gap_analysis}\n\n`;
        });
        return text.trim();
    };

    return (
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-800 animate-fade-in space-y-4">
            <h3 className="flex items-center justify-between text-lg font-bold text-yellow-400">
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="ml-2">다른 사람들이 함께 찾는 질문 (PAA)</span>
                </span>
                <CopyButton textToCopy={formatAllDataForCopy()} />
            </h3>
            <div className="space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleAccordion(index)}
                            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
                            aria-expanded={openIndex === index}
                        >
                            <span className="font-bold text-cyan-300">{item.question}</span>
                            <svg
                                className={`w-5 h-5 text-slate-400 transform transition-transform shrink-0 ${openIndex === index ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        {openIndex === index && (
                            <div className="p-4 border-t border-gray-700 bg-black animate-fade-in space-y-4">
                                <div className="flex justify-between -mb-2">
                                    <div className="flex gap-2">
                                        {onGenerateBlogPost && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('PAA Naver button clicked');
                                                        console.log('Item:', item);
                                                        console.log('onGenerateBlogPost exists:', !!onGenerateBlogPost);
                                                        
                                                        try {
                                                            if (onGenerateBlogPost) {
                                                                onGenerateBlogPost({ ...item, platform: 'naver' });
                                                                console.log('Called onGenerateBlogPost successfully for Naver');
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
                                                        console.log('PAA Google button clicked');
                                                        console.log('Item:', item);
                                                        console.log('onGenerateBlogPost exists:', !!onGenerateBlogPost);
                                                        
                                                        try {
                                                            if (onGenerateBlogPost) {
                                                                onGenerateBlogPost({ ...item, platform: 'google' });
                                                                console.log('Called onGenerateBlogPost successfully for Google');
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
                                    <CopyButton textToCopy={`질문: ${item.question}\n답변: ${item.answer}\n콘텐츠 갭 분석: ${item.content_gap_analysis}`} />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold mb-1">AI 요약 답변:</p>
                                    <div
                                        className="text-white whitespace-pre-wrap leading-relaxed text-sm"
                                        style={{
                                            lineHeight: '1.8'
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: `
                                                <style>
                                                    table {
                                                        background: #1f2937 !important;
                                                        color: #e5e7eb !important;
                                                        border: 1px solid #374151 !important;
                                                        margin: 1rem 0;
                                                    }
                                                    th, td {
                                                        padding: 8px !important;
                                                        border: 1px solid #374151 !important;
                                                        color: #f3f4f6 !important;
                                                        background: #1f2937 !important;
                                                    }
                                                    th {
                                                        background: #374151 !important;
                                                        font-weight: bold;
                                                    }
                                                </style>
                                                ${item.answer}
                                            `
                                        }}
                                    />
                                </div>
                                <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                                    <p className="text-yellow-300 text-sm font-bold mb-1 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        콘텐츠 갭 분석 (공략 포인트)
                                    </p>
                                    <p className="text-yellow-200 whitespace-pre-wrap leading-relaxed text-sm pl-7">{item.content_gap_analysis}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PeopleAlsoAsk;