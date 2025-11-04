/**
 * 블로그 랭킹 추적 서비스 (2024년 네이버 구조 반영)
 *
 * 추적 영역:
 * 1. 통합검색 - 스마트블록 (구 VIEW 영역, 가장 중요!)
 * 2. 통합검색 - 블로그 영역
 * 3. 블로그 탭 (별도)
 */

import type { RankingCheckResult, SearchArea, AllRankingResults, BlogRankingTracker, RankingHistory } from '../types';
import {
    createRankingTracker,
    getUserRankingTrackers,
    getRankingTracker,
    updateRankingTracker,
    deleteRankingTracker,
    canAddRankingTracker
} from '../src/config/firebase';

/**
 * 네이버 통합검색에서 스마트블록 + 블로그 영역 순위 확인
 */
export async function checkNaverMainSearch(
    keyword: string,
    targetUrl: string
): Promise<{ smartblock: RankingCheckResult; mainBlog: RankingCheckResult }> {
    try {
        const normalizeUrl = (url: string): string => {
            return url
                .replace(/^(https?:\/\/)?(www\.)?/, '')
                .replace(/\?.*$/, '')
                .replace(/\/$/, '')
                .toLowerCase();
        };

        const normalizedTargetUrl = normalizeUrl(targetUrl);
        const searchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`;

        console.log(`🔍 통합검색 확인: ${keyword}`);
        console.log(`📍 타겟 URL: ${targetUrl}`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'ko-KR,ko;q=0.9',
            }
        });

        if (!response.ok) {
            throw new Error(`네이버 검색 실패: ${response.status}`);
        }

        const html = await response.text();

        // 스마트블록 영역과 블로그 영역 구분하여 파싱
        const smartblockResult = await parseSmartblockArea(html, normalizedTargetUrl);
        const mainBlogResult = await parseMainBlogArea(html, normalizedTargetUrl);

        return {
            smartblock: {
                ...smartblockResult,
                area: 'smartblock',
                areaName: '통합검색-스마트블록',
                checkedAt: new Date()
            },
            mainBlog: {
                ...mainBlogResult,
                area: 'blog',
                areaName: '통합검색-블로그',
                checkedAt: new Date()
            }
        };

    } catch (error) {
        console.error('❌ 통합검색 확인 오류:', error);
        throw error;
    }
}

/**
 * 네이버 블로그 탭에서 순위 확인
 */
export async function checkNaverBlogTab(
    keyword: string,
    targetUrl: string
): Promise<RankingCheckResult> {
    try {
        const normalizeUrl = (url: string): string => {
            return url
                .replace(/^(https?:\/\/)?(www\.)?/, '')
                .replace(/\?.*$/, '')
                .replace(/\/$/, '')
                .toLowerCase();
        };

        const normalizedTargetUrl = normalizeUrl(targetUrl);
        const searchUrl = `https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(keyword)}`;

        console.log(`🔍 블로그 탭 확인: ${keyword}`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'ko-KR,ko;q=0.9',
            }
        });

        if (!response.ok) {
            throw new Error(`블로그 탭 검색 실패: ${response.status}`);
        }

        const html = await response.text();
        const result = await parseBlogTabResults(html, normalizedTargetUrl);

        return {
            ...result,
            area: 'blog_tab',
            areaName: '블로그탭',
            checkedAt: new Date()
        };

    } catch (error) {
        console.error('❌ 블로그 탭 확인 오류:', error);
        throw error;
    }
}

/**
 * 모든 영역에서 순위 확인 (통합검색 + 블로그 탭)
 */
export async function checkAllRankings(
    keyword: string,
    targetUrl: string
): Promise<AllRankingResults> {
    console.log(`\n🔍 전체 영역 랭킹 확인 시작`);
    console.log(`키워드: ${keyword}`);
    console.log(`URL: ${targetUrl}\n`);

    try {
        const [mainSearch, blogTab] = await Promise.all([
            checkNaverMainSearch(keyword, targetUrl),
            checkNaverBlogTab(keyword, targetUrl)
        ]);

        const results: AllRankingResults = {
            smartblock: mainSearch.smartblock,
            mainBlog: mainSearch.mainBlog,
            blogTab: blogTab
        };

        // 결과 출력
        console.log('\n📊 전체 순위 결과:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`통합검색-스마트블록: ${results.smartblock.found ? results.smartblock.rank + '위' : '순위 없음'}`);
        console.log(`통합검색-블로그: ${results.mainBlog.found ? results.mainBlog.rank + '위' : '순위 없음'}`);
        console.log(`블로그 탭: ${results.blogTab.found ? results.blogTab.rank + '위' : '순위 없음'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return results;

    } catch (error) {
        console.error('❌ 전체 순위 확인 실패:', error);
        throw error;
    }
}

/**
 * 스마트블록 영역 파싱 (구 VIEW 영역)
 */
async function parseSmartblockArea(html: string, targetUrl: string): Promise<{ found: boolean; rank: number | null; title?: string }> {
    try {
        // 스마트블록은 보통 상단에 크게 표시됨
        // data-cr-area="sbn" 또는 class="sp_blog" 등으로 식별
        // 실제 HTML 구조에 따라 파싱 로직 조정 필요

        const blogLinks = extractBlogLinks(html);

        // 상위 10개 정도를 스마트블록으로 간주 (실제로는 HTML 구조 분석 필요)
        const smartblockLinks = blogLinks.slice(0, 10);

        for (let i = 0; i < smartblockLinks.length; i++) {
            if (smartblockLinks[i].url.includes(targetUrl) || targetUrl.includes(smartblockLinks[i].url)) {
                return {
                    found: true,
                    rank: i + 1,
                    title: smartblockLinks[i].title
                };
            }
        }

        return { found: false, rank: null };

    } catch (error) {
        console.error('스마트블록 파싱 오류:', error);
        return { found: false, rank: null };
    }
}

/**
 * 통합검색 블로그 영역 파싱
 */
async function parseMainBlogArea(html: string, targetUrl: string): Promise<{ found: boolean; rank: number | null; title?: string }> {
    try {
        const blogLinks = extractBlogLinks(html);

        // 스마트블록 이후 영역 (10위 이후)
        const mainBlogLinks = blogLinks.slice(10, 30);

        for (let i = 0; i < mainBlogLinks.length; i++) {
            if (mainBlogLinks[i].url.includes(targetUrl) || targetUrl.includes(mainBlogLinks[i].url)) {
                return {
                    found: true,
                    rank: i + 1,
                    title: mainBlogLinks[i].title
                };
            }
        }

        return { found: false, rank: null };

    } catch (error) {
        console.error('블로그 영역 파싱 오류:', error);
        return { found: false, rank: null };
    }
}

/**
 * 블로그 탭 결과 파싱
 */
async function parseBlogTabResults(html: string, targetUrl: string): Promise<{ found: boolean; rank: number | null; title?: string }> {
    try {
        const blogLinks = extractBlogLinks(html);

        for (let i = 0; i < blogLinks.length && i < 100; i++) {
            if (blogLinks[i].url.includes(targetUrl) || targetUrl.includes(blogLinks[i].url)) {
                return {
                    found: true,
                    rank: i + 1,
                    title: blogLinks[i].title
                };
            }
        }

        return { found: false, rank: null };

    } catch (error) {
        console.error('블로그 탭 파싱 오류:', error);
        return { found: false, rank: null };
    }
}

/**
 * HTML에서 블로그 링크 추출
 */
function extractBlogLinks(html: string): Array<{ url: string; title: string }> {
    const links: Array<{ url: string; title: string }> = [];

    try {
        // 네이버 블로그 링크 패턴
        const blogLinkPattern = /https?:\/\/blog\.naver\.com\/[^"'\s<>]+/g;
        const matches = html.match(blogLinkPattern) || [];

        const uniqueUrls = new Set<string>();

        for (const url of matches) {
            const cleanUrl = url.split('?')[0];

            if (!uniqueUrls.has(cleanUrl) && cleanUrl.includes('blog.naver.com')) {
                uniqueUrls.add(cleanUrl);

                // 제목 추출 시도
                const urlIndex = html.indexOf(url);
                let title = '제목 없음';

                if (urlIndex !== -1) {
                    const context = html.substring(Math.max(0, urlIndex - 500), Math.min(html.length, urlIndex + 500));
                    const titleMatch = context.match(/title["\s:=>]+([^"<>]+)/i);
                    if (titleMatch && titleMatch[1]) {
                        title = titleMatch[1].trim();
                    }
                }

                links.push({ url: cleanUrl, title });
            }
        }

        return links;

    } catch (error) {
        console.error('링크 추출 오류:', error);
        return links;
    }
}

/**
 * 순위 변화 분석 (단일 영역)
 */
export function analyzeRankingChange(currentRank: number | null, previousRank: number | null): {
    direction: 'up' | 'down' | 'same' | 'new' | 'lost';
    change: number;
    emoji: string;
    message: string;
} {
    if (currentRank === null && previousRank === null) {
        return { direction: 'new', change: 0, emoji: '🆕', message: '새로 추적 시작' };
    }

    if (currentRank === null && previousRank !== null) {
        return { direction: 'lost', change: 0, emoji: '📉', message: '순위 이탈' };
    }

    if (currentRank !== null && previousRank === null) {
        return { direction: 'new', change: 0, emoji: '🎉', message: `${currentRank}위 진입!` };
    }

    if (currentRank === previousRank) {
        return { direction: 'same', change: 0, emoji: '➡️', message: '순위 유지' };
    }

    const change = previousRank! - currentRank!;

    if (change > 0) {
        return { direction: 'up', change, emoji: '📈', message: `${change}계단 상승!` };
    } else {
        return { direction: 'down', change: Math.abs(change), emoji: '📉', message: `${Math.abs(change)}계단 하락` };
    }
}

// ==================== 통합 랭킹 추적 서비스 ====================

/**
 * 새로운 블로그 랭킹 추적 시작
 */
export async function startRankingTracking(
    userId: string,
    blogUrl: string,
    targetKeyword: string,
    blogTitle?: string
): Promise<{ success: boolean; trackerId?: string; message: string; results?: AllRankingResults }> {
    try {
        console.log('\n🎯 랭킹 추적 시작');
        console.log(`사용자: ${userId}`);
        console.log(`URL: ${blogUrl}`);
        console.log(`키워드: ${targetKeyword}`);

        // 1. 사용자 제한 확인
        const limitCheck = await canAddRankingTracker(userId);
        if (!limitCheck.canAdd) {
            return {
                success: false,
                message: `랭킹 추적 한도를 초과했습니다. (${limitCheck.current}/${limitCheck.limit})\n플랜을 업그레이드하세요.`
            };
        }

        // 2. 모든 영역에서 초기 랭킹 확인
        console.log('\n📊 초기 랭킹 확인 중...');
        const results = await checkAllRankings(targetKeyword, blogUrl);

        // 3. 추적 항목 생성
        const tracker: Omit<BlogRankingTracker, 'id'> = {
            userId,
            blogUrl,
            blogTitle,
            targetKeyword,
            currentSmartblockRank: results.smartblock.rank,
            currentMainBlogRank: results.mainBlog.rank,
            currentBlogTabRank: results.blogTab.rank,
            previousSmartblockRank: null,
            previousMainBlogRank: null,
            previousBlogTabRank: null,
            rankHistory: [{
                date: new Date().toISOString().split('T')[0],
                smartblockRank: results.smartblock.rank,
                mainBlogRank: results.mainBlog.rank,
                blogTabRank: results.blogTab.rank,
                checkedAt: new Date()
            }],
            createdAt: new Date(),
            lastChecked: new Date(),
            isActive: true
        };

        const trackerId = await createRankingTracker(tracker);

        console.log('\n✅ 랭킹 추적 시작 완료!');
        console.log(`추적 ID: ${trackerId}`);

        const summary = [
            `스마트블록: ${results.smartblock.rank ? results.smartblock.rank + '위' : '순위 없음'}`,
            `블로그 영역: ${results.mainBlog.rank ? results.mainBlog.rank + '위' : '순위 없음'}`,
            `블로그 탭: ${results.blogTab.rank ? results.blogTab.rank + '위' : '순위 없음'}`
        ].join('\n');

        return {
            success: true,
            trackerId,
            results,
            message: `랭킹 추적이 시작되었습니다!\n\n${summary}`
        };

    } catch (error) {
        console.error('❌ 랭킹 추적 시작 실패:', error);
        return {
            success: false,
            message: `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        };
    }
}

/**
 * 기존 추적 항목의 랭킹 업데이트
 */
export async function updateTrackerRanking(trackerId: string): Promise<{
    success: boolean;
    tracker?: BlogRankingTracker;
    message: string;
    results?: AllRankingResults;
}> {
    try {
        console.log('\n🔄 랭킹 업데이트 시작');
        console.log(`추적 ID: ${trackerId}`);

        const tracker = await getRankingTracker(trackerId);
        if (!tracker) {
            return { success: false, message: '추적 항목을 찾을 수 없습니다.' };
        }

        console.log(`키워드: ${tracker.targetKeyword}`);
        console.log(`URL: ${tracker.blogUrl}`);

        // 현재 랭킹 확인
        const results = await checkAllRankings(tracker.targetKeyword, tracker.blogUrl);

        // 히스토리 추가
        const newHistory: RankingHistory = {
            date: new Date().toISOString().split('T')[0],
            smartblockRank: results.smartblock.rank,
            mainBlogRank: results.mainBlog.rank,
            blogTabRank: results.blogTab.rank,
            checkedAt: new Date()
        };

        const updatedHistory = [...tracker.rankHistory, newHistory];

        // 최근 30일만 유지
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filteredHistory = updatedHistory.filter(h => h.checkedAt >= thirtyDaysAgo);

        // 업데이트
        await updateRankingTracker(trackerId, {
            previousSmartblockRank: tracker.currentSmartblockRank,
            previousMainBlogRank: tracker.currentMainBlogRank,
            previousBlogTabRank: tracker.currentBlogTabRank,
            currentSmartblockRank: results.smartblock.rank,
            currentMainBlogRank: results.mainBlog.rank,
            currentBlogTabRank: results.blogTab.rank,
            rankHistory: filteredHistory,
            lastChecked: new Date()
        });

        // 변화 분석
        const smartblockChange = analyzeRankingChange(results.smartblock.rank, tracker.currentSmartblockRank);
        const mainBlogChange = analyzeRankingChange(results.mainBlog.rank, tracker.currentMainBlogRank);
        const blogTabChange = analyzeRankingChange(results.blogTab.rank, tracker.currentBlogTabRank);

        console.log('\n✅ 랭킹 업데이트 완료!');
        console.log(`스마트블록: ${smartblockChange.emoji} ${smartblockChange.message}`);
        console.log(`블로그 영역: ${mainBlogChange.emoji} ${mainBlogChange.message}`);
        console.log(`블로그 탭: ${blogTabChange.emoji} ${blogTabChange.message}`);

        const updatedTracker = await getRankingTracker(trackerId);

        const summary = [
            `스마트블록: ${smartblockChange.emoji} ${results.smartblock.rank ? results.smartblock.rank + '위' : '순위 없음'} ${smartblockChange.message}`,
            `블로그 영역: ${mainBlogChange.emoji} ${results.mainBlog.rank ? results.mainBlog.rank + '위' : '순위 없음'} ${mainBlogChange.message}`,
            `블로그 탭: ${blogTabChange.emoji} ${results.blogTab.rank ? results.blogTab.rank + '위' : '순위 없음'} ${blogTabChange.message}`
        ].join('\n');

        return {
            success: true,
            tracker: updatedTracker!,
            results,
            message: summary
        };

    } catch (error) {
        console.error('❌ 랭킹 업데이트 실패:', error);
        return {
            success: false,
            message: `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        };
    }
}

/**
 * 사용자의 모든 추적 항목 일괄 업데이트
 */
export async function updateAllUserTrackers(userId: string): Promise<{
    success: boolean;
    updated: number;
    failed: number;
    results: Array<{ trackerId: string; success: boolean; message: string }>;
}> {
    try {
        console.log('\n🔄 전체 추적 항목 업데이트 시작');
        console.log(`사용자: ${userId}`);

        const trackers = await getUserRankingTrackers(userId);
        console.log(`총 ${trackers.length}개 항목`);

        const results: Array<{ trackerId: string; success: boolean; message: string }> = [];
        let updated = 0;
        let failed = 0;

        for (const tracker of trackers) {
            console.log(`\n처리 중: ${tracker.targetKeyword} (${tracker.id})`);

            const result = await updateTrackerRanking(tracker.id!);
            results.push({
                trackerId: tracker.id!,
                success: result.success,
                message: result.message
            });

            if (result.success) {
                updated++;
            } else {
                failed++;
            }

            // 네이버 차단 방지 (1초 대기)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✅ 전체 업데이트 완료');
        console.log(`성공: ${updated}개, 실패: ${failed}개`);

        return { success: true, updated, failed, results };

    } catch (error) {
        console.error('❌ 전체 업데이트 실패:', error);
        return { success: false, updated: 0, failed: 0, results: [] };
    }
}
