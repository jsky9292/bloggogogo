/**
 * Firebase Functions for Ranking Tracker
 * 서버 사이드에서 네이버 검색 크롤링 (CORS 문제 해결)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';

// Firebase Admin 초기화
admin.initializeApp();

// 타입 정의
interface RankingCheckResult {
  found: boolean;
  rank: number | null;
  area: 'smartblock' | 'blog' | 'blog_tab';
  areaName: string;
  title?: string;
  checkedAt: string;
}

interface AllRankingResults {
  smartblock: RankingCheckResult;
  mainBlog: RankingCheckResult;
  blogTab: RankingCheckResult;
}

/**
 * 네이버 통합검색에서 순위 확인
 */
export const checkNaverMainSearch = functions
  .region('asia-northeast3') // 서울 리전
  .https.onCall(async (data, context) => {
    try {
      const { keyword, targetUrl } = data;

      // 인증 확인 (Emulator 테스트를 위해 임시 비활성화)
      // if (!context.auth) {
      //   throw new functions.https.HttpsError(
      //     'unauthenticated',
      //     '로그인이 필요합니다.'
      //   );
      // }

      // 입력 검증
      if (!keyword || !targetUrl) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          '키워드와 URL이 필요합니다.'
        );
      }

      functions.logger.info('통합검색 순위 확인 시작', { keyword, targetUrl });

      const normalizeUrl = (url: string): string => {
        return url
          .replace(/^(https?:\/\/)?(www\.)?/, '')
          .replace(/\?.*$/, '')
          .replace(/\/$/, '')
          .toLowerCase();
      };

      const normalizedTargetUrl = normalizeUrl(targetUrl);
      const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;

      // Puppeteer로 블로그 링크 추출
      const blogLinks = await fetchNaverSearch(searchUrl);

      // 스마트블록 영역 (상위 10개)
      const smartblockResult = findRank(blogLinks.slice(0, 10), normalizedTargetUrl);

      // 블로그 영역 (10~30위)
      const mainBlogResult = findRank(blogLinks.slice(10, 30), normalizedTargetUrl);

      const results = {
        smartblock: {
          ...smartblockResult,
          area: 'smartblock' as const,
          areaName: '통합검색-스마트블록',
          checkedAt: new Date().toISOString()
        },
        mainBlog: {
          ...mainBlogResult,
          area: 'blog' as const,
          areaName: '통합검색-블로그',
          checkedAt: new Date().toISOString()
        }
      };

      functions.logger.info('통합검색 순위 확인 완료', results);

      return results;

    } catch (error) {
      functions.logger.error('통합검색 순위 확인 오류', error);
      throw new functions.https.HttpsError('internal', '순위 확인 중 오류가 발생했습니다.');
    }
  });

/**
 * 네이버 블로그 탭에서 순위 확인
 */
export const checkNaverBlogTab = functions
  .region('asia-northeast3')
  .https.onCall(async (data, context) => {
    try {
      const { keyword, targetUrl } = data;

      // if (!context.auth) {
      //   throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
      // }

      if (!keyword || !targetUrl) {
        throw new functions.https.HttpsError('invalid-argument', '키워드와 URL이 필요합니다.');
      }

      functions.logger.info('블로그 탭 순위 확인 시작', { keyword, targetUrl });

      const normalizeUrl = (url: string): string => {
        return url
          .replace(/^(https?:\/\/)?(www\.)?/, '')
          .replace(/\?.*$/, '')
          .replace(/\/$/, '')
          .toLowerCase();
      };

      const normalizedTargetUrl = normalizeUrl(targetUrl);
      const searchUrl = `https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(keyword)}`;

      // Puppeteer로 블로그 링크 추출
      const blogLinks = await fetchNaverSearch(searchUrl);
      const result = findRank(blogLinks.slice(0, 100), normalizedTargetUrl);

      const blogTabResult: RankingCheckResult = {
        ...result,
        area: 'blog_tab',
        areaName: '블로그탭',
        checkedAt: new Date().toISOString()
      };

      functions.logger.info('블로그 탭 순위 확인 완료', blogTabResult);

      return blogTabResult;

    } catch (error) {
      functions.logger.error('블로그 탭 순위 확인 오류', error);
      throw new functions.https.HttpsError('internal', '순위 확인 중 오류가 발생했습니다.');
    }
  });

/**
 * 모든 영역 순위 확인 (통합)
 */
export const checkAllRankings = functions
  .region('asia-northeast3')
  .runWith({ timeoutSeconds: 120 }) // 2분 타임아웃
  .https.onCall(async (data, context) => {
    try {
      const { keyword, targetUrl } = data;

      // if (!context.auth) {
      //   throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
      // }

      if (!keyword || !targetUrl) {
        throw new functions.https.HttpsError('invalid-argument', '키워드와 URL이 필요합니다.');
      }

      functions.logger.info('전체 순위 확인 시작', { keyword, targetUrl, userId: context.auth?.uid });

      const normalizeUrl = (url: string): string => {
        return url
          .replace(/^(https?:\/\/)?(www\.)?/, '')
          .replace(/\?.*$/, '')
          .replace(/\/$/, '')
          .toLowerCase();
      };

      const normalizedTargetUrl = normalizeUrl(targetUrl);

      // 통합검색과 블로그 탭 병렬 처리
      const [mainBlogLinks, blogTabLinks] = await Promise.all([
        fetchNaverSearch(`https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`),
        fetchNaverSearch(`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(keyword)}`)
      ]);

      functions.logger.info('통합검색 링크 추출 결과', {
        totalLinks: mainBlogLinks.length,
        first10: mainBlogLinks.slice(0, 10).map(l => l.url)
      });

      const smartblockResult = findRank(mainBlogLinks.slice(0, 10), normalizedTargetUrl);
      const mainBlogResult = findRank(mainBlogLinks.slice(10, 30), normalizedTargetUrl);

      functions.logger.info('블로그탭 링크 추출 결과', {
        totalLinks: blogTabLinks.length,
        first10: blogTabLinks.slice(0, 10).map(l => l.url)
      });
      const blogTabResult = findRank(blogTabLinks.slice(0, 100), normalizedTargetUrl);

      const results: AllRankingResults = {
        smartblock: {
          ...smartblockResult,
          area: 'smartblock',
          areaName: '통합검색-스마트블록',
          checkedAt: new Date().toISOString()
        },
        mainBlog: {
          ...mainBlogResult,
          area: 'blog',
          areaName: '통합검색-블로그',
          checkedAt: new Date().toISOString()
        },
        blogTab: {
          ...blogTabResult,
          area: 'blog_tab',
          areaName: '블로그탭',
          checkedAt: new Date().toISOString()
        }
      };

      functions.logger.info('전체 순위 확인 완료', {
        smartblock: results.smartblock.rank,
        mainBlog: results.mainBlog.rank,
        blogTab: results.blogTab.rank
      });

      return results;

    } catch (error) {
      functions.logger.error('전체 순위 확인 오류', error);
      throw new functions.https.HttpsError('internal', '순위 확인 중 오류가 발생했습니다.');
    }
  });

// ==================== 헬퍼 함수 ====================

/**
 * 네이버 검색 요청 (Puppeteer 사용)
 * DOM에서 직접 링크 추출
 */
async function fetchNaverSearch(url: string): Promise<Array<{ url: string; title: string }>> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // User Agent 설정
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 페이지 이동
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 블로그 검색 결과를 기다림
    try {
      await page.waitForSelector('a[href*="blog.naver.com"]', { timeout: 10000 });
    } catch (e) {
      functions.logger.warn('블로그 링크 대기 타임아웃');
    }

    // 스크롤 여러 번 (더 많은 콘텐츠 로드)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 추가 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // iframe 확인
    const frames = page.frames();
    functions.logger.info('페이지 프레임 수', { frameCount: frames.length });

    // DOM 구조 분석
    const domInfo = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a[href*="blog.naver.com"]');
      const allAnchors = document.querySelectorAll('a');
      const iframes = document.querySelectorAll('iframe');

      return {
        totalAnchors: allAnchors.length,
        blogAnchors: anchors.length,
        iframeCount: iframes.length,
        iframeSrcs: Array.from(iframes).map(f => (f as HTMLIFrameElement).src),
        sampleHTML: document.body.innerHTML.substring(0, 2000)
      };
    });

    functions.logger.info('DOM 구조 분석', domInfo);

    // DOM에서 직접 링크 추출
    const extractionResult = await page.evaluate(() => {
      const links: Array<{ url: string; title: string }> = [];
      const uniqueUrls = new Set<string>();
      const allHrefs: string[] = [];

      // 모든 a 태그 중 blog.naver.com이 포함된 것만 추출
      const anchorElements = document.querySelectorAll('a[href*="blog.naver.com"]');

      // 디버깅을 위해 모든 href 수집
      anchorElements.forEach((anchor) => {
        const href = (anchor as HTMLAnchorElement).href;
        allHrefs.push(href);
      });

      anchorElements.forEach((anchor) => {
        const href = (anchor as HTMLAnchorElement).href;

        // URL 정규화
        let cleanUrl = href.split('?')[0].split('#')[0];

        // blog.naver.com 다음에 슬래시와 내용이 있는 URL (포스트 번호가 있거나 없거나)
        // 예: blog.naver.com/username/123456 또는 blog.naver.com/username
        const blogPattern = /blog\.naver\.com\/[a-zA-Z0-9_-]+/;

        if (blogPattern.test(cleanUrl)) {
          // 중복 제거를 위해 포스트 번호 부분까지만 사용
          const normalizedUrl = cleanUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');

          if (!uniqueUrls.has(normalizedUrl)) {
            uniqueUrls.add(normalizedUrl);

            // 제목 추출 시도
            const titleElement = anchor.querySelector('.title_link') ||
                                 anchor.querySelector('.api_txt_lines') ||
                                 anchor.querySelector('.total_tit') ||
                                 anchor;
            const title = titleElement?.textContent?.trim() || '블로그 포스트';

            links.push({ url: cleanUrl, title });
          }
        }
      });

      return { links, allHrefs };
    });

    const blogLinks = extractionResult.links;

    // 모든 href 로깅 (처음 30개만)
    functions.logger.info('모든 blog.naver.com href (처음 30개)', {
      totalHrefs: extractionResult.allHrefs.length,
      hrefs: extractionResult.allHrefs.slice(0, 30)
    });

    functions.logger.info('DOM에서 추출한 링크', {
      totalLinks: blogLinks.length,
      first10: blogLinks.slice(0, 10).map(l => l.url)
    });

    return blogLinks;
  } finally {
    await browser.close();
  }
}

/**
 * 특정 URL의 순위 찾기
 */
function findRank(
  links: Array<{ url: string; title: string }>,
  targetUrl: string
): { found: boolean; rank: number | null; title?: string } {
  for (let i = 0; i < links.length; i++) {
    const linkUrl = links[i].url
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\?.*$/, '')
      .replace(/\/$/, '')
      .toLowerCase();

    if (linkUrl.includes(targetUrl) || targetUrl.includes(linkUrl)) {
      return {
        found: true,
        rank: i + 1,
        title: links[i].title
      };
    }
  }

  return { found: false, rank: null };
}
