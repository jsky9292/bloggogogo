
import React from 'react';
import type { KeywordMetrics } from '../types';
import CopyButton from './CopyButton';

const MarkdownViewer: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;

    const normalizedText = String(text).replace(/\\n/g, '\n');

    const renderWithBold = (line: string) => {
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-cyan-300">{part.slice(2, -2)}</strong>;
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
        });
    };

    return (
        <div className="space-y-2">
            {normalizedText.split('\n').map((line, index) => {
                const trimmedLine = line.trim();
                
                if (trimmedLine.length === 0) {
                    return <div key={index} className="h-2" />; // Small gap for empty lines
                }

                if (trimmedLine.startsWith('- ')) {
                    return (
                        <div key={index} className="flex items-start pl-4">
                            <span className="text-cyan-400 mr-2 shrink-0">•</span>
                            <span>{renderWithBold(trimmedLine.substring(2))}</span>
                        </div>
                    );
                }

                const orderedMatch = trimmedLine.match(/^(\d+)\.\s/);
                if (orderedMatch) {
                    return (
                        <div key={index} className="flex items-start pl-4">
                            <span className="text-cyan-400 mr-2 shrink-0">{orderedMatch[1]}.</span>
                            <span>{renderWithBold(trimmedLine.substring(orderedMatch[0].length))}</span>
                        </div>
                    );
                }
                
                return <p key={index}>{renderWithBold(line)}</p>;
            })}
        </div>
    );
};

const PromptResultDisplay: React.FC<{ data: KeywordMetrics }> = ({ data }) => {

    const formatAllDataForCopy = () => {
        // The service uses "\\n" for newlines in some fields. Replace them with actual newlines for copy.
        const cleanText = (text: string) => text ? String(text).replace(/\\n/g, '\n') : '';

        let text = `[프롬프트 실행 결과: ${data.analysis.title}]\n\n`;
        text += `== 핵심 키워드 ==\n${data.keyword}\n\n`;
        text += `== 원본 요청 요약 ==\n${cleanText(data.analysis.reason)}\n\n`;
        text += `== AI 생성 결과 ==\n${cleanText(data.analysis.conclusion)}\n\n`;
        text += `== 주요 기회 및 인사이트 ==\n${cleanText(data.analysis.opportunity)}\n\n`;
        text += `== 도전 과제 및 고려사항 ==\n${cleanText(data.analysis.threat)}\n\n`;
        text += `== 정보 활용 방안 ==\n${cleanText(data.analysis.consumptionAndIssues)}\n`;
        return text.trim();
    };

    const AnalysisSection: React.FC<{ title: string; icon: React.ReactNode; content: string; }> = ({ title, icon, content }) => (
        <div>
             <h4 className="flex items-center text-md font-bold text-white mb-2">
                {icon}
                <span className="ml-2">{title}</span>
            </h4>
            <div className="text-white whitespace-pre-wrap leading-relaxed text-sm bg-gray-900 p-3 rounded-md border border-gray-700">
                {content}
            </div>
        </div>
    );

    return (
        <div className="bg-black rounded-lg p-4 sm:p-6 shadow-lg border border-gray-800 animate-fade-in space-y-6">
            <header className="flex justify-between items-start">
                 <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-indigo-400 mb-1">
                        {data.analysis.title}
                    </h2>
                    <p className="text-sm text-gray-400">
                        <span className="font-semibold text-white">핵심 키워드:</span> {data.keyword}
                    </p>
                 </div>
                 <div className="ml-4 flex-shrink-0">
                    <CopyButton textToCopy={formatAllDataForCopy()} />
                 </div>
            </header>

            <div className="space-y-6">
                {/* Main Conclusion Section */}
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                     <h3 className="flex items-center justify-between text-lg font-bold text-cyan-300 mb-3">
                        <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <span className="ml-2">AI 생성 결과</span>
                        </span>
                        <CopyButton textToCopy={String(data.analysis.conclusion).replace(/\\n/g, '\n')} />
                    </h3>
                    <div className="text-white text-base leading-relaxed">
                        <MarkdownViewer text={data.analysis.conclusion} />
                    </div>
                </div>

                {/* Supporting Analysis Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <AnalysisSection
                        title="원본 요청 요약"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2-2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>}
                        content={data.analysis.reason}
                     />
                     <AnalysisSection
                        title="주요 기회 및 인사이트"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 001.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zM4.343 5.757a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM2 10a1 1 0 01-1-1h-1a1 1 0 110-2h1a1 1 0 011 1zM14.95 14.95a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" /></svg>}
                        content={data.analysis.opportunity}
                     />
                      <AnalysisSection
                        title="도전 과제 및 고려사항"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.22 2.829-1.22 3.465 0l6.29 12.143c.64 1.232-.304 2.758-1.733 2.758H3.7c-1.428 0-2.372-1.526-1.732-2.758L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm0-5a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                        content={data.analysis.threat}
                     />
                     <AnalysisSection
                        title="정보 활용 방안"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M12.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" /></svg>}
                        content={data.analysis.consumptionAndIssues}
                     />
                </div>
            </div>
        </div>
    );
};

export default PromptResultDisplay;
