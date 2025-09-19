
import React, { useState } from 'react';
import type { RecommendedKeyword } from '../types';
import CopyButton from './CopyButton';

const RecommendedKeywordsDisplay: React.FC<{ data: RecommendedKeyword[] }> = ({ data }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const formatAllDataForCopy = () => {
        let text = `[오늘의 전략 키워드 분석]\n\n`;
        data.forEach((item, index) => {
            text += `${index + 1}. 키워드: ${item.keyword}\n`;
            text += `   - 선정 이유: ${item.reason}\n`;
            text += `   - 추천 제목: ${item.title}\n`;
            text += `   - 썸네일 문구: ${item.thumbnailCopy}\n`;
            text += `   - 공략법: ${item.strategy}\n\n`;
        });
        return text.trim();
    };


    return (
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-800 animate-fade-in space-y-4">
            <h3 className="flex items-center justify-between text-lg font-bold text-red-400">
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="ml-2">오늘의 전략 키워드 분석</span>
                </span>
                <CopyButton textToCopy={formatAllDataForCopy()} />
            </h3>
            <div className="space-y-2">
                {data.map((item, index) => (
                    <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleAccordion(index)}
                            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
                            aria-expanded={openIndex === index}
                            aria-controls={`reco-content-${index}`}
                        >
                            <span className="font-bold text-cyan-300 text-lg">{index + 1}. {item.keyword}</span>
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
                            <div id={`reco-content-${index}`} className="p-4 border-t border-gray-700 bg-black animate-fade-in space-y-4">
                                <div className="flex justify-end -mb-2">
                                    <CopyButton textToCopy={`키워드: ${item.keyword}\n선정 이유: ${item.reason}\n추천 제목: ${item.title}\n썸네일 문구: ${item.thumbnailCopy}\n공략법: ${item.strategy}`} />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold mb-1">선정 이유:</p>
                                    <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{item.reason}</p>
                                </div>
                                <hr className="border-gray-700" />
                                <div>
                                    <p className="text-gray-400 text-sm font-bold mb-1">추천 제목:</p>
                                    <p className="text-cyan-300 whitespace-pre-wrap text-sm font-semibold">{item.title}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold mb-1">썸네일 문구:</p>
                                    <p className="text-yellow-300 whitespace-pre-wrap text-sm font-semibold bg-gray-900 p-2 rounded-md">{item.thumbnailCopy}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold mb-1">공략법:</p>
                                    <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{item.strategy}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedKeywordsDisplay;
