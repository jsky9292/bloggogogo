import React, { useState } from 'react';
import CopyButton from './CopyButton';

interface BlogPostDisplayProps {
    title: string;
    content: string;
    format: 'html' | 'markdown' | 'text';
    platform: 'naver' | 'google';
    schemaMarkup?: string;
}

const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({ title, content, format, platform, schemaMarkup }) => {
    const [viewMode, setViewMode] = useState<'preview' | 'source' | 'schema'>('preview');

    const renderPreview = () => {
        if (format === 'text') {
            // For Naver plain text format
            return (
                <div className="whitespace-pre-wrap font-sans text-gray-200" style={{ lineHeight: '1.8' }}>
                    {content}
                </div>
            );
        } else if (format === 'html') {
            // For Google HTML format
            const styledContent = `
                <style>
                    .blog-content * { color: #e5e7eb !important; }
                    .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 { color: #60a5fa !important; margin: 1em 0 0.5em 0; font-weight: bold; }
                    .blog-content h1 { font-size: 1.8em; border-bottom: 2px solid #374151; padding-bottom: 0.3em; }
                    .blog-content h2 { font-size: 1.5em; margin-top: 1.5em; }
                    .blog-content h3 { font-size: 1.2em; }
                    .blog-content p { margin: 0.8em 0; line-height: 1.8; }
                    .blog-content ul, .blog-content ol { margin: 0.8em 0; padding-left: 1.5em; }
                    .blog-content li { margin: 0.4em 0; }
                    .blog-content strong, .blog-content b { color: #60a5fa !important; font-weight: bold; }
                    .blog-content em, .blog-content i { color: #93c5fd !important; }
                    .blog-content blockquote { border-left: 3px solid #60a5fa; padding-left: 1em; margin: 1em 0; background: #1f2937; }
                    .blog-content code { background: #1f2937; padding: 0.2em 0.4em; border-radius: 3px; color: #10b981 !important; }
                    .blog-content pre { background: #1f2937; padding: 1em; border-radius: 5px; overflow-x: auto; }
                    .blog-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                    .blog-content th, .blog-content td { border: 1px solid #4b5563; padding: 0.5em; text-align: left; }
                    .blog-content th { background: #1f2937; font-weight: bold; color: #60a5fa !important; }
                    .blog-content a { color: #60a5fa !important; text-decoration: underline; }
                </style>
                ${content}
            `;
            return (
                <div 
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: styledContent }}
                />
            );
        } else {
            // For markdown format (fallback)
            return (
                <div className="whitespace-pre-wrap font-sans text-gray-200" style={{ lineHeight: '1.8' }}>
                    {content}
                </div>
            );
        }
    };

    const getPlatformColor = () => {
        return platform === 'naver' ? 'green' : 'blue';
    };

    const getPlatformLabel = () => {
        return platform === 'naver' ? '네이버 블로그' : '구글 SEO';
    };

    return (
        <div className={`bg-black rounded-lg p-4 sm:p-6 shadow-lg border ${platform === 'naver' ? 'border-green-800' : 'border-blue-800'} animate-fade-in`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${platform === 'naver' ? 'text-green-400' : 'text-blue-400'} flex items-center gap-2`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {getPlatformLabel()} 글 작성 완료
                </h3>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-md shadow-sm" role="group">
                        <button
                            type="button"
                            onClick={() => setViewMode('preview')}
                            className={`px-3 py-1 text-xs font-medium rounded-l-md ${
                                viewMode === 'preview'
                                    ? `bg-${getPlatformColor()}-600 text-white`
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            } transition-colors`}
                        >
                            미리보기
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('source')}
                            className={`px-3 py-1 text-xs font-medium ${
                                viewMode === 'source'
                                    ? `bg-${getPlatformColor()}-600 text-white`
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            } transition-colors`}
                        >
                            소스코드
                        </button>
                        {platform === 'google' && schemaMarkup && (
                            <button
                                type="button"
                                onClick={() => setViewMode('schema')}
                                className={`px-3 py-1 text-xs font-medium rounded-r-md ${
                                    viewMode === 'schema'
                                        ? `bg-${getPlatformColor()}-600 text-white`
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                } transition-colors`}
                            >
                                Schema
                            </button>
                        )}
                    </div>
                    <CopyButton textToCopy={viewMode === 'schema' && schemaMarkup ? schemaMarkup : content} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-yellow-300 font-bold text-lg mb-2">{title}</h4>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${platform === 'naver' ? 'bg-green-800' : 'bg-blue-800'} text-white`}>
                            {getPlatformLabel()}
                        </span>
                        <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">
                            {format === 'text' ? 'Text' : format === 'html' ? 'HTML' : 'Markdown'}
                        </span>
                        <span className="px-2 py-1 rounded bg-gray-700 text-gray-300">
                            {platform === 'naver' ? '1800-2000자' : '2500-3000자'}
                        </span>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {viewMode === 'preview' ? (
                        <div className="text-white">
                            {renderPreview()}
                        </div>
                    ) : viewMode === 'source' ? (
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                            <code>{content}</code>
                        </pre>
                    ) : (
                        <pre className="text-xs text-blue-400 font-mono whitespace-pre-wrap break-words">
                            <code>{schemaMarkup || 'Schema Markup not available'}</code>
                        </pre>
                    )}
                </div>

                {platform === 'naver' && (
                    <div className="bg-gray-900 border border-green-800 rounded-lg p-3 text-xs">
                        <p className="text-green-400 font-bold mb-1">네이버 블로그 최적화 팁:</p>
                        <ul className="text-gray-300 space-y-1 list-disc list-inside">
                            <li>C-rank 로직과 DIA 원칙이 적용되었습니다</li>
                            <li>이미지는 [이미지: 설명] 위치에 추가하세요</li>
                            <li>키워드 밀도가 3-5%로 최적화되었습니다</li>
                        </ul>
                    </div>
                )}

                {platform === 'google' && (
                    <div className="bg-gray-900 border border-blue-800 rounded-lg p-3 text-xs">
                        <p className="text-blue-400 font-bold mb-1">구글 SEO 최적화 팁:</p>
                        <ul className="text-gray-300 space-y-1 list-disc list-inside">
                            <li>E-E-A-T 원칙이 적용되었습니다</li>
                            <li>Featured Snippet을 위한 구조화된 콘텐츠</li>
                            <li>Schema Markup을 추가하여 검색 결과 향상</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPostDisplay;