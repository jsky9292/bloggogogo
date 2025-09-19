
import React from 'react';
import type { KeywordData, Feature } from '../types';

interface ResultsTableProps {
    data: KeywordData[];
    onKeywordClick: (keyword: string) => void;
    onGenerateTopicsFromMain: () => void;
    onGenerateTopicsFromAll: () => void;
    loading: boolean;
    feature: Feature;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, onKeywordClick, onGenerateTopicsFromMain, onGenerateTopicsFromAll, loading, feature }) => {
    
    const handleKeywordClick = (keyword: string) => {
        onKeywordClick(keyword);
    };

    const getTitle = () => {
        if (feature === 'related-keywords') {
            return '관련 검색어 (Related Searches)';
        }
        return '자동완성검색어';
    };

    return (
        <div className="bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-gray-900 text-white uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="p-3 text-left w-16">No.</th>
                            <th scope="col" className="p-3 text-left">{getTitle()}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-900 transition-colors duration-200">
                                <td className="p-3 text-gray-400 text-center">{item.id}</td>
                                <td className="p-3 font-medium text-white">
                                     <button 
                                        onClick={() => handleKeywordClick(item.keyword)}
                                        className="text-left w-full hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-700 rounded px-1"
                                        aria-label={`${item.keyword}로 검색하기`}
                                    >
                                        {item.keyword}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {feature === 'keywords' && (
                <div className="p-4 bg-black border-t border-gray-800 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={onGenerateTopicsFromMain}
                        disabled={loading}
                        className="flex-1 bg-yellow-600 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center"
                    >
                        메인키워드로만 주제 만들기
                    </button>
                    <button 
                        onClick={onGenerateTopicsFromAll}
                        disabled={loading}
                        className="flex-1 bg-yellow-700 text-white font-bold py-2 px-4 rounded-md hover:bg-yellow-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-300 flex items-center justify-center"
                    >
                        자동완성검색어 조합으로 주제 만들기
                    </button>
                </div>
            )}
        </div>
    );
};

export default ResultsTable;