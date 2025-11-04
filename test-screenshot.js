/**
 * 네이버 검색 결과 스크린샷 저장
 */

import { chromium } from 'playwright';

async function screenshot() {
  const keyword = '고등어구이';

  const browser = await chromium.launch({ headless: false }); // 화면 보이게
  const page = await browser.newPage();

  // 통합검색
  console.log('통합검색 페이지 로딩...');
  await page.goto(`https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'naver-main-search.png', fullPage: true });
  console.log('✅ 스크린샷 저장: naver-main-search.png');

  // 블로그 탭
  console.log('블로그 탭 페이지 로딩...');
  await page.goto(`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(keyword)}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'naver-blog-tab.png', fullPage: true });
  console.log('✅ 스크린샷 저장: naver-blog-tab.png');

  // 페이지에서 모든 텍스트 추출
  const content = await page.evaluate(() => document.body.innerText);

  // mjinchul1 검색
  if (content.includes('mjinchul1')) {
    console.log('\n✅ "mjinchul1"이 페이지에 있습니다!');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('mjinchul1')) {
        console.log(`  라인 ${idx}: ${line}`);
      }
    });
  } else {
    console.log('\n❌ "mjinchul1"이 페이지에 없습니다.');
    console.log('이 블로그는 "고등어구이" 키워드로 노출되지 않는 것 같습니다.');
  }

  await browser.close();
}

screenshot();
