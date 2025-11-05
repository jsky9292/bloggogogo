/**
 * 블로그 랭킹 추적 클라이언트 서비스
 * Firebase Functions를 통해 서버 사이드 크롤링 수행 (CORS 해결)
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import type { AllRankingResults, BlogRankingTracker, RankingHistory } from '../types';
import {
    createRankingTracker,
    getUserRankingTrackers,
    getRankingTracker,
    updateRankingTracker,
    deleteRankingTracker,
    canAddRankingTracker
} from '../src/config/firebase';

// Firebase Functions 초기화
const functions = getFunctions(undefined, 'asia-northeast3'); // 서울 리전

// 로컬 개발 환경에서는 에뮬레이터 사용
if (import.meta.env.VITE_APP_MODE === 'local') {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    console.log('🔧 Firebase Functions 에뮬레이터 연결됨 (localhost:5001)');
}

/**
 * 모든 영역에서 순위 확인 (백엔드 API 사용)
 */
export async function checkAllRankings(
    keyword: string,
    targetUrl: string
): Promise<AllRankingResults> {
    try {
        console.log(`\n🔍 전체 영역 랭킹 확인 시작 (백엔드 API)`);
        console.log(`키워드: ${keyword}`);
        console.log(`URL: ${targetUrl}\n`);

        // 백엔드 API 호출
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/check_blog_ranking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keyword, targetUrl })
        });

        if (!response.ok) {
            throw new Error(`API 오류: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || '순위 확인 실패');
        }

        const rankings: AllRankingResults = {
            smartblock: result.smartblock,
            mainBlog: result.mainBlog,
            blogTab: result.blogTab
        };

        // 결과 출력
        console.log('\n📊 전체 순위 결과:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`통합검색-스마트블록: ${rankings.smartblock.found ? rankings.smartblock.rank + '위' : '순위 없음'}`);
        console.log(`통합검색-블로그: ${rankings.mainBlog.found ? rankings.mainBlog.rank + '위' : '순위 없음'}`);
        console.log(`블로그 탭: ${rankings.blogTab.found ? rankings.blogTab.rank + '위' : '순위 없음'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return rankings;

    } catch (error: any) {
        console.error('❌ 전체 순위 확인 실패:', error);
        throw new Error(`순위 확인 중 오류: ${error.message}`);
    }
}

/**
 * 순위 변화 분석
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

        // 2. Firebase Functions를 통해 초기 랭킹 확인
        console.log('\n📊 초기 랭킹 확인 중...');
        const results = await checkAllRankings(targetKeyword, blogUrl);

        // 3. 추적 항목 생성
        const tracker: Omit<BlogRankingTracker, 'id'> = {
            userId,
            blogUrl,
            blogTitle: blogTitle || '',  // undefined 대신 빈 문자열 사용
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

    } catch (error: any) {
        console.error('❌ 랭킹 추적 시작 실패:', error);
        return {
            success: false,
            message: `오류가 발생했습니다: ${error.message}`
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

        // Firebase Functions를 통해 현재 랭킹 확인
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

    } catch (error: any) {
        console.error('❌ 랭킹 업데이트 실패:', error);
        return {
            success: false,
            message: `오류가 발생했습니다: ${error.message}`
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

    } catch (error: any) {
        console.error('❌ 전체 업데이트 실패:', error);
        return { success: false, updated: 0, failed: 0, results: [] };
    }
}

// Firebase Functions 헬스 체크
export async function checkFunctionsHealth(): Promise<boolean> {
    try {
        const healthCheck = httpsCallable(functions, 'checkAllRankings');
        await healthCheck({ keyword: 'test', targetUrl: 'test' });
        return true;
    } catch (error) {
        console.error('Firebase Functions 연결 실패:', error);
        return false;
    }
}
