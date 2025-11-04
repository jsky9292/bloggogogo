/**
 * 네이버 검색 결과 HTML 저장해서 분석
 */

async function fetchAndSaveHtml() {
  const keyword = '고등어구이';
  const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;

  console.log('검색 중:', url);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    }
  });

  const html = await response.text();

  // HTML 저장
  const fs = await import('fs');
  fs.writeFileSync('naver-search-result.html', html);

  console.log('✅ HTML 저장 완료: naver-search-result.html');
  console.log('파일 크기:', html.length, '문자');

  // 블로그 링크 패턴들 찾기
  console.log('\n🔍 발견된 패턴들:');

  const patterns = [
    /https?:\/\/blog\.naver\.com\/[^"'\s<>]+/g,
    /blog\.naver\.com\/[^"'\s<>]+/g,
    /\/[a-zA-Z0-9_-]+\/[0-9]+/g,
  ];

  patterns.forEach((pattern, idx) => {
    const matches = html.match(pattern) || [];
    const unique = [...new Set(matches)];
    console.log(`\n패턴 ${idx + 1}: ${unique.length}개 발견`);
    unique.slice(0, 10).forEach(m => console.log(`  - ${m}`));
  });
}

fetchAndSaveHtml();
