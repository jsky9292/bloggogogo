import React, { useState, useMemo } from 'react';
import type { NaverKeywordData } from '../types';

interface NaverKeywordAnalysisProps {
  data: NaverKeywordData[];
  onDownload?: (filename: string) => void;
  filename?: string;
  onAnalyzeCompetition?: () => void;
  analyzing?: boolean;
}

type SortField = 'keyword' | 'mobile' | 'pc' | 'total' | 'competition' | 'docCount' | 'ratio';
type SortDirection = 'asc' | 'desc' | null;

const NaverKeywordAnalysis: React.FC<NaverKeywordAnalysisProps> = ({ data, onDownload, filename, onAnalyzeCompetition, analyzing }) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [deletedKeywords, setDeletedKeywords] = useState<Set<string>>(new Set());

  if (!data || data.length === 0) {
    return null;
  }

  // 삭제되지 않은 데이터만 필터링
  const filteredData = data.filter(row => !deletedKeywords.has(row.연관키워드));

  const hasCompetitionData = data[0].총문서수 !== undefined;

  // 정렬 함수
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 같은 필드 클릭: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      // 다른 필드 클릭: asc부터 시작
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 키워드 삭제 함수
  const handleDeleteKeyword = (keyword: string) => {
    setDeletedKeywords(prev => {
      const newSet = new Set(prev);
      newSet.add(keyword);
      return newSet;
    });
  };

  // 삭제 취소 함수
  const handleRestoreAll = () => {
    setDeletedKeywords(new Set());
  };

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'keyword':
          aValue = a.연관키워드;
          bValue = b.연관키워드;
          break;
        case 'mobile':
          aValue = a.모바일검색량;
          bValue = b.모바일검색량;
          break;
        case 'pc':
          aValue = a.PC검색량;
          bValue = b.PC검색량;
          break;
        case 'total':
          aValue = a.총검색량;
          bValue = b.총검색량;
          break;
        case 'competition':
          const competitionOrder = { '낮음': 1, '중간': 2, '높음': 3 };
          aValue = competitionOrder[a.경쟁강도 as keyof typeof competitionOrder] || 0;
          bValue = competitionOrder[b.경쟁강도 as keyof typeof competitionOrder] || 0;
          break;
        case 'docCount':
          aValue = a.총문서수 || 0;
          bValue = b.총문서수 || 0;
          break;
        case 'ratio':
          aValue = a.경쟁률 || 0;
          bValue = b.경쟁률 || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }, [filteredData, sortField, sortDirection]);

  // 정렬 아이콘 컴포넌트
  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <span style={{ opacity: 0.3, marginLeft: '4px' }}>⇅</span>
      );
    }
    return (
      <span style={{ marginLeft: '4px' }}>
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0
        }}>
          📊 네이버 키워드 분석 결과 ({filteredData.length}개)
          {deletedKeywords.size > 0 && (
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '400',
              marginLeft: '0.5rem'
            }}>
              (삭제됨: {deletedKeywords.size}개)
            </span>
          )}
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {deletedKeywords.size > 0 && (
            <button
              onClick={handleRestoreAll}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.2)';
              }}
            >
              ↺ 삭제 취소
            </button>
          )}
          {!hasCompetitionData && onAnalyzeCompetition && (
            <button
              onClick={onAnalyzeCompetition}
              disabled={analyzing}
              style={{
                padding: '0.5rem 1.25rem',
                background: analyzing
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: analyzing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: analyzing
                  ? 'none'
                  : '0 2px 4px rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!analyzing) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!analyzing) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                }
              }}
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>경쟁 분석 중...</span>
                </>
              ) : (
                <>
                  <span>🎯</span>
                  <span>경쟁도 분석 시작</span>
                </>
              )}
            </button>
          )}

          {filename && onDownload && (
            <button
              onClick={() => onDownload(filename)}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
              }}
            >
              📥 엑셀 다운로드
            </button>
          )}
        </div>
      </div>

      <div style={{
        overflowX: 'auto',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'center',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb',
                width: '60px'
              }}>
                삭제
              </th>
              <th
                onClick={() => handleSort('keyword')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                연관키워드 <SortIcon field="keyword" />
              </th>
              <th
                onClick={() => handleSort('mobile')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                모바일검색량 <SortIcon field="mobile" />
              </th>
              <th
                onClick={() => handleSort('pc')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                PC검색량 <SortIcon field="pc" />
              </th>
              <th
                onClick={() => handleSort('total')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                총검색량 <SortIcon field="total" />
              </th>
              <th
                onClick={() => handleSort('competition')}
                style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                경쟁강도 <SortIcon field="competition" />
              </th>
              {hasCompetitionData && (
                <>
                  <th
                    onClick={() => handleSort('docCount')}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    총문서수 <SortIcon field="docCount" />
                  </th>
                  <th
                    onClick={() => handleSort('ratio')}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    경쟁률 <SortIcon field="ratio" />
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={row.연관키워드}
                style={{
                  background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb';
                }}
              >
                <td style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <button
                    onClick={() => handleDeleteKeyword(row.연관키워드)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#03C75A',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#02B350';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#03C75A';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="이 키워드 삭제"
                  >
                    ✕
                  </button>
                </td>
                <td style={{
                  padding: '0.75rem 1rem',
                  color: '#1f2937',
                  fontWeight: '500',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {row.연관키워드}
                </td>
                <td style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'right',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {row.모바일검색량.toLocaleString()}
                </td>
                <td style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'right',
                  color: '#6b7280',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {row.PC검색량.toLocaleString()}
                </td>
                <td style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'right',
                  color: '#1f2937',
                  fontWeight: '600',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {row.총검색량.toLocaleString()}
                </td>
                <td style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: row.경쟁강도 === '높음' ? '#fee2e2' :
                               row.경쟁강도 === '중간' ? '#fef3c7' : '#d1fae5',
                    color: row.경쟁강도 === '높음' ? '#991b1b' :
                           row.경쟁강도 === '중간' ? '#92400e' : '#065f46'
                  }}>
                    {row.경쟁강도}
                  </span>
                </td>
                {hasCompetitionData && (
                  <>
                    <td style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      color: '#6b7280',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {row.총문서수?.toLocaleString()}
                    </td>
                    <td style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      color: '#1f2937',
                      fontWeight: '600',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {row.경쟁률 ? `${(row.경쟁률 * 100).toFixed(2)}%` : '-'}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#f0f9ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#1e40af',
          lineHeight: '1.5'
        }}>
          💡 <strong>Tip:</strong> 경쟁률이 낮을수록 상위 노출 가능성이 높습니다.
          {hasCompetitionData && ' 경쟁 분석 결과를 참고하여 최적의 키워드를 선택하세요.'}
        </p>
      </div>
    </div>
  );
};

export default NaverKeywordAnalysis;
