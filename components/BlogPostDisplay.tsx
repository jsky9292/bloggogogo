import React, { useState } from 'react';
import CopyButton from './CopyButton';

interface BlogPostDisplayProps {
    title: string;
    content: string;
    format: 'html' | 'markdown' | 'text';
    platform: 'naver' | 'google';
    schemaMarkup?: string;
    htmlPreview?: string;
    metadata?: {
        keywords: string;
        imagePrompt: string;
        seoTitles: string[];
    };
}

const BlogPostDisplay: React.FC<BlogPostDisplayProps> = ({ title, content, format, platform, schemaMarkup, htmlPreview, metadata }) => {
    const [viewMode, setViewMode] = useState<'preview' | 'source' | 'schema'>('preview');

    const renderPreview = () => {
        if (format === 'html') {
            // 네이버: htmlPreview 사용 (iframe으로 렌더링)
            if (platform === 'naver' && htmlPreview) {
                return (
                    <iframe
                        srcDoc={htmlPreview}
                        style={{
                            width: '100%',
                            minHeight: '500px',
                            border: 'none',
                            backgroundColor: 'white',
                            borderRadius: '8px'
                        }}
                        title="네이버 블로그 미리보기"
                    />
                );
            }

            // 구글: content를 직접 렌더링 (스타일 적용)
            const previewTableStyle = viewMode === 'preview' ? `
                    .blog-content table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                        margin: 1.5em 0 !important;
                        border: 1px solid #d1d5db !important;
                    }
                    .blog-content th, .blog-content td {
                        border: 1px solid #d1d5db !important;
                        padding: 0.75em !important;
                        text-align: left !important;
                        color: #1f2937 !important;
                        background-color: #ffffff !important;
                    }
                    .blog-content th {
                        font-weight: bold !important;
                        background-color: #f3f4f6 !important;
                        color: #111827 !important;
                        text-align: center !important;
                    }
                    .blog-content table * {
                        color: #1f2937 !important;
                    }
            ` : '';

            const styledContent = `
                <style>
                    .blog-content {
                        background: #ffffff !important;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .blog-content * { color: #1f2937 !important; }
                    .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 { color: #1e40af !important; margin: 1em 0 0.5em 0; font-weight: bold; }
                    .blog-content h1 { font-size: 1.8em; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
                    .blog-content h2 { font-size: 1.5em; margin-top: 1.5em; }
                    .blog-content h3 { font-size: 1.2em; }
                    .blog-content p { margin: 0.8em 0; line-height: 1.8; }
                    .blog-content ul, .blog-content ol { margin: 0.8em 0; padding-left: 1.5em; }
                    .blog-content li { margin: 0.4em 0; }
                    .blog-content strong, .blog-content b { color: #1e40af !important; font-weight: bold; }
                    .blog-content em, .blog-content i { color: #3b82f6 !important; }
                    .blog-content blockquote { border-left: 3px solid #3b82f6; padding-left: 1em; margin: 1em 0; background: #f3f4f6; }
                    .blog-content code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 3px; color: #059669 !important; }
                    .blog-content pre { background: #f3f4f6; padding: 1em; border-radius: 5px; overflow-x: auto; }
                    .blog-content table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 1.5em 0;
                        background: #ffffff !important;
                        border: 1px solid #d1d5db;
                    }
                    .blog-content thead {
                        background: #f3f4f6 !important;
                    }
                    .blog-content th, .blog-content td {
                        border: 1px solid #d1d5db !important;
                        padding: 0.75em !important;
                        text-align: left;
                        color: #1f2937 !important;
                    }
                    .blog-content th {
                        background: #f3f4f6 !important;
                        font-weight: bold;
                        color: #1e40af !important;
                        text-align: center;
                    }
                    .blog-content tbody tr:nth-child(even) {
                        background: #f9fafb !important;
                    }
                    .blog-content tbody tr:hover {
                        background: #eff6ff !important;
                    }
                    .blog-content td {
                        background: #ffffff !important;
                        color: #1f2937 !important;
                    }
                    .blog-content table * {
                        color: #1f2937 !important;
                    }
                    .blog-content table p,
                    .blog-content table span,
                    .blog-content table div,
                    .blog-content table li {
                        color: #1f2937 !important;
                    }
                    .blog-content a { color: #3b82f6 !important; text-decoration: underline; }
                    ${previewTableStyle}
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
                    {platform === 'google' && schemaMarkup && (
                        <button
                            onClick={() => alert('Schema 사용법:\n\n1. Schema 탭을 클릭\n2. 복사 버튼으로 Schema 코드 복사\n3. 블로그 글의 HTML 편집 모드로 전환\n4. <head> 태그 안에 Schema 코드 붙여넣기\n\n또는 글 맨 아래에 붙여넣기도 가능합니다.\n\nSchema는 검색엔진이 콘텐츠를 더 잘 이해하도록 돕는 구조화된 데이터입니다.')}
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                            title="Schema 사용법 보기"
                        >
                            Schema란?
                        </button>
                    )}
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
                            {platform === 'naver' ? '2000-2500자' : '2500-3000자'}
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
                            <li className="text-yellow-300">미리보기 화면을 마우스로 드래그하여 선택 후 복사(Ctrl+C)하면 형식이 그대로 유지됩니다</li>
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
                            <li className="text-yellow-300">HTML 소스코드를 복사하여 블로거/워드프레스의 HTML 편집기에 붙여넣으세요</li>
                        </ul>
                    </div>
                )}

                {/* 구글 전용: 추가 정보 섹션 */}
                {platform === 'google' && metadata && (
                    <div className="bg-gray-900 border border-blue-800 rounded-lg p-4 text-xs space-y-3">
                        <h4 className="text-blue-400 font-bold text-sm mb-3">📌 추가 정보 (블로그 작성 참고용)</h4>

                        {/* 핵심 키워드 */}
                        <div className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-300 font-semibold">🔍 핵심 키워드 (해시태그)</p>
                                <CopyButton textToCopy={metadata.keywords} />
                            </div>
                            <p className="text-gray-400 break-words">{metadata.keywords}</p>
                        </div>

                        {/* 이미지 프롬프트 */}
                        <div className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-300 font-semibold">🎨 이미지 생성 프롬프트</p>
                                <CopyButton textToCopy={metadata.imagePrompt} />
                            </div>
                            <p className="text-gray-400 italic break-words">{metadata.imagePrompt}</p>
                            <p className="text-gray-500 text-xs mt-2">* Midjourney, DALL-E, Stable Diffusion 등에 활용</p>
                        </div>

                        {/* SEO 최적 제목 제안 */}
                        <div className="bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-300 font-semibold">📝 SEO 최적 제목 제안 (5개)</p>
                            </div>
                            <div className="space-y-2">
                                {metadata.seoTitles.map((seoTitle, index) => (
                                    <div key={index} className="flex items-start gap-2 bg-gray-700 rounded p-2">
                                        <span className="text-gray-400 text-xs mt-0.5 flex-shrink-0">{index + 1}.</span>
                                        <p className="text-gray-300 text-xs flex-1 break-words">{seoTitle}</p>
                                        <div className="flex-shrink-0">
                                            <CopyButton textToCopy={seoTitle} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-gray-500 text-xs italic text-center pt-2 border-t border-gray-700">
                            💡 위 정보는 소스코드 복사에 포함되지 않습니다
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPostDisplay;