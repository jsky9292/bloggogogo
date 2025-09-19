import React from 'react';
import type { SearchSource } from '../types';

interface SearchEngineSelectorProps {
    selectedSource: SearchSource;
    onSelectSource: (source: SearchSource) => void;
    loading: boolean;
}

const SearchEngineSelector: React.FC<SearchEngineSelectorProps> = ({ selectedSource, onSelectSource, loading }) => {
    const commonClasses = "w-full sm:w-auto flex-1 sm:flex-none text-center font-bold py-2 px-6 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";
    
    // Google colors - multi-color gradient representing all 4 colors
    const googleSelectedClasses = "text-white shadow-lg";
    const googleUnselectedClasses = "bg-white hover:shadow-md border-2 border-gray-300 hover:border-gray-400";
    
    // Naver colors - green
    const naverSelectedClasses = "text-white shadow-lg" + " " + "bg-gradient-to-r from-[#03C75A] to-[#00a046]";
    const naverUnselectedClasses = "bg-white hover:shadow-md border-2" + " " + "text-[#03C75A] border-[#03C75A] hover:bg-[#03C75A] hover:text-white";
    
    return (
        <div className="flex flex-col sm:flex-row gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-4">
            <button
                onClick={() => onSelectSource('google')}
                className={`${commonClasses} ${selectedSource === 'google' ? googleSelectedClasses : googleUnselectedClasses}`}
                disabled={loading}
                aria-pressed={selectedSource === 'google'}
                style={selectedSource === 'google' ? {
                    background: 'linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC04 50%, #FBBC04 75%, #34A853 75%, #34A853 100%)'
                } : {}}
            >
                <span style={{
                    background: selectedSource === 'google' ? 'none' : 'linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC04 50%, #FBBC04 75%, #34A853 75%, #34A853 100%)',
                    WebkitBackgroundClip: selectedSource === 'google' ? 'initial' : 'text',
                    WebkitTextFillColor: selectedSource === 'google' ? 'white' : 'transparent',
                    backgroundClip: selectedSource === 'google' ? 'initial' : 'text',
                    color: selectedSource === 'google' ? 'white' : 'transparent'
                }}>Google</span>
            </button>
            <button
                onClick={() => onSelectSource('naver')}
                className={`${commonClasses} ${selectedSource === 'naver' ? naverSelectedClasses : naverUnselectedClasses}`}
                disabled={loading}
                aria-pressed={selectedSource === 'naver'}
            >
                Naver
            </button>
        </div>
    );
};

export default SearchEngineSelector;
