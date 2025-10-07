import React from 'react';
import type { Feature } from '../types';

interface FeatureSelectorProps {
    selectedFeature: Feature;
    onSelectFeature: (feature: Feature) => void;
    loading: boolean;
    onFetchRecommendations: () => void;
    recoLoading: boolean;
    onReset: () => void;
}

const FeatureSelector: React.FC<FeatureSelectorProps> = ({ selectedFeature, onSelectFeature, loading, onFetchRecommendations, recoLoading, onReset }) => {
    // Base button classes for full width vertical layout
    const baseButtonClasses = "w-full text-left font-medium text-sm px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between";
    
    const selectedClasses = "bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg transform scale-[1.02]";
    const unselectedClasses = "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border-2 border-gray-200 hover:border-blue-400";
    
    const sustainableButtonBase = "border-2 border-blue-600 bg-blue-50 text-blue-800 hover:bg-blue-100 hover:border-blue-700 focus:ring-blue-600";
    const sustainableButtonSelected = "bg-gradient-to-r from-blue-800 to-blue-600 text-white border-2 border-blue-800 focus:ring-blue-600 shadow-lg transform scale-[1.02]";

    const recoButtonClasses = "bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 focus:ring-red-500 disabled:bg-gray-200 disabled:text-gray-400 border-2 border-red-500 shadow-md";
    
    const resetButtonClasses = "w-full text-center font-medium text-sm px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 focus:ring-gray-400 border-2 border-gray-300";

    const anyLoading = loading || recoLoading;
    
    const getIcon = (feature: string) => {
        switch(feature) {
            case 'keywords':
                return '🔤';
            case 'related-keywords':
                return '🤖';
            case 'blogs':
                return '📝';
            case 'competition':
                return '⚔️';
            case 'naver-keyword-analysis':
                return '🔍';
            case 'recommendations':
                return '🎯';
            case 'sustainable-topics':
                return '🌱';
            case 'reset':
                return '🔄';
            default:
                return '📊';
        }
    };
    
    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={() => onSelectFeature('naver-keyword-analysis')}
                className={`${baseButtonClasses} ${selectedFeature === 'naver-keyword-analysis' ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg transform scale-[1.02]' : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border-2 border-green-500 hover:border-green-600'}`}
                disabled={anyLoading}
                aria-pressed={selectedFeature === 'naver-keyword-analysis'}
            >
                <span className="flex items-center gap-2">
                    <span>{getIcon('naver-keyword-analysis')}</span>
                    <span>네이버 키워드 분석</span>
                </span>
                {selectedFeature === 'naver-keyword-analysis' && <span>✓</span>}
            </button>

            <button
                onClick={() => onSelectFeature('keywords')}
                className={`${baseButtonClasses} ${selectedFeature === 'keywords' ? selectedClasses : unselectedClasses}`}
                disabled={anyLoading}
                aria-pressed={selectedFeature === 'keywords'}
            >
                <span className="flex items-center gap-2">
                    <span>{getIcon('keywords')}</span>
                    <span>자동완성 키워드 분석</span>
                </span>
                {selectedFeature === 'keywords' && <span>✓</span>}
            </button>
            
            <button
                onClick={() => onSelectFeature('related-keywords')}
                className={`${baseButtonClasses} ${selectedFeature === 'related-keywords' ? selectedClasses : unselectedClasses}`}
                disabled={anyLoading}
                aria-pressed={selectedFeature === 'related-keywords'}
            >
                <span className="flex items-center gap-2">
                    <span>{getIcon('related-keywords')}</span>
                    <span>AI 연관검색어 분석</span>
                </span>
                {selectedFeature === 'related-keywords' && <span>✓</span>}
            </button>
            
            <button
                onClick={() => onSelectFeature('blogs')}
                className={`${baseButtonClasses} ${selectedFeature === 'blogs' ? selectedClasses : unselectedClasses}`}
                disabled={anyLoading}
                aria-pressed={selectedFeature === 'blogs'}
            >
                <span className="flex items-center gap-2">
                    <span>{getIcon('blogs')}</span>
                    <span>상위 블로그 분석</span>
                </span>
                {selectedFeature === 'blogs' && <span>✓</span>}
            </button>
            
            <button
                onClick={() => onSelectFeature('competition')}
                className={`${baseButtonClasses} ${selectedFeature === 'competition' ? selectedClasses : unselectedClasses}`}
                disabled={anyLoading}
                aria-pressed={selectedFeature === 'competition'}
            >
                <span className="flex items-center gap-2">
                    <span>{getIcon('competition')}</span>
                    <span>키워드 경쟁력 분석</span>
                </span>
                {selectedFeature === 'competition' && <span>✓</span>}
            </button>

            <button
                onClick={onFetchRecommendations}
                disabled={anyLoading}
                className={`${baseButtonClasses} ${recoButtonClasses}`}
            >
                <span className="flex items-center gap-2">
                    <span>{getIcon('recommendations')}</span>
                    <span>
                        {recoLoading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>분석 중...</span>
                            </div>
                        ) : (
                            '오늘의 글감'
                        )}
                    </span>
                </span>
                {!recoLoading && <span>⚡</span>}
            </button>
            
            <button
                onClick={() => onSelectFeature('sustainable-topics')}
                className={`${baseButtonClasses} ${selectedFeature === 'sustainable-topics' ? sustainableButtonSelected : sustainableButtonBase}`}
                disabled={anyLoading}
                aria-pressed={selectedFeature === 'sustainable-topics'}
            >
                <span className="flex items-center gap-2">
                    <span>{getIcon('sustainable-topics')}</span>
                    <span>4차원 주제발굴</span>
                </span>
                {selectedFeature === 'sustainable-topics' && <span>✓</span>}
            </button>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
                <button
                    onClick={onReset}
                    disabled={anyLoading}
                    className={resetButtonClasses}
                    title="모든 결과와 입력을 초기화합니다."
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span>초기화</span>
                </button>
            </div>
        </div>
    );
};

export default FeatureSelector;