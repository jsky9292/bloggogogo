
import React, { useState } from 'react';
import type { GeneratedTopic } from '../types';
import CopyButton from './CopyButton';

interface BlogTopicSuggestionsProps {
    title: string;
    data: GeneratedTopic[];
    onGenerateBlogPost?: (topic: GeneratedTopic) => void;
}

const BlogTopicSuggestions: React.FC<BlogTopicSuggestionsProps> = ({ title, data, onGenerateBlogPost }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const formatAllDataForCopy = () => {
        let text = `[${title}]\n\n`;
        data.forEach((topic, index) => {
            text += `${index + 1}. 제목: ${topic.title}\n`;
            text += `   - 썸네일 문구: ${topic.thumbnailCopy}\n`;
            text += `   - 공략법: ${topic.strategy}\n\n`;
        });
        return text.trim();
    };

    return (
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-800 animate-fade-in space-y-4">
            <h3 className="flex items-center justify-between text-lg font-bold text-yellow-400">
                <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21v-1m-4.663-2H16.34" /></svg>
                    <span className="ml-2">{title}</span>
                </span>
                <CopyButton textToCopy={formatAllDataForCopy()} />
            </h3>
            <div className="space-y-2">
                {data.map((topic, index) => (
                    <div key={topic.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleAccordion(index)}
                            className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
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
                            <div className="p-4 border-t border-gray-700 bg-black animate-fade-in space-y-4">
                                <div className="flex justify-between -mb-2">
                                    <div className="flex gap-2">
                                        {onGenerateBlogPost && (
                                            <>
                                                <button
                                                    onClick={() => onGenerateBlogPost({ ...topic, platform: 'naver' })}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                                                    title="네이버 블로그용 글 작성"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                    네이버 글쓰기
                                                </button>
                                                <button
                                                    onClick={() => onGenerateBlogPost({ ...topic, platform: 'google' })}
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
                                    <CopyButton textToCopy={`제목: ${topic.title}\n썸네일 문구: ${topic.thumbnailCopy}\n공략법: ${topic.strategy}`} />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold mb-1">썸네일 문구:</p>
                                    <p className="text-yellow-300 whitespace-pre-wrap text-sm font-semibold bg-gray-900 p-2 rounded-md">{topic.thumbnailCopy}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm font-bold mb-1">공략법:</p>
                                    <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{topic.strategy}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlogTopicSuggestions;
