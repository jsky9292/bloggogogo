# 블로그 랭킹 추적 시스템

네이버 블로그 검색 순위를 추적하는 백엔드 시스템입니다.

## 📊 추적 영역 (2024년 네이버 구조 반영)

### 1. 통합검색 - 스마트블록
- 구 VIEW 영역
- **가장 중요한 순위!**
- 상위 10개 정도가 크게 노출됨

### 2. 통합검색 - 블로그 영역
- 스마트블록 아래 일반 블로그 결과
- 10~30위 정도

### 3. 블로그 탭
- 별도 탭, 블로그만 필터링
- 통합검색과 순위가 다름!

## 🎯 주요 기능

### 순위 추적
```typescript
// 모든 영역에서 순위 확인
const results = await checkAllRankings(
    '키워드 분석',
    'https://blog.naver.com/아이디/글번호'
);

console.log(results.smartblock.rank);  // 통합검색-스마트블록 순위
console.log(results.mainBlog.rank);    // 통합검색-블로그 순위
console.log(results.blogTab.rank);     // 블로그 탭 순위
```

### 랭킹 추적 시작
```typescript
const result = await startRankingTracking(
    userId,
    'https://blog.naver.com/xxx/222xxx',
    '키워드 분석',
    '내 블로그 글 제목'
);

// Firebase에 저장되고 매일 순위 추적
```

### 업데이트
```typescript
// 특정 추적 항목 업데이트
await updateTrackerRanking(trackerId);

// 사용자의 전체 항목 업데이트
await updateAllUserTrackers(userId);
```

## 📁 파일 구조

```
types.ts
├─ SearchArea: 'smartblock' | 'blog' | 'blog_tab'
├─ RankingCheckResult: 순위 확인 결과
├─ AllRankingResults: 3가지 영역 모두
├─ RankingHistory: 일별 순위 히스토리 (30일 보관)
└─ BlogRankingTracker: 추적 항목 데이터

services/rankingService.ts
├─ checkNaverMainSearch(): 통합검색 (스마트블록 + 블로그)
├─ checkNaverBlogTab(): 블로그 탭
├─ checkAllRankings(): 3가지 모두
├─ startRankingTracking(): 새 추적 시작
├─ updateTrackerRanking(): 순위 업데이트
└─ updateAllUserTrackers(): 전체 업데이트

src/config/firebase.ts
├─ createRankingTracker(): 추적 항목 생성
├─ getUserRankingTrackers(): 사용자 항목 조회
├─ getRankingTracker(): 특정 항목 조회
├─ updateRankingTracker(): 항목 업데이트
├─ deleteRankingTracker(): 항목 삭제
├─ canAddRankingTracker(): 플랜 제한 확인
└─ RANKING_TRACKER_LIMITS: 플랜별 제한
```

## 🔧 기술 구조

### 크롤링 방식
```typescript
// 1. fetch로 HTML 가져오기
const response = await fetch(searchUrl);
const html = await response.text();

// 2. 정규식으로 블로그 링크 추출
const blogLinkPattern = /https?:\/\/blog\.naver\.com\/[^"'\s<>]+/g;
const matches = html.match(blogLinkPattern);

// 3. 타겟 URL 찾기
for (let i = 0; i < links.length; i++) {
    if (links[i].includes(targetUrl)) {
        return { found: true, rank: i + 1 };
    }
}
```

### 데이터 구조 (Firebase)
```typescript
{
    userId: string,
    blogUrl: string,
    targetKeyword: string,

    // 현재 순위
    currentSmartblockRank: number | null,
    currentMainBlogRank: number | null,
    currentBlogTabRank: number | null,

    // 이전 순위 (비교용)
    previousSmartblockRank: number | null,
    previousMainBlogRank: number | null,
    previousBlogTabRank: number | null,

    // 히스토리 (최근 30일)
    rankHistory: [
        {
            date: "2025-11-01",
            smartblockRank: 5,
            mainBlogRank: 12,
            blogTabRank: 8,
            checkedAt: Date
        }
    ],

    createdAt: Date,
    lastChecked: Date,
    isActive: boolean
}
```

## 🚧 제약사항

### 1. CORS 문제
현재 클라이언트에서 직접 네이버에 fetch 요청하므로 **CORS 에러 발생 가능**

**해결 방법:**
- **임시**: 브라우저 CORS 플러그인 ("Allow CORS" 등)
- **프로덕션**: 백엔드 프록시 필요
  - Firebase Functions
  - 별도 Node.js 서버
  - Serverless Functions

### 2. 네이버 차단
- 과도한 요청 시 IP 차단 가능
- **권장**: 1일 1~3회 체크
- 요청 간 1초 이상 대기

### 3. 정확도
- 개인화 검색 결과 (로그인, 지역 등)
- "일반적인 순위" 제공
- 100위까지만 확인 가능

### 4. HTML 파싱
- 네이버가 HTML 구조 변경 시 파싱 로직 수정 필요
- 현재는 간단한 정규식 사용
- 더 정확한 파싱은 Cheerio/JSDOM 등 필요

## 📊 플랜별 제한

```typescript
RANKING_TRACKER_LIMITS = {
    free: 3개,
    basic: 10개,
    pro: 50개,
    enterprise: 무제한
}
```

## 🧪 테스트 방법

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 브라우저 콘솔에서
```javascript
// 빠른 테스트 (순위만 확인)
import { checkAllRankings } from './services/rankingService';

const result = await checkAllRankings(
    '키워드 분석',
    'https://blog.naver.com/xxx/222xxx'
);

console.log(result);
```

### 3. Firebase에 저장하려면
```javascript
import { startRankingTracking } from './services/rankingService';
import { auth } from './src/config/firebase';

const userId = auth.currentUser.uid;

const result = await startRankingTracking(
    userId,
    'https://blog.naver.com/xxx/222xxx',
    '키워드 분석',
    '블로그 글 제목'
);

console.log(result);
```

## ⚡ 성능 최적화

### 병렬 처리
```typescript
// 통합검색 2개 + 블로그 탭을 병렬로 처리
const [mainSearch, blogTab] = await Promise.all([
    checkNaverMainSearch(keyword, url),
    checkNaverBlogTab(keyword, url)
]);
```

### 히스토리 관리
- 최근 30일만 유지 (자동 정리)
- 하루에 한 번씩만 히스토리 추가 권장

### 캐싱 (미구현, 추후 추가 가능)
- 같은 키워드는 1시간 동안 캐시
- Redis 또는 메모리 캐시 사용

## 🔮 향후 개선 사항

### 1. 서버 사이드 크롤링
```typescript
// Firebase Functions 예시
export const checkRanking = functions.https.onCall(async (data) => {
    const { keyword, url } = data;
    return await checkAllRankings(keyword, url);
});
```

### 2. 더 정확한 HTML 파싱
```typescript
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
const smartblockLinks = $('.sp_blog a').map((i, el) => $(el).attr('href')).get();
```

### 3. 스케줄링
```typescript
// 매일 자동 업데이트
export const scheduledRankingUpdate = functions.pubsub
    .schedule('0 9 * * *')  // 매일 오전 9시
    .onRun(async () => {
        // 모든 사용자의 추적 항목 업데이트
    });
```

### 4. 알림 기능
- 순위 상승/하락 알림
- 1페이지 진입 알림
- 이메일 또는 푸시 알림

## 📝 주의사항

1. **네이버 이용약관 준수**
   - 상업적 크롤링 금지
   - 서버 부하 유발 금지
   - 개인 사용 수준 권장

2. **HTML 구조 변경 대응**
   - 네이버가 구조 변경 시 파싱 로직 수정 필요
   - 정기적인 테스트 권장

3. **데이터 정확성**
   - 100% 정확도 보장 불가
   - 참고용으로만 사용

## 🎉 완성된 기능

✅ 3가지 영역 순위 추적 (스마트블록, 블로그 영역, 블로그 탭)
✅ Firebase 저장 및 히스토리 관리
✅ 순위 변화 분석
✅ 플랜별 제한
✅ 일괄 업데이트
✅ 자동 30일 히스토리 정리

## 🚀 다음 단계

1. ✅ 백엔드 구축 완료
2. ⏳ CORS 해결 (프록시 서버 or Firebase Functions)
3. ⏳ 실제 테스트
4. ⏳ UI 개발
5. ⏳ 스케줄링 구현
