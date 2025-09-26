import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
      {/* Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(120, 40, 200, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(40, 120, 250, 0.2) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(200, 40, 120, 0.2) 0%, transparent 50%)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Navigation */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '1.5rem 5%',
        background: scrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
            }}>
              🔍
            </div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>
              Keyword Insight Pro
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <button
              onClick={onLogin}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              로그인
            </button>
            <button
              onClick={onRegister}
              style={{
                padding: '0.625rem 1.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              무료 시작하기
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5%',
        position: 'relative',
        marginTop: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '100px',
            marginBottom: '2rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: '#10b981',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{
              fontSize: '0.875rem',
              color: '#a5b4fc'
            }}>
              AI 기반 키워드 분석 플랫폼
            </span>
          </div>

          {/* Hook Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '100px',
            marginBottom: '2rem',
            animation: 'pulse 2s infinite'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🤫</span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              쉿! 당신만 아는 키워드 전략
            </span>
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem'
          }}>
            <span style={{
              background: 'linear-gradient(to right, #ffffff 20%, rgba(255, 255, 255, 0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              검색 상위노출의
            </span>
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              비밀을 찾아드립니다
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto 3rem'
          }}>
            AI가 분석한 경쟁력 지표로 최적의 키워드를 발견하고,
            SEO 최적화된 콘텐츠를 자동으로 생성하세요
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            <button
              onClick={onRegister}
              style={{
                padding: '1rem 2.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '100px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.3)';
              }}
            >
              무료로 시작하기 →
            </button>
            <button
              onClick={() => {
                // 데모 계정으로 자동 로그인
                onLogin();
                setTimeout(() => {
                  const demoEmail = document.querySelector('input[type="email"]') as HTMLInputElement;
                  const demoPassword = document.querySelector('input[type="password"]') as HTMLInputElement;
                  if (demoEmail && demoPassword) {
                    demoEmail.value = 'demo@example.com';
                    demoPassword.value = 'Demo123!';
                  }
                }, 100);
              }}
              style={{
                padding: '1rem 2.5rem',
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '100px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              데모 보기
            </button>
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            gap: '3rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
                신용카드 불필요
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
                14일 무료 체험
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }}>
                5분 안에 시작
              </span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounce 2s infinite'
        }}>
          <div style={{
            width: '30px',
            height: '50px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '25px',
            position: 'relative'
          }}>
            <div style={{
              width: '4px',
              height: '10px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '2px',
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              animation: 'scroll 2s infinite'
            }} />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '5rem 5%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(102, 126, 234, 0.05) 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              background: 'linear-gradient(to right, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              강력한 기능들
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              데이터 기반의 인사이트로 콘텐츠 전략을 수립하세요
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: '⚡',
                title: 'AI 경쟁력 분석',
                description: '머신러닝 기반 실시간 경쟁도 측정',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              },
              {
                icon: '🎯',
                title: 'SERP 완벽 분석',
                description: '구글/네이버 검색 결과 심층 분석',
                gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              },
              {
                icon: '✨',
                title: 'AI 콘텐츠 생성',
                description: 'SEO 최적화된 고품질 콘텐츠 자동 생성',
                gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
              },
              {
                icon: '📊',
                title: '데이터 시각화',
                description: '직관적인 대시보드와 리포트',
                gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
              },
              {
                icon: '🚀',
                title: '실시간 트렌드',
                description: '빠르게 변하는 검색 트렌드 포착',
                gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
              },
              {
                icon: '🔒',
                title: '엔터프라이즈 보안',
                description: 'SSL 암호화 및 데이터 보호',
                gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '2rem',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: feature.gradient,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  marginBottom: '0.75rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{
        padding: '5rem 5%',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              투명한 가격 정책
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              필요에 맞는 플랜을 선택하세요
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                name: 'Free Trial',
                price: '₩0',
                period: '/14일',
                features: ['하루 10개 키워드 분석', 'AI 블로그 1개 생성', '경쟁 난이도 분석', '검색량 트렌드 확인', '14일 무료 체험'],
                cta: '지금 무료로 시작',
                popular: false,
                badge: '🎁 14일 체험'
              },
              {
                name: 'Basic',
                price: '₩19,900',
                period: '/월',
                features: ['하루 30개 키워드 분석', 'AI 블로그 10개 생성', '상위 10개 경쟁사 분석', '키워드 저장 100개', '이메일 리포트'],
                cta: 'Basic 시작하기',
                popular: false
              },
              {
                name: 'Professional',
                price: '₩39,900',
                period: '/월',
                features: ['하루 100개 키워드 분석', 'AI 블로그 무제한', '실시간 순위 모니터링', '무제한 키워드 저장', '카카오톡 알림'],
                cta: 'Pro 시작하기',
                popular: true,
                badge: '🔥 가장 인기'
              },
              {
                name: 'Enterprise',
                price: '맞춤 견적',
                period: '',
                features: ['무제한 모든 기능', '다중 사용자 계정', 'API 연동 제공', '1:1 전담 매니저', '맞춤 기능 개발'],
                cta: '상담 요청하기',
                popular: false
              }
            ].map((plan, index) => (
              <div
                key={index}
                style={{
                  background: plan.popular
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: plan.popular
                    ? '2px solid rgba(102, 126, 234, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  position: 'relative',
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '500px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: plan.popular ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: '0.375rem 1.25rem',
                    borderRadius: '100px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{
                      fontSize: '2.5rem',
                      fontWeight: '700'
                    }}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginLeft: '0.5rem'
                      }}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '2rem',
                  flex: 1
                }}>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        padding: '0.75rem 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <span style={{ color: '#10b981' }}>✓</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onRegister}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: plan.popular
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'transparent',
                    color: '#ffffff',
                    border: plan.popular
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    } else {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!plan.popular) {
                      e.currentTarget.style.background = 'transparent';
                    } else {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 5%',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '5rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Keyword Insight Pro
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.875rem'
            }}>
              © 2025 All rights reserved.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '2rem'
          }}>
            <a href="#" style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              이용약관
            </a>
            <a href="#" style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              개인정보처리방침
            </a>
            <a href="#" style={{
              color: 'rgba(255, 255, 255, 0.6)',
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
            >
              문의하기
            </a>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0) translateX(-50%); }
            50% { transform: translateY(-10px) translateX(-50%); }
          }

          @keyframes scroll {
            0% { transform: translateY(0) translateX(-50%); opacity: 0; }
            40% { opacity: 1; }
            80% { transform: translateY(15px) translateX(-50%); opacity: 0; }
            100% { transform: translateY(15px) translateX(-50%); opacity: 0; }
          }
        `}
      </style>
    </div>
    </>
  );
};

export default LandingPage;