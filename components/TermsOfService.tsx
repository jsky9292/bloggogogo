import React from 'react';

interface TermsOfServiceProps {
    onClose: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onClose }) => {
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
                        이용약관
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
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제1조 (목적)
                            </h3>
                            <p>
                                본 약관은 Keyword Insight Pro(이하 "서비스")가 제공하는 AI 기반 키워드 분석 및 SEO 최적화 서비스의 이용과 관련하여
                                회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제2조 (정의)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>"서비스"</strong>란 회사가 제공하는 AI 기반 키워드 분석, SERP 분석, 블로그 콘텐츠 생성 등의 SEO 최적화 도구를 의미합니다.
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>"회원"</strong>이란 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <strong>"구독"</strong>이란 회원이 일정 기간 동안 서비스를 이용할 수 있는 권한을 의미합니다.
                                </li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제3조 (약관의 효력 및 변경)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며,
                                약관이 변경되는 경우 지체 없이 이를 공지합니다.
                            </p>
                            <p>
                                3. 회원은 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제4조 (회원가입)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 회원가입은 이용자가 약관의 내용에 동의하고 회사가 정한 가입 양식에 따라 회원정보를 기입하여 신청합니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                                <li style={{ marginBottom: '0.5rem' }}>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제5조 (서비스의 제공)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 회사는 다음과 같은 서비스를 제공합니다:
                            </p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>AI 기반 키워드 경쟁력 분석</li>
                                <li style={{ marginBottom: '0.5rem' }}>Google 및 Naver SERP 분석</li>
                                <li style={{ marginBottom: '0.5rem' }}>AI 블로그 콘텐츠 자동 생성</li>
                                <li style={{ marginBottom: '0.5rem' }}>실시간 검색 트렌드 분석</li>
                                <li style={{ marginBottom: '0.5rem' }}>동영상 강의 콘텐츠 (유료 플랜)</li>
                            </ul>
                            <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                                2. 서비스는 연중무휴 1일 24시간 제공함을 원칙으로 합니다. 단, 시스템 정기점검, 증설 및 교체 등 부득이한 사유로
                                서비스를 일시 중단할 수 있습니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제6조 (구독 및 요금)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 서비스는 Free, Basic, Pro, Enterprise 플랜을 제공하며, 각 플랜별 이용 한도 및 기능이 상이합니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                2. 유료 플랜의 구독료는 플랜별로 차등 적용되며, 자세한 사항은 서비스 내 요금 안내 페이지를 참조하시기 바랍니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                3. 구독료는 매월 또는 선택한 구독 기간에 따라 자동 결제됩니다.
                            </p>
                            <p>
                                4. 회원은 언제든지 구독을 해지할 수 있으며, 해지 시 남은 기간에 대한 환불은 회사의 환불 정책에 따릅니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제7조 (회원의 의무)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>회원은 다음 행위를 하여서는 안 됩니다:</p>
                            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                                <li style={{ marginBottom: '0.5rem' }}>신청 또는 변경 시 허위내용의 등록</li>
                                <li style={{ marginBottom: '0.5rem' }}>타인의 정보 도용</li>
                                <li style={{ marginBottom: '0.5rem' }}>회사가 게시한 정보의 변경</li>
                                <li style={{ marginBottom: '0.5rem' }}>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                                <li style={{ marginBottom: '0.5rem' }}>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                                <li style={{ marginBottom: '0.5rem' }}>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                                <li style={{ marginBottom: '0.5rem' }}>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                            </ul>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제8조 (저작권)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 서비스 내 모든 콘텐츠에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                2. 회원이 서비스를 이용하여 생성한 콘텐츠의 저작권은 회원에게 귀속되나,
                                회사는 서비스 제공 및 개선을 위해 해당 콘텐츠를 사용할 수 있습니다.
                            </p>
                            <p>
                                3. 회원은 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여
                                영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제9조 (서비스 이용 제한)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우,
                                경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제10조 (책임제한)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
                            </p>
                            <p style={{ marginBottom: '0.5rem' }}>
                                2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.
                            </p>
                            <p>
                                3. 회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며,
                                그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
                            </p>
                        </section>

                        <section style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                제11조 (분쟁 해결)
                            </h3>
                            <p style={{ marginBottom: '0.5rem' }}>
                                1. 회사와 회원은 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 합니다.
                            </p>
                            <p>
                                2. 제1항의 노력에도 불구하고 분쟁이 해결되지 않을 경우, 양 당사자는 민사소송법상의 관할법원에 소를 제기할 수 있습니다.
                            </p>
                        </section>

                        <section>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
                                부칙
                            </h3>
                            <p>본 약관은 2024년 1월 1일부터 시행됩니다.</p>
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

export default TermsOfService;
