
import React, { useEffect, useRef } from 'react';

interface HelpModalProps {
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div ref={modalRef} className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
                    <h2 className="text-xl font-bold text-cyan-400">Keyword Insight Pro: 상세 매뉴얼</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto space-y-8 text-slate-300">
                    <section>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-300/20 pb-2">1. 서비스 소개</h3>
                        <p className="text-sm leading-relaxed">
                            <strong>'Keyword Insight Pro'</strong>는 AI 기반 SEO 분석 플랫폼으로, 블로거와 마케터가 효과적인 콘텐츠 전략을 수립할 수 있게 지원합니다. 단순 키워드 조회를 넘어 실무에 바로 적용 가능한 인사이트를 제공하며, Google과 Naver 데이터를 종합 분석해 경쟁 우위를 확보할 수 있도록 설계되었습니다.
                        </p>
                    </section>
                    
                    <section>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-300/20 pb-2">2. 핵심 기능</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            <li><strong>AI 심층 분석:</strong> 최신 AI로 키워드 경쟁력, 블로그 전략, 트렌드를 실시간 분석해 드립니다.</li>
                            <li><strong>통합 솔루션:</strong> 자동완성, 연관검색, 블로그 순위, 경쟁 분석, 주제 발굴, 트렌드 등 필요한 모든 기능을 한 곳에서 제공합니다.</li>
                            <li><strong>실시간 데이터:</strong> Google 실시간 검색으로 최신 정보를 반영한 정확한 분석을 보장합니다.</li>
                            <li><strong>실무 중심 결과:</strong> 분석에서 끝나지 않고, 구체적인 제목, 전략, 실행 방안까지 제시해 즉시 활용할 수 있습니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-300/20 pb-2">3. 기능별 가이드</h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">1) 자동완성검색어 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>용도:</strong> 사용자 검색 의도 파악 및 콘텐츠 아이디어 발굴</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>이용 방법:</strong> 검색 엔진(Google/Naver) 선택 → 키워드 입력 → 최대 20개 자동완성 키워드 확인</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>💡 Pro Tip:</strong> 결과 목록의 키워드를 클릭하면 연쇄 분석이 가능합니다. '주제 만들기' 버튼으로 즉시 콘텐츠 아이디어를 생성해보세요.</p>
                            </div>
                             <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">2) AI 연관 검색어 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>용도:</strong> Google SERP 데이터 추출 및 AI 기반 콘텐츠 전략 수립</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>작동 방식:</strong> [1단계] SERP 데이터(관련 검색어, PAA) 수집 → [2단계] AI 자동 전략 리포트 생성</p>
                                <div className="text-sm leading-relaxed bg-slate-800/50 p-3 rounded-md space-y-2">
                                    <p><strong>💡 고급 전략: 콘텐츠 갭 분석</strong></p>
                                    <p>경쟁 콘텐츠가 놓친 사용자 니즈를 찾아 선점하는 전략입니다.</p>
                                    <p><strong>작동 원리:</strong> PAA 데이터 실시간 추출 → AI가 기존 콘텐츠의 부족한 부분 분석 → 차별화 포인트 제시</p>
                                    <div>
                                        <p className="font-semibold text-slate-200">실행 단계:</p>
                                        <ol className="list-decimal list-inside pl-2 space-y-1 mt-1">
                                            <li>네이버 creator-advisor에서 핵심 키워드 탐색</li>
                                            <li>선정한 키워드로 SERP 데이터 추출</li>
                                            <li>PAA 섹션에서 '콘텐츠 갭 분석' 확인</li>
                                            <li>전략 리포트와 PAA 인사이트 종합해 콘텐츠 제작</li>
                                        </ol>
                                    </div>
                                    <p><strong>💎 핵심 팁:</strong> 콘텐츠 갭 분석 결과를 글의 핵심 구성으로 활용하면 상위 노출 가능성이 크게 높아집니다.</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">3) 네이버 상위 블로그 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>용도:</strong> 경쟁 콘텐츠 분석 및 상위 노출 전략 수립</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>제공 정보:</strong> 네이버 상위 10개 블로그 목록 + AI 자동 분석</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>💡 특별 기능:</strong> AI가 상위 콘텐츠를 분석해 '1위 달성 전략'을 자동 생성합니다.</p>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">4) 키워드 경쟁력 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>용도:</strong> 상위 노출 가능성을 데이터 기반으로 예측</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>분석 항목:</strong> 성공 가능성 점수 / 검색 관심도 / 경쟁 난이도</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>💡 스마트 제안:</strong> 경쟁이 치열한 키워드의 경우, 대안 전략과 확장 키워드를 자동으로 추천해 드립니다.</p>
                            </div>
                             <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">5) 4차원 주제발굴</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>용도:</strong> 하나의 키워드로 다각도 콘텐츠 아이디어 생성</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>분류 체계:</strong> 즉각적 호기심 / 문제 해결 / 장기적 관심 / 사회적 연결</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>💡 제공 내용:</strong> 카테고리별 10개 주제 + 핵심 키워드 5개 + SEO 최적화 가이드</p>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">6) 오늘의 글감</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>용도:</strong> 즉시 작성 가능한 트렌드 키워드 발굴</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>특징:</strong> 검색량 급증 + 낮은 경쟁도 키워드 10개 자동 선정</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>💎 원클릭 기획:</strong> 선정 이유, 추천 제목, 썸네일 문구, 작성 전략까지 모두 제공합니다.</p>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">7) 프롬프트 라이브러리 & 실시간 트렌드</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>용도:</strong> 전문가급 분석 도구 및 실시간 트렌드 포착</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>프롬프트 라이브러리:</strong> 전문가용 SEO 분석 프롬프트 50종 내장</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md">
                                    <strong>💡 실시간 트렌드 활용:</strong> 분석할 키워드를 찾는 것이 성공의 시작입니다.<br/><br/>
                                    <strong>추천 워크플로우:</strong><br/>
                                    1. 네이버 creator-advisor, 정책 포털에서 최신 이슈 확인<br/>
                                    2. 핵심 키워드 추출 → 본 서비스에서 심층 분석<br/>
                                    3. 정부/공공기관 발표는 경쟁이 적은 '블루오션 키워드'의 보고입니다.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default HelpModal;
