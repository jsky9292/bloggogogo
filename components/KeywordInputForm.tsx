import React from 'react';
import type { Feature } from '../types';

interface KeywordInputFormProps {
    onSearch: (keyword: string) => void;
    loading: boolean;
    keyword: string;
    setKeyword: (keyword: string) => void;
    feature: Feature;
}

const KeywordInputForm: React.FC<KeywordInputFormProps> = ({ onSearch, loading, keyword, setKeyword, feature }) => {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(keyword);
    };

    const getButtonText = () => {
        switch (feature) {
            case 'blogs':
                return '상위 블로그 분석';
            case 'competition':
                return '키워드 분석 시작';
            case 'sustainable-topics':
                return '4차원 주제발굴';
            case 'related-keywords':
                return 'AI 활용 연관 검색어 분석';
            case 'keywords':
            default:
                return '키워드 검색';
        }
    };

    const getButtonIcon = () => {
        switch (feature) {
            case 'blogs':
                return '📊';
            case 'competition':
                return '🎯';
            case 'sustainable-topics':
                return '🌿';
            case 'related-keywords':
                return '🤖';
            case 'keywords':
            default:
                return '🔍';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 다이어트, 부업 추천"
                className="w-full bg-white text-gray-800 placeholder-gray-400 border-2 border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition duration-300 hover:border-blue-700"
                disabled={loading}
                aria-label="키워드 입력"
            />
            <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className="w-full bg-gradient-to-r from-blue-800 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:shadow-none"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>분석 중...</span>
                    </>
                ) : (
                    <>
                        <span>{getButtonIcon()}</span>
                        <span>{getButtonText()}</span>
                    </>
                )}
            </button>
        </form>
    );
};

export default KeywordInputForm;