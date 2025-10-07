import type { NaverKeywordData } from '../types';

const FLASK_API_URL = 'http://localhost:8080';

export async function searchNaverKeywords(keyword: string): Promise<NaverKeywordData[]> {
  try {
    const response = await fetch(`${FLASK_API_URL}/search_keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '키워드 검색에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('네이버 키워드 검색 중 오류가 발생했습니다.');
  }
}

export async function analyzeNaverCompetition(keywords: NaverKeywordData[]): Promise<NaverKeywordData[]> {
  try {
    const response = await fetch(`${FLASK_API_URL}/analyze_competition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keywords }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '경쟁 분석에 실패했습니다.');
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('네이버 경쟁 분석 중 오류가 발생했습니다.');
  }
}

export async function getAnalysisProgress(): Promise<{ current: number; total: number; message: string }> {
  try {
    const response = await fetch(`${FLASK_API_URL}/progress`);
    return await response.json();
  } catch (error) {
    console.error('진행률 조회 오류:', error);
    return { current: 0, total: 0, message: '' };
  }
}

export async function downloadExcel(filename: string) {
  try {
    const response = await fetch(`${FLASK_API_URL}/download/${filename}`);
    const blob = await response.blob();

    // 다운로드 링크 생성
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // 정리
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    alert('엑셀 파일 다운로드에 실패했습니다.');
  }
}
