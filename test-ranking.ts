/**
 * 랭킹 추적 기능 테스트 스크립트
 *
 * 사용법:
 * 1. npm run dev로 개발 서버 실행
 * 2. 브라우저 콘솔에서 아래 함수들을 직접 실행
 *
 * 예시:
 * ```javascript
 * // 1. 랭킹 추적 시작
 * import { startRankingTracking } from './services/rankingService';
 * const result = await startRankingTracking(
 *     'user-id-here',
 *     'https://blog.naver.com/your-blog/222xxxxx',
 *     '키워드 분석',
 *     '블로그 글 제목'
 * );
 * console.log(result);
 *
 * // 2. 순위 확인만 하기 (추적 시작 없이)
 * import { checkNaverRankingAllTabs } from './services/rankingService';
 * const ranking = await checkNaverRankingAllTabs('키워드 분석', 'https://blog.naver.com/your-blog/222xxxxx');
 * console.log(ranking);
 *
 * // 3. 기존 추적 항목 업데이트
 * import { updateTrackerRanking } from './services/rankingService';
 * const updateResult = await updateTrackerRanking('tracker-id-here');
 * console.log(updateResult);
 *
 * // 4. 사용자의 모든 추적 항목 조회
 * import { getUserRankingTrackers } from './src/config/firebase';
 * const trackers = await getUserRankingTrackers('user-id-here');
 * console.log(trackers);
 * ```
 */

import {
    checkNaverRanking,
    checkNaverRankingAllTabs,
    analyzeRankingChange,
    startRankingTracking,
    updateTrackerRanking,
    updateAllUserTrackers
} from './services/rankingService';

import {
    getUserRankingTrackers,
    canAddRankingTracker,
    RANKING_TRACKER_LIMITS
} from './src/config/firebase';

// 테스트 함수들을 window 객체에 노출 (브라우저 콘솔에서 사용 가능)
if (typeof window !== 'undefined') {
    (window as any).testRanking = {
        // 기본 함수들
        checkNaverRanking,
        checkNaverRankingAllTabs,
        analyzeRankingChange,

        // 통합 서비스
        startRankingTracking,
        updateTrackerRanking,
        updateAllUserTrackers,

        // Firebase 함수들
        getUserRankingTrackers,
        canAddRankingTracker,

        // 상수
        RANKING_TRACKER_LIMITS,

        // 테스트 헬퍼 함수
        async quickTest(keyword: string, url: string) {
            console.log('🧪 빠른 테스트 시작');
            console.log(`키워드: ${keyword}`);
            console.log(`URL: ${url}\n`);

            const result = await checkNaverRankingAllTabs(keyword, url);

            console.log('\n📊 테스트 결과:');
            console.log('─────────────────────────────────');
            console.log(`VIEW 탭: ${result.view.found ? result.view.rank + '위' : '순위 없음'}`);
            console.log(`블로그 탭: ${result.blog.found ? result.blog.rank + '위' : '순위 없음'}`);
            console.log('─────────────────────────────────\n');

            return result;
        },

        async testWithUserId(userId: string, keyword: string, url: string, title?: string) {
            console.log('🧪 사용자 랭킹 추적 테스트');
            console.log(`사용자 ID: ${userId}`);
            console.log(`키워드: ${keyword}`);
            console.log(`URL: ${url}\n`);

            // 1. 제한 확인
            const limitCheck = await canAddRankingTracker(userId);
            console.log('📋 사용자 제한 확인:');
            console.log(`플랜: ${limitCheck.plan}`);
            console.log(`현재/최대: ${limitCheck.current}/${limitCheck.limit === -1 ? '무제한' : limitCheck.limit}`);
            console.log(`추가 가능: ${limitCheck.canAdd ? '예' : '아니오'}\n`);

            if (!limitCheck.canAdd) {
                console.log('❌ 추적 한도 초과');
                return;
            }

            // 2. 추적 시작
            const result = await startRankingTracking(userId, url, keyword, title);
            console.log('\n📊 결과:', result);

            return result;
        },

        async showUserTrackers(userId: string) {
            console.log('📋 사용자 추적 항목 조회');
            console.log(`사용자 ID: ${userId}\n`);

            const trackers = await getUserRankingTrackers(userId);

            console.log(`총 ${trackers.length}개 항목:\n`);

            trackers.forEach((tracker, index) => {
                console.log(`${index + 1}. ${tracker.targetKeyword}`);
                console.log(`   URL: ${tracker.blogUrl}`);
                console.log(`   현재 순위: ${tracker.currentRank ? tracker.currentRank + '위' : '순위 없음'} (${tracker.currentTab} 탭)`);
                console.log(`   히스토리: ${tracker.rankHistory.length}개 기록`);
                console.log(`   마지막 확인: ${tracker.lastChecked ? tracker.lastChecked.toLocaleString('ko-KR') : '없음'}`);
                console.log('');
            });

            return trackers;
        },

        help() {
            console.log(`
🔍 랭킹 추적 테스트 함수 사용법
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 빠른 순위 확인 (추적 없이)
   await testRanking.quickTest('키워드', 'https://blog.naver.com/...')

2️⃣ 랭킹 추적 시작 (Firebase 저장)
   await testRanking.testWithUserId('user-id', '키워드', 'https://blog.naver.com/...', '글 제목')

3️⃣ 사용자 추적 항목 조회
   await testRanking.showUserTrackers('user-id')

4️⃣ 추적 항목 업데이트
   await testRanking.updateTrackerRanking('tracker-id')

5️⃣ 전체 추적 항목 일괄 업데이트
   await testRanking.updateAllUserTrackers('user-id')

6️⃣ 개별 함수 직접 사용
   - checkNaverRanking(keyword, url, tab)
   - checkNaverRankingAllTabs(keyword, url)
   - startRankingTracking(userId, url, keyword, title)
   - getUserRankingTrackers(userId)
   - canAddRankingTracker(userId)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 팁:
- 네이버 차단 방지를 위해 요청 간 1초 대기
- 하루 1~3회 정도 체크 권장
- 최대 100위까지만 확인 가능
            `);
        }
    };

    // 자동으로 도움말 표시
    console.log('\n🎯 랭킹 추적 테스트 함수가 로드되었습니다!');
    console.log('사용법을 보려면: testRanking.help()');
}

export {};
