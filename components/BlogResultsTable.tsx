import React from 'react';
import type { BlogPostData } from '../types';

const BlogResultsTable: React.FC<{ data: BlogPostData[] }> = ({ data }) => {
    return (
        <div className="bg-black rounded-lg overflow-hidden shadow-lg border border-gray-800">
            <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-gray-900 text-white uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="p-3 text-left w-16">No.</th>
                            <th scope="col" className="p-3 text-left">블로그 제목</th>
                            <th scope="col" className="p-3 text-left">바로가기</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-900 transition-colors duration-200">
                                <td className="p-3 text-gray-400 text-center">{item.id}</td>
                                <td className="p-3 font-medium text-white">{item.title}</td>
                                <td className="p-3">
                                    <a 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-gray-400 hover:text-blue-700 hover:underline transition-colors duration-200"
                                      aria-label={`${item.title} (새 탭에서 열기)`}
                                    >
                                        바로가기
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlogResultsTable;