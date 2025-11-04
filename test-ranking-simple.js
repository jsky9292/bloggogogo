/**
 * 간단한 네이버 블로그 랭킹 체커
 * Node.js로 직접 실행
 */

// 네이버 검색에서 블로그 링크 추출
function extractBlogLinks(html) {
  const blogLinks = [];

  // 블로그 URL 패턴 찾기
  const blogPattern = /https?:\/\/blog\.naver\.com\/[^"'\s<>]+/g;
  const matches = html.match(blogPattern) || [];

  // 중복 제거
  const uniqueLinks = [...new Set(matches)];

  return uniqueLinks;
}

// URL 정규화
function normalizeUrl(url) {
  return url
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

// 순위 찾기
function findRank(links, targetUrl) {
  const normalizedTarget = normalizeUrl(targetUrl);

  console.log(`\n🔍 찾는 URL (정규화): ${normalizedTarget}`);

  for (let i = 0; i < links.length; i++) {
    const normalizedLink = normalizeUrl(links[i]);

    // 디버깅: 매칭 시도 출력
    if (i < 5) {
      console.log(`  비교 ${i + 1}: ${normalizedLink}`);
      console.log(`    매칭: ${normalizedLink === normalizedTarget ? '✅' : '❌'}`);
      console.log(`    포함: ${normalizedLink.includes(normalizedTarget) || normalizedTarget.includes(normalizedLink) ? '✅' : '❌'}`);
    }

    if (normalizedLink === normalizedTarget ||
        normalizedLink.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedLink)) {
      return {
        found: true,
        rank: i + 1,
        url: links[i]
      };
    }
  }

  return {
    found: false,
    rank: null,
    url: null
  };
}

// 메인 함수
async function checkRanking(keyword, targetUrl) {
  console.log('\n🔍 네이버 블로그 랭킹 확인 시작...');
  console.log(`키워드: ${keyword}`);
  console.log(`대상 URL: ${targetUrl}\n`);

  try {
    // 1. 통합검색
    console.log('📊 통합검색 확인 중...');
    const mainSearchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;
    const mainResponse = await fetch(mainSearchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      }
    });

    if (!mainResponse.ok) {
      throw new Error(`통합검색 요청 실패: ${mainResponse.status}`);
    }

    const mainHtml = await mainResponse.text();
    const mainBlogLinks = extractBlogLinks(mainHtml);

    console.log(`통합검색에서 ${mainBlogLinks.length}개 블로그 링크 발견`);
    console.log('\n📋 발견된 블로그 링크 (상위 30개):');
    mainBlogLinks.slice(0, 30).forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link}`);
    });

    // 스마트블록 (상위 10개)
    const smartblockResult = findRank(mainBlogLinks.slice(0, 10), targetUrl);

    // 블로그 영역 (10~30위)
    const mainBlogResult = findRank(mainBlogLinks.slice(10, 30), targetUrl);

    // 2. 블로그 탭
    console.log('📊 블로그 탭 확인 중...');
    const blogTabUrl = `https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(keyword)}`;
    const blogResponse = await fetch(blogTabUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      }
    });

    if (!blogResponse.ok) {
      throw new Error(`블로그 탭 요청 실패: ${blogResponse.status}`);
    }

    const blogHtml = await blogResponse.text();
    const blogTabLinks = extractBlogLinks(blogHtml);

    console.log(`블로그 탭에서 ${blogTabLinks.length}개 블로그 링크 발견`);
    console.log('\n📋 블로그 탭 링크 (상위 30개):');
    blogTabLinks.slice(0, 30).forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link}`);
    });

    const blogTabResult = findRank(blogTabLinks.slice(0, 100), targetUrl);

    // 결과 출력
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 블로그 랭킹 확인 결과');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('【통합검색 - 스마트블록 (상위 10개)】');
    if (smartblockResult.found) {
      console.log(`  ✅ ${smartblockResult.rank}위 발견!`);
      console.log(`  📌 URL: ${smartblockResult.url}`);
    } else {
      console.log('  ❌ 10위 내 순위 없음');
    }

    console.log('\n【통합검색 - 블로그 영역 (10~30위)】');
    if (mainBlogResult.found) {
      console.log(`  ✅ ${mainBlogResult.rank + 10}위 발견!`);
      console.log(`  📌 URL: ${mainBlogResult.url}`);
    } else {
      console.log('  ❌ 30위 내 순위 없음');
    }

    console.log('\n【블로그 탭 (100위까지)】');
    if (blogTabResult.found) {
      console.log(`  ✅ ${blogTabResult.rank}위 발견!`);
      console.log(`  📌 URL: ${blogTabResult.url}`);
    } else {
      console.log('  ❌ 100위 내 순위 없음');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`확인 시각: ${new Date().toLocaleString('ko-KR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
  }
}

// 실행
const keyword = process.argv[2] || '키워드 분석';
const targetUrl = process.argv[3] || 'https://blog.naver.com/example/222123456';

checkRanking(keyword, targetUrl);
