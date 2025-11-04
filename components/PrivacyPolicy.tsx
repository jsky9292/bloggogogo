import React from 'react';

interface PrivacyPolicyProps {
    onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#111827'
                    }}>
                        개인정보 처리방침
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#6b7280',
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '2rem',
                    overflow: 'auto',
                    flex: 1
                }}>
                    <div style={{
                        fontSize: '0.875rem',
                        lineHeight: '1.75',
                        color: '#374151'
                    }}>
                        <section style={{ marginBottom: '2rem' }}>
                            <p style={{ marginBottom: '1rem' }}>
                                Keyword Insight Pro(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등
                                관련 법령상의 개인정보보호 규정을 준수하며, 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
                                처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제1조 (개인정보의 처리 목적)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>회사는 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증,
                                    회원자격 유지·관리, 서비스 부정이용 방지
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>서비스 제공:</strong> AI 키워드 분석, SERP 분석, 블로그 콘텐츠 생성, 동영상 강의 제공,
                                    구독 관리, 서비스 이용 기록 관리
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>요금 결제·정산:</strong> 유료 서비스 이용에 따른 요금 결제 및 정산
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>고객 지원:</strong> 고객 문의 대응, 불만 처리, 공지사항 전달
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>마케팅 및 광고:</strong> 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 (동의한 경우)
                                </li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제2조 (처리하는 개인정보의 항목)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>

                            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>1. 회원 가입 및 관리</p>
                                <ul style={{ paddingLeft: '1.5rem' }}>
                                    <li style={{ marginBottom: '0.5rem' }}>필수항목: 이메일 주소, 비밀번호, 이름</li>
                                    <li style={{ marginBottom: '0.5rem' }}>선택항목: 프로필 사진</li>
                                </ul>
                            </div>

                            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>2. 서비스 이용</p>
                                <ul style={{ paddingLeft: '1.5rem' }}>
                                    <li style={{ marginBottom: '0.5rem' }}>서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보, 결제 기록</li>
                                </ul>
                            </div>

                            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>3. 결제 정보</p>
                                <ul style={{ paddingLeft: '1.5rem' }}>
                                    <li style={{ marginBottom: '0.5rem' }}>
                                        신용카드 정보, 은행계좌 정보 등 (결제대행사를 통해 처리되며, 회사는 최소한의 결제 정보만 보관)
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제3조 (개인정보의 처리 및 보유기간)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간
                                내에서 개인정보를 처리·보유합니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관련 법령에 따라 보존 필요 시 해당 기간까지)
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    요금 결제·정산: 대금의 완제일로부터 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    소비자 불만 또는 분쟁처리: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)
                                </li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제4조 (개인정보의 제3자 제공)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며,
                                정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                            </p>
                            <p>
                                2. 회사는 현재 개인정보를 제3자에게 제공하고 있지 않습니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제5조 (개인정보 처리의 위탁)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>Google Firebase:</strong> 회원 인증 및 데이터베이스 관리
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>Google Gemini API:</strong> AI 콘텐츠 생성 서비스
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>결제대행사:</strong> 결제 처리 (해당되는 경우)
                                </li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제6조 (정보주체의 권리·의무 및 행사방법)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>개인정보 열람 요구</li>
                                <li style={{ marginBottom: '0.5rem' }}>개인정보에 오류 등이 있을 경우 정정 요구</li>
                                <li style={{ marginBottom: '0.5rem' }}>개인정보 삭제 요구</li>
                                <li style={{ marginBottom: '0.5rem' }}>개인정보 처리 정지 요구</li>
                            </ul>
                            <p style={{ marginTop: '1rem' }}>
                                위 권리 행사는 서비스 내 설정 메뉴 또는 고객센터를 통해 하실 수 있으며,
                                회사는 이에 대해 지체 없이 조치하겠습니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제7조 (개인정보의 파기)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>파기절차:</strong> 불필요한 개인정보는 개인정보 보호책임자의 승인을 받아 파기합니다.
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하고,
                                    종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각합니다.
                                </li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제8조 (개인정보의 안전성 확보조치)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                                <li style={{ marginBottom: '0.5rem' }}>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
                                <li style={{ marginBottom: '0.5rem' }}>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제9조 (개인정보 보호책임자)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여
                                아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
                            </p>
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <p style={{ marginBottom: '0.5rem' }}><strong>개인정보 보호책임자</strong></p>
                                <p style={{ marginBottom: '0.25rem' }}>담당부서: 개인정보보호팀</p>
                                <p style={{ marginBottom: '0.25rem' }}>연락처: 카카오톡 문의 (https://open.kakao.com/o/sOgR5TZh)</p>
                            </div>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제10조 (개인정보 처리방침의 변경)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 이 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다.
                            </p>
                            <p>
                                2. 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제11조 (권익침해 구제방법)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에
                                분쟁해결이나 상담 등을 신청할 수 있습니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
                                <li style={{ marginBottom: '0.5rem' }}>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                                <li style={{ marginBottom: '0.5rem' }}>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
                                <li style={{ marginBottom: '0.5rem' }}>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
                            </ul>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
