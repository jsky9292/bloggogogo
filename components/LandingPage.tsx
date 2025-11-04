import React, { useState, useEffect } from 'react';
import { db } from '../src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Video {
    id: string;
    title: string;
    url: string;
    description: string;
    category: 'tutorial' | 'feature' | 'tip' | 'promotion';
    order: number;
    createdAt: Date;
}

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const [scrolled, setScrolled] = useState(false);
  const [promotionVideos, setPromotionVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [naverKeywords, setNaverKeywords] = useState<{ keyword: string; rank: number }[]>([]);
  const [googleKeywords, setGoogleKeywords] = useState<{ keyword: string; rank: number }[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchPromotionVideos();
    fetchTrendingKeywords();
  }, []);

  const fetchPromotionVideos = async () => {
    try {
      const videosCollection = collection(db, 'videos');
      const snapshot = await getDocs(videosCollection);
      const videoList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Video[];

      const promoVideos = videoList
        .filter(v => v.category === 'promotion')
        .sort((a, b) => a.order - b.order);

      setPromotionVideos(promoVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchTrendingKeywords = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      console.log('[DEBUG] 실시간 검색어 API 호출 시작...', apiUrl);
      const response = await fetch(`${apiUrl}/trending_keywords`);
      const result = await response.json();

      console.log('[DEBUG] API 응답:', result);
      console.log('[DEBUG] 네이버 키워드 수:', result.naver?.length);
      console.log('[DEBUG] 구글 키워드 수:', result.google?.length);

      if (result.success) {
        // 네이버 검색어 설정
        if (result.naver && result.naver.length > 0) {
          console.log('[DEBUG] 네이버 검색어 설정:', result.naver);
          setNaverKeywords(result.naver);
        } else {
          console.warn('[WARN] 네이버 검색어가 비어있음, fallback 사용');
          setNaverKeywords([
            { keyword: '블로그 수익화', rank: 1 },
            { keyword: 'SEO 최적화', rank: 2 },
            { keyword: '키워드 분석', rank: 3 },
            { keyword: '구글 애드센스', rank: 4 },
            { keyword: '콘텐츠 마케팅', rank: 5 }
          ]);
        }

        // 구글 트렌드 설정
        if (result.google && result.google.length > 0) {
          console.log('[DEBUG] 구글 검색어 설정:', result.google);
          setGoogleKeywords(result.google);
        } else {
          console.warn('[WARN] 구글 검색어가 비어있음, fallback 사용');
          setGoogleKeywords([
            { keyword: 'AI 글쓰기', rank: 1 },
            { keyword: '블로그 상위노출', rank: 2 },
            { keyword: '검색엔진 최적화', rank: 3 },
            { keyword: '네이버 블로그', rank: 4 },
            { keyword: '티스토리 수익', rank: 5 }
          ]);
        }
      } else {
        console.warn('실시간 검색어 API 호출 실패, 데모 데이터 사용');
        setNaverKeywords([
          { keyword: '블로그 수익화', rank: 1 },
          { keyword: 'SEO 최적화', rank: 2 },
          { keyword: '키워드 분석', rank: 3 },
          { keyword: '구글 애드센스', rank: 4 },
          { keyword: '콘텐츠 마케팅', rank: 5 }
        ]);
        setGoogleKeywords([
          { keyword: 'AI 글쓰기', rank: 1 },
          { keyword: '블로그 상위노출', rank: 2 },
          { keyword: '검색엔진 최적화', rank: 3 },
          { keyword: '네이버 블로그', rank: 4 },
          { keyword: '티스토리 수익', rank: 5 }
        ]);
      }
    } catch (error) {
      console.error('실시간 검색어 조회 오류:', error);
      setNaverKeywords([
        { keyword: '블로그 수익화', rank: 1 },
        { keyword: 'SEO 최적화', rank: 2 },
        { keyword: '키워드 분석', rank: 3 },
        { keyword: '구글 애드센스', rank: 4 },
        { keyword: '콘텐츠 마케팅', rank: 5 }
      ]);
      setGoogleKeywords([
        { keyword: 'AI 글쓰기', rank: 1 },
        { keyword: '블로그 상위노출', rank: 2 },
        { keyword: '검색엔진 최적화', rank: 3 },
        { keyword: '네이버 블로그', rank: 4 },
        { keyword: '티스토리 수익', rank: 5 }
      ]);
    }
  };

  const extractVideoId = (url: string): string | null => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    if (youtubeMatch) return youtubeMatch[1];

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return vimeoMatch[1];

    return null;
  };

  const getEmbedUrl = (url: string): string => {
    const videoId = extractVideoId(url);

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes('vimeo.com')) {
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return url;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#191f28',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard Variable", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Navigation */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '1rem 5%',
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        borderBottom: scrolled ? '1px solid #e5e7eb' : 'none'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#6891f8',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              🔍
            </div>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: '#191f28',
              letterSpacing: '-0.01em'
            }}>
              Keyword Insight Pro
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={onLogin}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'color 0.2s',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#191f28'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
            >
              로그인
            </button>
            <button
              onClick={onRegister}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#6891f8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#5578e8';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(104, 145, 248, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6891f8';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
            >
              무료 시작하기
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '8rem 5% 5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.875rem',
          background: '#eff6ff',
          border: '1px solid #dbeafe',
          borderRadius: '100px',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          color: '#1e40af',
          fontWeight: '500'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            background: '#3b82f6',
            borderRadius: '50%'
          }} />
          AI 기반 블로그 자동 수익화 플랫폼
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: '800',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
          color: '#191f28'
        }}>
          AI가 찾아주는<br />
          <span style={{ color: '#6891f8' }}>최적의 키워드 전략</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#6b7280',
          lineHeight: '1.7',
          maxWidth: '700px',
          margin: '0 auto 2.5rem',
          fontWeight: '400'
        }}>
          경쟁도가 낮고 검색량이 높은 키워드를 찾아<br />
          SEO 최적화된 콘텐츠를 자동으로 생성하세요
        </p>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2.5rem'
        }}>
          <button
            onClick={onRegister}
            style={{
              padding: '0.875rem 2rem',
              background: '#6891f8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(104, 145, 248, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5578e8';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(104, 145, 248, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#6891f8';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(104, 145, 248, 0.2)';
            }}
          >
            7일 무료 체험 시작 →
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          fontSize: '0.875rem',
          color: '#9ca3af'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>
            <span>신용카드 불필요</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>
            <span>7일 무료 체험</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>
            <span>5분 안에 시작</span>
          </div>
        </div>
      </section>

      {/* Trending Keywords Section */}
      <section style={{
        padding: '3rem 5%',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#191f28',
              margin: 0
            }}>
              🔥 실시간 인기 검색어
            </h2>
            <span style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              background: '#ffffff',
              padding: '0.25rem 0.625rem',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}>
              {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* 네이버 실시간 검색어 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid #03c75a'
              }}>
                <span style={{
                  fontSize: '1.5rem'
                }}>
                  N
                </span>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#191f28',
                  margin: 0
                }}>
                  네이버 실시간 검색어
                </h3>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {naverKeywords.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      background: '#fafafa'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: index < 3 ? '#03c75a' : '#9ca3af',
                      minWidth: '1.5rem',
                      textAlign: 'center'
                    }}>
                      {item.rank}
                    </span>
                    <span style={{
                      flex: 1,
                      fontSize: '0.9375rem',
                      fontWeight: '500',
                      color: '#191f28'
                    }}>
                      {item.keyword}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#10b981'
                    }}>
                      🔥
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 구글 트렌드 */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid #4285f4'
              }}>
                <span style={{
                  fontSize: '1.5rem'
                }}>
                  G
                </span>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#191f28',
                  margin: 0
                }}>
                  구글 트렌드
                </h3>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {googleKeywords.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      background: '#fafafa'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: index < 3 ? '#4285f4' : '#9ca3af',
                      minWidth: '1.5rem',
                      textAlign: 'center'
                    }}>
                      {item.rank}
                    </span>
                    <span style={{
                      flex: 1,
                      fontSize: '0.9375rem',
                      fontWeight: '500',
                      color: '#191f28'
                    }}>
                      {item.keyword}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#ea4335'
                    }}>
                      📈
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Videos Section */}
      {promotionVideos.length > 0 && (
        <section style={{
          padding: '4rem 5%',
          background: '#f9fafb'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '3rem'
            }}>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: '700',
                marginBottom: '0.75rem',
                color: '#191f28'
              }}>
                서비스 소개
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Keyword Insight Pro가 어떻게 당신의 블로그를 성장시키는지 확인하세요
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: promotionVideos.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: '1.5rem',
              maxWidth: promotionVideos.length === 1 ? '900px' : '100%',
              margin: '0 auto'
            }}>
              {promotionVideos.map((video) => (
                <div key={video.id} style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden',
                    background: '#000'
                  }}>
                    <iframe
                      src={getEmbedUrl(video.url)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: '#191f28'
                    }}>
                      {video.title}
                    </h3>
                    {video.description && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        lineHeight: '1.6'
                      }}>
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section style={{
        padding: '5rem 5%',
        background: '#ffffff'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3.5rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '0.75rem',
              color: '#191f28'
            }}>
              강력한 기능들
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              데이터 기반의 인사이트로 콘텐츠 전략을 수립하세요
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              {
                icon: '🎯',
                title: 'AI 경쟁력 분석',
                description: '경쟁도가 낮고 검색량이 높은 최적의 키워드를 AI가 자동으로 찾아드립니다',
                color: '#6891f8'
              },
              {
                icon: '📈',
                title: 'SERP 완벽 분석',
                description: '구글과 네이버 검색 결과를 심층 분석하여 상위노출 전략을 제시합니다',
                color: '#ec4899'
              },
              {
                icon: '✨',
                title: 'AI 콘텐츠 생성',
                description: 'SEO 최적화된 고품질 블로그 콘텐츠를 자동으로 생성해드립니다',
                color: '#06b6d4'
              },
              {
                icon: '📊',
                title: '실시간 트렌드',
                description: '빠르게 변하는 검색 트렌드를 실시간으로 포착하고 분석합니다',
                color: '#10b981'
              },
              {
                icon: '💎',
                title: '키워드 저장소',
                description: '발견한 키워드를 체계적으로 관리하고 추적할 수 있습니다',
                color: '#f59e0b'
              },
              {
                icon: '🚀',
                title: '빠른 분석 속도',
                description: '강력한 AI 엔진으로 수천 개의 키워드를 빠르게 분석합니다',
                color: '#8b5cf6'
              },
              {
                icon: '📍',
                title: '블로그 랭킹 추적',
                description: '네이버 블로그 순위를 실시간으로 추적하고 변화를 모니터링합니다 (스마트블록, 블로그 영역, 블로그 탭)',
                color: '#ef4444',
                badge: 'NEW'
              }
            ].map((feature, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '2rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `${feature.color}15`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1.25rem'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: '#191f28',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {feature.title}
                  {feature.badge && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background: '#ef4444',
                      color: '#ffffff',
                      textTransform: 'uppercase'
                    }}>
                      {feature.badge}
                    </span>
                  )}
                </h3>
                <p style={{
                  color: '#6b7280',
                  lineHeight: '1.6',
                  fontSize: '0.9375rem'
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
        background: '#f9fafb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '0.75rem',
              color: '#191f28'
            }}>
              투명한 가격 정책
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              marginBottom: '2rem'
            }}>
              필요에 맞는 플랜을 선택하세요
            </p>

            {/* 월/년 토글 */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '100px',
              padding: '0.25rem',
              gap: '0.25rem'
            }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: billingCycle === 'monthly' ? '#6891f8' : 'transparent',
                  color: billingCycle === 'monthly' ? '#ffffff' : '#6b7280',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                월 단위
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: billingCycle === 'yearly' ? '#6891f8' : 'transparent',
                  color: billingCycle === 'yearly' ? '#ffffff' : '#6b7280',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                연 단위
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '100px',
                  fontWeight: '700'
                }}>
                  20% 할인
                </span>
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              {
                name: 'Free Trial',
                monthlyPrice: 0,
                yearlyPrice: 0,
                features: ['하루 10개 키워드 분석', 'AI 블로그 1개 생성', '경쟁 난이도 분석', '검색량 트렌드 확인', '7일 무료 체험'],
                cta: '지금 무료로 시작',
                popular: false,
                badge: '7일 체험',
                isTrial: true
              },
              {
                name: 'Basic',
                monthlyPrice: 19900,
                yearlyPrice: 191040, // 19,900 * 12 * 0.8 (20% 할인)
                features: ['하루 30개 키워드 분석', 'AI 블로그 10개 생성', '상위 10개 경쟁사 분석', '키워드 저장 100개', '이메일 리포트'],
                cta: 'Basic 시작하기',
                popular: false
              },
              {
                name: 'Professional',
                monthlyPrice: 39900,
                yearlyPrice: 383040, // 39,900 * 12 * 0.8 (20% 할인)
                features: ['1회 검색 100개 포스팅', 'AI 블로그 무제한', '이미지 자동 생성', '무제한 키워드 저장', '이메일 리포트'],
                cta: 'Pro 시작하기',
                popular: true
              },
              {
                name: 'Enterprise',
                monthlyPrice: null,
                yearlyPrice: null,
                features: ['무제한 모든 기능', '다중 사용자 계정', 'API 연동 제공', '1:1 전담 매니저', '맞춤 기능 개발'],
                cta: '상담 요청하기',
                popular: false,
                isEnterprise: true
              }
            ].map((plan, index) => {
              const getPrice = () => {
                if (plan.isTrial) return '₩0';
                if (plan.isEnterprise) return '맞춤 견적';

                const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                return `₩${price?.toLocaleString()}`;
              };

              const getPeriod = () => {
                if (plan.isTrial) return '/7일';
                if (plan.isEnterprise) return '';
                return billingCycle === 'monthly' ? '/월' : '/년';
              };

              const getSavings = () => {
                if (billingCycle === 'yearly' && !plan.isTrial && !plan.isEnterprise && plan.monthlyPrice) {
                  const monthlyCost = plan.monthlyPrice * 12;
                  const yearlyCost = plan.yearlyPrice!;
                  const savings = monthlyCost - yearlyCost;
                  return `연 ₩${savings.toLocaleString()} 절약`;
                }
                return null;
              };

              return (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  border: plan.popular ? '2px solid #6891f8' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '2rem',
                  position: 'relative',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: plan.popular ? '#6891f8' : '#10b981',
                    color: '#ffffff',
                    padding: '0.25rem 0.875rem',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {plan.popular ? '가장 인기' : plan.badge}
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: '#191f28'
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#191f28'
                    }}>
                      {getPrice()}
                    </span>
                    <span style={{
                      color: '#9ca3af',
                      marginLeft: '0.375rem',
                      fontSize: '0.875rem'
                    }}>
                      {getPeriod()}
                    </span>
                  </div>
                  {getSavings() && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#10b981',
                      fontWeight: '600',
                      background: '#d1fae5',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      💰 {getSavings()}
                    </div>
                  )}
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '1.5rem',
                  flex: 1
                }}>
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      style={{
                        padding: '0.625rem 0',
                        borderBottom: idx < plan.features.length - 1 ? '1px solid #f3f4f6' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.625rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span style={{ color: '#10b981', fontSize: '1rem', flexShrink: 0 }}>✓</span>
                      <span style={{ color: '#4b5563' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onRegister}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: plan.popular ? '#6891f8' : '#ffffff',
                    color: plan.popular ? '#ffffff' : '#191f28',
                    border: plan.popular ? 'none' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.background = '#5578e8';
                    } else {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.background = '#6891f8';
                    } else {
                      e.currentTarget.style.background = '#ffffff';
                    }
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2.5rem 5%',
        borderTop: '1px solid #e5e7eb',
        background: '#ffffff'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '0.375rem',
              color: '#191f28'
            }}>
              Keyword Insight Pro
            </div>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              © 2025 All rights reserved.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '1.5rem'
          }}>
            <a href="#" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#191f28'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
            >
              이용약관
            </a>
            <a href="#" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#191f28'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
            >
              개인정보처리방침
            </a>
            <a href="#" style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#191f28'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
            >
              문의하기
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
