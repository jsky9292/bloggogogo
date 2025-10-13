import type { NaverKeywordData } from '../types';

const FLASK_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

    // File System Access API 지원 확인
    if ('showSaveFilePicker' in window) {
      try {
        // 파일 저장 대화상자 열기
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Excel Files',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
          }]
        });

        // 파일 쓰기
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        alert('✅ 파일이 성공적으로 저장되었습니다!');
      } catch (err: any) {
        // 사용자가 취소한 경우
        if (err.name === 'AbortError') {
          console.log('파일 저장이 취소되었습니다.');
          return;
        }
        throw err;
      }
    } else {
      // File System Access API를 지원하지 않는 브라우저의 경우 기존 방식 사용
      // 브라우저 설정에서 "다운로드 전 저장 위치 확인" 옵션을 활성화하면 폴더 선택 가능
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // 정리
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('ℹ️ 파일이 다운로드되었습니다.\n저장 위치를 선택하려면 브라우저 설정에서 "다운로드 전 저장 위치 확인" 옵션을 활성화하세요.');
    }
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    alert('엑셀 파일 다운로드에 실패했습니다.');
  }
}
