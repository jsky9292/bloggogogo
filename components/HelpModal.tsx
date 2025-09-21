
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
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-300/20 pb-2">1. 앱 개요</h3>
                        <p className="text-sm leading-relaxed">
                            <strong>'Keyword Insight Pro'</strong>는 최신 AI 모델을 기반으로 한 올인원 SEO 및 콘텐츠 전략 도구입니다. 블로거, 마케터, 콘텐츠 크리에이터를 위해 설계되었으며, 단순한 키워드 검색을 넘어 데이터 기반의 실행 가능한 전략을 제공하는 것을 목표로 합니다. Google과 Naver의 데이터를 활용하여 사용자가 경쟁에서 앞서나갈 수 있도록 돕습니다.
                        </p>
                    </section>
                    
                    <section>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-300/20 pb-2">2. 주요 특징</h3>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            <li><strong>AI 기반 심층 분석:</strong> 최신 AI 기술을 활용하여 키워드 경쟁력, 블로그 전략, 트렌드를 실시간으로 심층 분석합니다.</li>
                            <li><strong>다기능 올인원 도구:</strong> 자동완성검색어, AI 연관검색어, 블로그 순위, 경쟁 강도, 지속 가능 주제, 실시간 트렌드 키워드까지 하나의 앱에서 모두 해결할 수 있습니다.</li>
                            <li><strong>실시간 데이터 활용:</strong> Google 실시간 검색을 통해 가장 최신 정보를 반영한 분석 결과를 제공하여 시의성 높은 전략 수립이 가능합니다.</li>
                            <li><strong>실행 가능한 전략 제시:</strong> 단순 데이터 나열이 아닌, '그래서 무엇을 해야 하는가?'에 대한 답을 제공합니다. 구체적인 블로그 제목, 공략법, SEO 전략을 제시하여 바로 실행에 옮길 수 있습니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-300/20 pb-2">3. 상세 사용법</h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">1) 자동완성검색어 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>목적:</strong> 특정 키워드에 대한 사용자의 검색 의도를 파악하고 콘텐츠 아이디어를 확장합니다.</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>사용법:</strong> '자동완성검색어 분석' 선택 후, Google/Naver 중 분석할 검색 엔진을 고릅니다. 키워드 입력 후 '키워드 검색'을 누르면 최대 20개의 자동완성검색어가 표시됩니다.</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>✨ 활용팁:</strong> 목록의 키워드를 클릭하면 해당 키워드로 즉시 새로운 분석을 시작할 수 있습니다. 하단의 '주제 만들기' 버튼들을 통해 즉시 블로그 아이디어를 얻어보세요.</p>
                            </div>
                             <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">2) AI 활용 연관 검색어 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>목적:</strong> Google SERP의 핵심 데이터(관련 검색어, PAA)를 추출하고, 이를 바탕으로 즉각적인 AI 콘텐츠 전략까지 도출합니다.</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>사용법:</strong> 'AI 활용 연관 검색어 분석' 선택 후 키워드를 입력하면, 2단계로 작동합니다. <strong>1단계:</strong> SERP 데이터(관련 검색어, PAA)를 추출합니다. <strong>2단계:</strong> 추출된 데이터를 기반으로 AI가 자동으로 '콘텐츠 전략 리포트'를 생성합니다.</p>
                                <div className="text-sm leading-relaxed bg-slate-800/50 p-3 rounded-md space-y-2">
                                    <p><strong>✨ 고급 활용법: SERP 기반 콘텐츠 갭(Content Gap) 분석 전략</strong></p>
                                    <p>이 방법은 경쟁자들이 놓치고 있는 사용자 질문을 발견해서 선점하고 싶을 때 사용하는 고급 전략입니다.</p>
                                    <p><strong>핵심 원리:</strong> 'AI 활용 연관 검색어 분석' 기능은 실시간 Google 검색으로 PAA(People Also Ask) 데이터를 추출합니다. 특히, 각 질문에 대한 AI 요약 답변과 함께, <strong>기존 검색 결과가 어떤 정보를 놓치고 있는지 분석하는 '콘텐츠 갭' 포인트를 명확히 제시합니다.</strong> 이를 통해 경쟁자들이 다루지 않은 사용자의 진짜 궁금증을 정확히 공략할 수 있습니다.</p>
                                    <div>
                                        <p className="font-semibold text-slate-200">사용 순서:</p>
                                        <ol className="list-decimal list-inside pl-2 space-y-1 mt-1">
                                            <li><strong>'네이버 creator-advisor'</strong>에서 본인 분야의 핵심 키워드를 선택합니다.</li>
                                            <li>'AI 활용 연관 검색어 분석' 기능에 입력해서 SERP 데이터를 추출합니다.</li>
                                            <li>PAA(다른 사람들이 함께 찾는 질문)를 열어, AI가 분석한 <strong>'콘텐츠 갭 분석 (공략 포인트)'</strong>를 확인합니다. 이 부분이 바로 경쟁 콘텐츠와 차별화할 수 있는 핵심입니다.</li>
                                            <li>자동 생성되는 '콘텐츠 전략 리포트'와 PAA 분석 결과를 종합하여 사용자 의도에 완벽하게 맞는 콘텐츠를 제작합니다.</li>
                                        </ol>
                                    </div>
                                    <p><strong>Pro-Tip:</strong> AI가 제안한 '콘텐츠 갭 분석'을 중심으로 글의 목차를 구성하세요. 이 분석은 사용자가 만족하지 못하는 부분을 정확히 짚어주므로, 이를 해결하는 콘텐츠는 상위 노출에 매우 유리합니다.</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">3) 네이버 상위 블로그 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>목적:</strong> 경쟁 환경을 파악하고, 상위 노출 콘텐츠를 벤치마킹하여 더 나은 전략을 수립합니다.</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>사용법:</strong> '네이버 상위 블로그 분석' 선택 후 키워드를 입력하면, 해당 키워드로 Naver에서 상위 10위에 노출된 블로그 목록을 보여줍니다.</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>✨ 자동 분석:</strong> 순위 조회와 동시에, AI가 상위 10개 포스트를 분석하여 이들을 이길 수 있는 새로운 '1위 공략 제안' 리포트를 자동으로 생성합니다.</p>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">4) 키워드 경쟁력 분석</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>목적:</strong> 특정 키워드로 콘텐츠를 제작했을 때 상위 노출될 가능성이 얼마나 되는지 과학적으로 분석합니다.</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>사용법:</strong> '키워드 경쟁력 분석' 선택 후 키워드를 입력하면, AI가 실시간 Google 검색을 통해 해당 키워드의 **성공 가능성, 검색 관심도, 경쟁 난이도** 등을 종합 분석하여 점수로 보여줍니다.</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>✨ SEO 전략 제안:</strong> 성공 가능성 점수가 낮을 경우, AI가 자동으로 해당 키워드를 공략하기 위한 구체적인 **SEO 전략, 확장 키워드, 추천 블로그 주제**까지 상세하게 제안해줍니다.</p>
                            </div>
                             <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">5) 다각도 블로그 주제 발굴</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>목적:</strong> 하나의 키워드를 '즉각적 호기심', '문제 해결', '장기적 관심', '사회적 연결' 등 4가지 관점으로 확장하여, 지속 가능한 콘텐츠 아이디어 파이프라인을 구축합니다.</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>사용법:</strong> '다각도 블로그 주제 발굴' 선택 후 키워드를 입력하면, AI가 사용자의 검색 패턴에 따라 주제를 4가지 카테고리로 분류하여 카테고리별 10개의 주제를 제안합니다.</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>✨ 상세 가이드:</strong> 각 주제마다 포함해야 할 <strong>핵심 키워드 5개</strong>와 <strong>Google 상위 노출을 위한 글쓰기 전략</strong>을 함께 제공하여 콘텐츠의 품질을 높일 수 있습니다.</p>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">6) 오늘의 글감</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>목적:</strong> '오늘 당장' 글을 쓰면 효과를 볼 수 있는, 시의성 높고 경쟁이 낮은 키워드를 발굴합니다.</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>사용법:</strong> 메인 화면의 빨간색 '오늘의 글감' 버튼을 클릭하세요. AI가 실시간 트렌드를 분석하여 검색량은 폭증하고 있으나 경쟁은 치열하지 않은 '꿀 키워드' 10개를 발굴해줍니다.</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md"><strong>✨ 즉시 활용:</strong> 각 키워드별 **선정 이유, 추천 제목, 썸네일 문구, 상세 공략법**까지 완벽하게 제공되어, 버튼 클릭 한 번으로 하루치 콘텐츠 기획을 끝낼 수 있습니다.</p>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-yellow-400 mb-2">7) 프롬프트 라이브러리 & 실시간 트렌드</h4>
                                <p className="text-sm leading-relaxed mb-2"><strong>목적:</strong> 기본 기능 외에 더 깊이 있는 분석과 '지금 당장'의 트렌드를 포착하여 분석의 시작점을 제공합니다.</p>
                                <p className="text-sm leading-relaxed mb-2"><strong>프롬프트 라이브러리:</strong> 우측 사이드바의 'SEO 프롬프트 50' 버튼을 누르면, 전문가용으로 설계된 50가지 SEO 분석 프롬프트를 즉시 실행할 수 있습니다.</p>
                                <p className="text-sm leading-relaxed bg-slate-800/50 p-2 rounded-md">
                                    <strong>✨ 실시간 트렌드 도구 (매우 중요):</strong> 이 앱의 핵심은 '분석'이지만, '무엇을' 분석할지 찾는 것이 시작입니다. 사이드바의 트렌드 도구들은 바로 그 '분석의 씨앗'을 제공합니다.<br/><br/>
                                    <strong>활용법:</strong><br/>
                                    1. <strong>'네이버 creator-advisor'</strong>나 '대한민국 정책포털' 등에서 최신 이슈나 정책 발표를 확인합니다.<br/>
                                    2. 여기서 발견한 핵심 단어를 이 앱의 분석 기능(예: 키워드 경쟁력 분석)에 바로 입력하여 심층 분석을 시작합니다.<br/>
                                    3. 정부 부처나 KDI 같은 연구기관 사이트는 경쟁이 덜한 '정책 키워드'를 선점할 수 있는 최고의 정보 소스입니다. 이 도구들을 통해 얻은 키워드로 남들보다 한발 앞선 콘텐츠를 기획해보세요.
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
