import React, { useState } from 'react';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

const Footer: React.FC = () => {
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const handleKakaoInquiry = () => {
        window.open('https://open.kakao.com/o/sOgR5TZh', '_blank', 'noopener,noreferrer');
    };

    return (
        <>
            <footer style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                padding: '3rem 2rem 2rem',
                marginTop: '4rem',
                borderTop: '1px solid #333'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {/* Main Footer Content */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '2rem',
                        marginBottom: '2rem'
                    }}>
                        {/* Company Info */}
                        <div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '700',
                                marginBottom: '1rem',
                                color: '#3b82f6'
                            }}>
                                Keyword Insight Pro
                            </h3>
                            <p style={{
                                fontSize: '0.875rem',
                                lineHeight: '1.6',
                                color: '#a0a0a0',
                                marginBottom: '1rem'
                            }}>
                                AI 기반 키워드 분석 및 SEO 최적화 플랫폼
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginBottom: '1rem',
                                color: '#ffffff'
                            }}>
                                바로가기
                            </h4>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <a
                                        href="#features"
                                        style={{
                                            color: '#a0a0a0',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                                    >
                                        기능 소개
                                    </a>
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <a
                                        href="#pricing"
                                        style={{
                                            color: '#a0a0a0',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                                    >
                                        요금제
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Legal & Support */}
                        <div>
                            <h4 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginBottom: '1rem',
                                color: '#ffffff'
                            }}>
                                법적 고지 및 지원
                            </h4>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <button
                                        onClick={() => setShowTerms(true)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#a0a0a0',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            padding: 0,
                                            textAlign: 'left',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                                    >
                                        이용약관
                                    </button>
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <button
                                        onClick={() => setShowPrivacy(true)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#a0a0a0',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            padding: 0,
                                            textAlign: 'left',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                                    >
                                        개인정보 처리방침
                                    </button>
                                </li>
                                <li style={{ marginBottom: '0.5rem' }}>
                                    <button
                                        onClick={handleKakaoInquiry}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#a0a0a0',
                                            textDecoration: 'none',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            padding: 0,
                                            textAlign: 'left',
                                            transition: 'color 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#FEE500'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#a0a0a0'}
                                    >
                                        <span>카카오톡 1:1 문의</span>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M8 2c-3.314 0-6 2.134-6 4.778 0 1.778 1.155 3.344 2.889 4.267-.111.889-.445 2.111-.556 2.444-.022.067-.044.156.022.222.045.045.111.067.178.067.089 0 1.022-.067 2.022-.622.311.045.645.089.978.089 3.314 0 6-2.2 6-4.889C14 4.134 11.314 2 8 2z" />
                                        </svg>
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                marginBottom: '1rem',
                                color: '#ffffff'
                            }}>
                                문의
                            </h4>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#a0a0a0',
                                marginBottom: '0.5rem'
                            }}>
                                Email: jsk9292@gmail.com
                            </p>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#a0a0a0'
                            }}>
                                운영시간: 평일 09:00 - 18:00
                            </p>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div style={{
                        borderTop: '1px solid #333',
                        paddingTop: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#666',
                            margin: 0
                        }}>
                            © 2024 Keyword Insight Pro. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Modals */}
            {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
            {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
        </>
    );
};

export default Footer;
