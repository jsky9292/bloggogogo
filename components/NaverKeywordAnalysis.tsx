import React from 'react';
import type { NaverKeywordData } from '../types';

interface NaverKeywordAnalysisProps {
  data: NaverKeywordData[];
  onDownload?: (filename: string) => void;
  filename?: string;
  onAnalyzeCompetition?: () => void;
  analyzing?: boolean;
}

const NaverKeywordAnalysis: React.FC<NaverKeywordAnalysisProps> = ({ data, onDownload, filename, onAnalyzeCompetition, analyzing }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const hasCompetitionData = data[0].총문서수 !== undefined;

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
          📊 네이버 키워드 분석 결과 ({data.length}개)
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
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

          {hasCompetitionData && filename && onDownload && (
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
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                연관키워드
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                모바일검색량
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                PC검색량
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'right',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                총검색량
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'center',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid #e5e7eb'
              }}>
                경쟁강도
              </th>
              {hasCompetitionData && (
                <>
                  <th style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    총문서수
                  </th>
                  <th style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    경쟁률
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
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
