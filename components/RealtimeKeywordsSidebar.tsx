import React from 'react';
import PromptLauncher from './PromptLauncher';

const links = [
    {
        title: '실시간 인기 검색어 모음',
        description: '구글, 네이트, 줌, 다음',
        url: 'https://adsensefarm.kr/realtime/',
    },
    {
        title: '시그널 실검 (구.네이버 실검)',
        description: '실시간 검색어 순위 제공',
        url: 'https://www.signal.bz/',
    },
    {
        title: '네이버 creator-advisor',
        description: '(로그인 필요, 트렌드 탭으로 이동)',
        url: 'https://creator-advisor.naver.com/naver_blog',
        highlight: true,
    },
    {
        title: '네이버 데이터랩',
        description: '네이버의 검색 트렌드 분석 도구',
        url: 'https://datalab.naver.com/',
    },
    {
        title: '블로그 수익화 전략',
        description: '스마트한 IT생계백서',
        url: 'https://smart-it-life.tistory.com/category/블로그수익화',
    },
    {
        title: '대한민국 정책포털',
        description: '전국 정책 뉴스와 브리핑',
        url: 'https://www.korea.kr/news/policyNewsList.do',
    },
    {
        title: '금융위원회',
        description: '금융정책, 금융소비자보호',
        url: 'https://www.fsc.go.kr/index',
    },
    {
        title: '기획재정부',
        description: '경제성장전략, 세제개편안',
        url: 'https://www.moef.go.kr/together.do',
    },
    {
        title: 'KDI 한국개발연구원',
        description: '경제·사회 관련 종합정책',
        url: 'https://eiec.kdi.re.kr/',
    },
];

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-blue-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

interface RealtimeKeywordsSidebarProps {
    onPromptExecute: (prompt: string) => void;
}

const RealtimeKeywordsSidebar: React.FC<RealtimeKeywordsSidebarProps> = ({ onPromptExecute }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-blue-800 mb-2">실시간 트렌드 도구</h2>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <ul className="divide-y divide-gray-200">
                        {links.map((link, index) => (
                            <li key={index} className={link.highlight ? "bg-blue-50 border-l-4 border-blue-700" : ""}>
                                <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 group"
                                >
                                    <div>
                                        <h3 className={`font-bold transition-colors ${link.highlight ? 'text-blue-900 group-hover:text-blue-900' : 'text-gray-700 group-hover:text-blue-800'}`}>
                                            {link.highlight ? '⭐ ' : ''}{link.title}
                                        </h3>
                                        <p className="text-sm text-gray-500">{link.description}</p>
                                    </div>
                                    <ExternalLinkIcon />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div>
                <PromptLauncher onExecute={onPromptExecute} />
            </div>
        </div>
    );
};

export default RealtimeKeywordsSidebar;