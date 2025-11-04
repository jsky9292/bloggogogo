/**
 * Playwright를 사용한 정확한 네이버 블로그 랭킹 체커
 * 실제 브라우저로 JavaScript 렌더링 후 데이터 수집
 */

import { chromium } from 'playwright';

// URL 정규화
function normalizeUrl(url) {
  return url
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

// 메인 함수
async function checkRanking(keyword, targetUrl) {
  console.log('\n🔍 네이버 블로그 랭킹 확인 시작 (Playwright)...');
  console.log(`키워드: ${keyword}`);
  console.log(`대상 URL: ${targetUrl}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    const normalizedTarget = normalizeUrl(targetUrl);
    console.log(`정규화된 대상: ${normalizedTarget}\n`);

    // 1. 통합검색
    console.log('📊 통합검색 페이지 로드 중...');
    await page.goto(`https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForTimeout(2000);

    // 모든 블로그 링크 추출
    const mainBlogLinks = await page.evaluate(() => {
      const links = [];
      const anchors = document.querySelectorAll('a[href*="blog.naver.com"]');

      anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.includes('blog.naver.com')) {
          // URL에서 실제 블로그 주소 추출
          const match = href.match(/blog\.naver\.com\/([^\/\?]+)(?:\/(\d+))?/);
          if (match) {
            const blogId = match[1];
            const postId = match[2];
            if (postId) {
              links.push(`https://blog.naver.com/${blogId}/${postId}`);
            }
          }
        }
      });

      return [...new Set(links)]; // 중복 제거
    });

    console.log(`통합검색에서 ${mainBlogLinks.length}개 블로그 링크 발견`);
    console.log('\n📋 발견된 블로그 링크 (상위 30개):');
    mainBlogLinks.slice(0, 30).forEach((link, idx) => {
      const normalized = normalizeUrl(link);
      const isMatch = normalized === normalizedTarget ||
                      normalized.includes(normalizedTarget) ||
                      normalizedTarget.includes(normalized);
      console.log(`  ${idx + 1}. ${link} ${isMatch ? '✅ 매칭!' : ''}`);
    });

    // 스마트블록 (상위 10개)
    let smartblockRank = null;
    for (let i = 0; i < Math.min(10, mainBlogLinks.length); i++) {
      const normalized = normalizeUrl(mainBlogLinks[i]);
      if (normalized === normalizedTarget ||
          normalized.includes(normalizedTarget) ||
          normalizedTarget.includes(normalized)) {
        smartblockRank = i + 1;
        break;
      }
    }

    // 블로그 영역 (10~30위)
    let mainBlogRank = null;
    for (let i = 10; i < Math.min(30, mainBlogLinks.length); i++) {
      const normalized = normalizeUrl(mainBlogLinks[i]);
      if (normalized === normalizedTarget ||
          normalized.includes(normalizedTarget) ||
          normalizedTarget.includes(normalized)) {
        mainBlogRank = i + 1;
        break;
      }
    }

    // 2. 블로그 탭
    console.log('\n📊 블로그 탭 로드 중...');
    await page.goto(`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(keyword)}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const blogTabLinks = await page.evaluate(() => {
      const links = [];
      const anchors = document.querySelectorAll('a[href*="blog.naver.com"]');

      anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.includes('blog.naver.com')) {
          const match = href.match(/blog\.naver\.com\/([^\/\?]+)(?:\/(\d+))?/);
          if (match) {
            const blogId = match[1];
            const postId = match[2];
            if (postId) {
              links.push(`https://blog.naver.com/${blogId}/${postId}`);
            }
          }
        }
      });

      return [...new Set(links)];
    });

    console.log(`블로그 탭에서 ${blogTabLinks.length}개 블로그 링크 발견`);
    console.log('\n📋 블로그 탭 링크 (상위 30개):');
    blogTabLinks.slice(0, 30).forEach((link, idx) => {
      const normalized = normalizeUrl(link);
      const isMatch = normalized === normalizedTarget ||
                      normalized.includes(normalizedTarget) ||
                      normalizedTarget.includes(normalized);
      console.log(`  ${idx + 1}. ${link} ${isMatch ? '✅ 매칭!' : ''}`);
    });

    let blogTabRank = null;
    for (let i = 0; i < Math.min(100, blogTabLinks.length); i++) {
      const normalized = normalizeUrl(blogTabLinks[i]);
      if (normalized === normalizedTarget ||
          normalized.includes(normalizedTarget) ||
          normalizedTarget.includes(normalized)) {
        blogTabRank = i + 1;
        break;
      }
    }

    // 결과 출력
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 블로그 랭킹 확인 결과');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('【통합검색 - 스마트블록 (상위 10개)】');
    if (smartblockRank) {
      console.log(`  ✅ ${smartblockRank}위 발견!`);
      console.log(`  📌 URL: ${mainBlogLinks[smartblockRank - 1]}`);
    } else {
      console.log('  ❌ 10위 내 순위 없음');
    }

    console.log('\n【통합검색 - 블로그 영역 (10~30위)】');
    if (mainBlogRank) {
      console.log(`  ✅ ${mainBlogRank}위 발견!`);
      console.log(`  📌 URL: ${mainBlogLinks[mainBlogRank - 1]}`);
    } else {
      console.log('  ❌ 30위 내 순위 없음');
    }

    console.log('\n【블로그 탭 (100위까지)】');
    if (blogTabRank) {
      console.log(`  ✅ ${blogTabRank}위 발견!`);
      console.log(`  📌 URL: ${blogTabLinks[blogTabRank - 1]}`);
    } else {
      console.log('  ❌ 100위 내 순위 없음');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`확인 시각: ${new Date().toLocaleString('ko-KR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

// 실행
const keyword = process.argv[2] || '고등어구이';
const targetUrl = process.argv[3] || 'https://blog.naver.com/mjinchul1/224034997100';

checkRanking(keyword, targetUrl);
