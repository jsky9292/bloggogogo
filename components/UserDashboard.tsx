import React, { useEffect, useState } from 'react';
import { UserProfile, checkUsageLimit, getDailyUsage, PLAN_DAILY_LIMITS } from '../src/config/firebase';
import RankingTracker from './RankingTracker';
import ApiKeySettings from './ApiKeySettings';

interface UserDashboardProps {
  user: UserProfile;
  onClose: () => void;
  onUpgradePlan: () => void;
  onApiKeyUpdate?: (apiKey: string) => void;
  onNaverApiKeyUpdate?: (clientId: string, clientSecret: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onClose, onUpgradePlan, onApiKeyUpdate, onNaverApiKeyUpdate }) => {
  const [selectedTab, setSelectedTab] = useState<'info' | 'ranking'>('info');
  const [remainingSearches, setRemainingSearches] = useState<number>(0);
  const [hasLimit, setHasLimit] = useState<boolean>(true);
  const [dailyUsage, setDailyUsage] = useState<{ keywordSearches: number; blogGenerations: number; limit: typeof PLAN_DAILY_LIMITS[keyof typeof PLAN_DAILY_LIMITS] } | null>(null);

  useEffect(() => {
    calculateRemainingSearches();
    fetchDailyUsage();
  }, [user]);

  const fetchDailyUsage = async () => {
    if (user && user.uid) {
      const usage = await getDailyUsage(user.uid);
      setDailyUsage(usage);
    }
  };

  const calculateRemainingSearches = () => {
    const limits: Record<string, number> = {
      free: 10,
      basic: 50,
      pro: 200,
      enterprise: Infinity
    };

    const used = user.usage?.searches || 0;
    const limit = limits[user.plan];

    if (limit === Infinity) {
      setHasLimit(false);
      setRemainingSearches(0);
    } else {
      setHasLimit(true);
      setRemainingSearches(Math.max(0, limit - used));
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700',
      enterprise: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
    };
    return colors[plan] || colors.free;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '1024px',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, #2563eb, #3b82f6)',
          padding: '24px 32px',
          color: '#ffffff'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>사용자 대시보드</h2>
            <button
              onClick={onClose}
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          height: 'calc(90vh - 100px)'
        }}>
          {/* Left Sidebar - Tabs */}
          <div style={{
            width: '200px',
            borderRight: '1px solid #e5e7eb',
            padding: '16px 0',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setSelectedTab('info')}
              style={{
                width: '100%',
                padding: '12px 20px',
                textAlign: 'left',
                border: 'none',
                background: selectedTab === 'info' ? '#eff6ff' : 'transparent',
                color: selectedTab === 'info' ? '#2563eb' : '#6b7280',
                fontWeight: selectedTab === 'info' ? '600' : '400',
                cursor: 'pointer',
                borderLeft: selectedTab === 'info' ? '3px solid #2563eb' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== 'info') {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== 'info') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              📊 내 정보
            </button>
            <button
              onClick={() => setSelectedTab('ranking')}
              style={{
                width: '100%',
                padding: '12px 20px',
                textAlign: 'left',
                border: 'none',
                background: selectedTab === 'ranking' ? '#eff6ff' : 'transparent',
                color: selectedTab === 'ranking' ? '#2563eb' : '#6b7280',
                fontWeight: selectedTab === 'ranking' ? '600' : '400',
                cursor: 'pointer',
                borderLeft: selectedTab === 'ranking' ? '3px solid #2563eb' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== 'ranking') {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== 'ranking') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              📍 블로그 랭킹 추적
            </button>
          </div>

          {/* Right Content Area */}
          <div style={{
            flex: 1,
            padding: '32px',
            overflowY: 'auto'
          }}>
            {selectedTab === 'info' && (
              <>
                {/* User Info Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#1f2937'
                  }}>내 정보</h3>
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px'
              }}>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#4b5563'
                  }}>이름</label>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    color: '#111827'
                  }}>{user.name}</p>
                </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#4b5563'
                  }}>이메일</label>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    color: '#111827'
                  }}>{user.email}</p>
                </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#4b5563'
                  }}>가입일</label>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    color: '#111827'
                  }}>{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <label style={{
                    fontSize: '0.875rem',
                    color: '#4b5563'
                  }}>역할</label>
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    color: '#111827'
                  }}>
                    {user.role === 'admin' ? '관리자' : '일반 사용자'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Settings Section */}
          {onApiKeyUpdate && onNaverApiKeyUpdate && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#1f2937'
              }}>API 키 설정</h3>
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '24px',
                border: '1px solid #e5e7eb'
              }}>
                <ApiKeySettings
                  onApiKeyUpdate={onApiKeyUpdate}
                  onNaverApiKeyUpdate={onNaverApiKeyUpdate}
                />
              </div>
            </div>
          )}

          {/* Subscription Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1f2937'
            }}>구독 정보</h3>
            <div style={{
              background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
              borderRadius: '8px',
              padding: '24px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#111827'
                    }}>현재 플랜</span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      ...(user.plan === 'enterprise' ? {
                        background: 'linear-gradient(to right, #fae8ff, #fce7f3)',
                        color: '#a855f7'
                      } : user.plan === 'pro' ? {
                        background: 'linear-gradient(to right, #fef3c7, #fed7aa)',
                        color: '#ea580c'
                      } : user.plan === 'basic' ? {
                        backgroundColor: '#dbeafe',
                        color: '#1e40af'
                      } : {
                        backgroundColor: '#f3f4f6',
                        color: '#374151'
                      })
                    }}>
                      {user.plan.toUpperCase()}
                    </span>
                  </div>
                  {user.subscriptionStart && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#4b5563'
                    }}>
                      구독 시작일: {formatDate(user.subscriptionStart)}
                    </p>
                  )}
                  {user.subscriptionEnd && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#4b5563'
                    }}>
                      다음 결제일: {formatDate(user.subscriptionEnd)}
                    </p>
                  )}
                </div>
                {user.plan !== 'enterprise' && (
                  <button
                    onClick={onUpgradePlan}
                    style={{
                      padding: '8px 24px',
                      background: 'linear-gradient(to right, #9333ea, #ec4899)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #7c3aed, #db2777)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #9333ea, #ec4899)';
                    }}
                  >
                    플랜 업그레이드
                  </button>
                )}
              </div>

              {/* Usage Stats */}
              <div style={{
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid #bfdbfe'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px'
                }}>오늘의 사용량</h4>
                {dailyUsage ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 키워드 검색 */}
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#4b5563'
                        }}>키워드 검색</span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827'
                        }}>
                          {dailyUsage.keywordSearches} / {dailyUsage.limit.keywordSearches === -1 ? '∞' : dailyUsage.limit.keywordSearches}
                        </span>
                      </div>
                      {dailyUsage.limit.keywordSearches !== -1 && (
                        <>
                          <div style={{
                            width: '100%',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '9999px',
                            height: '8px'
                          }}>
                            <div
                              style={{
                                background: 'linear-gradient(to right, #3b82f6, #6366f1)',
                                height: '8px',
                                borderRadius: '9999px',
                                transition: 'all 0.3s',
                                width: `${Math.min(100, (dailyUsage.keywordSearches / dailyUsage.limit.keywordSearches) * 100)}%`
                              }}
                            />
                          </div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            marginTop: '8px'
                          }}>
                            {dailyUsage.limit.keywordSearches - dailyUsage.keywordSearches > 0
                              ? `오늘 ${dailyUsage.limit.keywordSearches - dailyUsage.keywordSearches}회 더 사용 가능`
                              : '오늘 사용 가능 횟수를 모두 소진했습니다'}
                          </p>
                        </>
                      )}
                      {dailyUsage.limit.keywordSearches === -1 && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#059669',
                          fontWeight: '500',
                          marginTop: '8px'
                        }}>무제한 사용 가능</p>
                      )}
                    </div>

                    {/* 블로그 생성 */}
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          color: '#4b5563'
                        }}>블로그 생성</span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827'
                        }}>
                          {dailyUsage.blogGenerations} / {dailyUsage.limit.blogGenerations === -1 ? '∞' : dailyUsage.limit.blogGenerations}
                        </span>
                      </div>
                      {dailyUsage.limit.blogGenerations !== -1 && (
                        <>
                          <div style={{
                            width: '100%',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '9999px',
                            height: '8px'
                          }}>
                            <div
                              style={{
                                background: 'linear-gradient(to right, #10b981, #14b8a6)',
                                height: '8px',
                                borderRadius: '9999px',
                                transition: 'all 0.3s',
                                width: `${Math.min(100, (dailyUsage.blogGenerations / dailyUsage.limit.blogGenerations) * 100)}%`
                              }}
                            />
                          </div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            marginTop: '8px'
                          }}>
                            {dailyUsage.limit.blogGenerations - dailyUsage.blogGenerations > 0
                              ? `오늘 ${dailyUsage.limit.blogGenerations - dailyUsage.blogGenerations}회 더 생성 가능`
                              : '오늘 생성 가능 횟수를 모두 소진했습니다'}
                          </p>
                        </>
                      )}
                      {dailyUsage.limit.blogGenerations === -1 && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#059669',
                          fontWeight: '500',
                          marginTop: '8px'
                        }}>무제한 생성 가능</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>사용량 로딩 중...</p>
                )}
              </div>
            </div>
          </div>

          {/* Plan Comparison */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1f2937'
            }}>플랜 비교</h3>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>기능</th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Free</th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Basic</th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#eff6ff'
                    }}>Pro</th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>구독 상태</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>7일 무료 체험</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>₩19,900/월</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#2563eb'
                    }}>₩39,900/월</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>문의</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>일일 키워드 검색</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>10회</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>30회</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#2563eb'
                    }}>100회</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>무제한</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>일일 블로그 생성</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>1회</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>10회</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#2563eb'
                    }}>무제한</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>무제한</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>경쟁력 분석</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>블로그 주제 생성</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>❌</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>AI 글쓰기</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>❌</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>❌</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>API 접근</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>❌</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>❌</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>❌</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>✅</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#111827'
                    }}>가격</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>무료</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>₩19,900/월</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#2563eb'
                    }}>₩39,900/월</td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>문의</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            marginTop: '32px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#374151',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              닫기
            </button>
          </div>
              </>
            )}

            {/* Ranking Tracker Tab */}
            {selectedTab === 'ranking' && (
              <RankingTracker userId={user.uid} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;