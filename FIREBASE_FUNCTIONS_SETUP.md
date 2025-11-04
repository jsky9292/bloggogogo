# Firebase Functions 설정 및 배포 가이드

## 🎯 구현 완료!

✅ CORS 문제 해결 (서버 사이드 크롤링)
✅ 3가지 영역 순위 추적 (스마트블록, 블로그 영역, 블로그 탭)
✅ Firebase Functions로 서버리스 구현

---

## 📋 준비사항

1. **Firebase CLI 설치**
```bash
npm install -g firebase-tools
```

2. **Firebase 로그인**
```bash
firebase login
```

3. **프로젝트 확인**
```bash
firebase projects:list
```

---

## 🚀 배포 방법

### 1단계: Functions 의존성 설치
```bash
cd functions
npm install
cd ..
```

### 2단계: Functions 빌드
```bash
cd functions
npm run build
cd ..
```

### 3단계: Functions 배포
```bash
firebase deploy --only functions
```

또는 특정 함수만 배포:
```bash
firebase deploy --only functions:checkAllRankings
```

### 4단계: 배포 확인
```bash
firebase functions:log
```

---

## 🧪 로컬 테스트 (배포 전)

### 1. Firebase Emulator 실행
```bash
firebase emulators:start
```

### 2. 브라우저 콘솔에서 테스트
```javascript
// Emulator 연결 (개발 중)
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const functions = getFunctions();
connectFunctionsEmulator(functions, 'localhost', 5001);

// 테스트
import { checkAllRankings } from './services/rankingServiceClient';

const result = await checkAllRankings('키워드 분석', 'https://blog.naver.com/...');
console.log(result);
```

---

## 📱 클라이언트에서 사용법

### 기본 사용
```typescript
import { checkAllRankings } from './services/rankingServiceClient';

// 로그인 필요!
const result = await checkAllRankings(
    '키워드 분석',
    'https://blog.naver.com/아이디/글번호'
);

console.log('스마트블록:', result.smartblock.rank);
console.log('블로그 영역:', result.mainBlog.rank);
console.log('블로그 탭:', result.blogTab.rank);
```

### 랭킹 추적 시작
```typescript
import { startRankingTracking } from './services/rankingServiceClient';
import { auth } from './src/config/firebase';

const userId = auth.currentUser.uid;

const result = await startRankingTracking(
    userId,
    'https://blog.naver.com/xxx/222xxx',
    '키워드 분석',
    '블로그 글 제목'
);

console.log(result.message);
// "랭킹 추적이 시작되었습니다!
//  스마트블록: 5위
//  블로그 영역: 12위
//  블로그 탭: 8위"
```

### 업데이트
```typescript
import { updateTrackerRanking, updateAllUserTrackers } from './services/rankingServiceClient';

// 특정 항목 업데이트
await updateTrackerRanking('tracker-id');

// 전체 항목 업데이트
await updateAllUserTrackers(userId);
```

---

## 🔧 Firebase Functions 구조

```
functions/
├── src/
│   └── index.ts              # 메인 Functions 코드
│       ├── checkNaverMainSearch()    # 통합검색 순위
│       ├── checkNaverBlogTab()       # 블로그 탭 순위
│       └── checkAllRankings()        # 전체 순위 (권장!)
├── package.json
├── tsconfig.json
└── .gitignore

services/
└── rankingServiceClient.ts   # 클라이언트 코드 (Functions 호출)
```

---

## 💰 비용

### Firebase Functions 무료 티어
```
호출 횟수: 200만 회/월
아웃바운드 네트워킹: 5GB/월
CPU 시간: 40만 GB-초/월
```

### 예상 사용량
```
1회 순위 확인: ~2초
1,000명 사용자 × 1일 3회 = 3,000 회/일
한 달: 90,000 회

→ 무료 티어로 충분! 💯
```

### 유료로 전환되는 경우
```
- 월 200만 회 초과 시
- 비용: $0.40 / 100만 회

예) 월 500만 회 = (500만 - 200만) × $0.40 = $1.20
```

---

## ⚠️ 중요 사항

### 1. 리전 설정
```typescript
// asia-northeast3 = 서울 (한국 사용자에게 빠름!)
const functions = getFunctions(undefined, 'asia-northeast3');
```

### 2. 인증 필수
- 모든 Functions는 로그인 필요
- `context.auth` 체크
- 악용 방지

### 3. 타임아웃
```typescript
.runWith({ timeoutSeconds: 120 }) // 최대 2분
```

네이버 응답이 느릴 수 있으므로 넉넉하게 설정

### 4. 로그 확인
```bash
# 실시간 로그
firebase functions:log --only checkAllRankings

# 에러만 보기
firebase functions:log --only checkAllRankings --filter error
```

---

## 🐛 문제 해결

### 1. "unauthenticated" 에러
```
→ 로그인 확인
→ Firebase Auth 토큰 유효한지 확인
```

### 2. "internal" 에러
```
→ Functions 로그 확인: firebase functions:log
→ 네이버 응답 확인
```

### 3. 배포 실패
```bash
# Firebase 프로젝트 다시 선택
firebase use --add

# Functions 다시 빌드
cd functions
npm run build
cd ..

# 재배포
firebase deploy --only functions
```

### 4. CORS 에러 (여전히 발생)
```
→ rankingServiceClient.ts 사용하는지 확인
→ rankingService.ts (구버전) 사용하면 안됨!
```

---

## 📊 모니터링

### Firebase Console
1. https://console.firebase.google.com
2. 프로젝트 선택
3. Functions 메뉴
4. 사용량, 로그, 에러 확인

### 로그 예시
```
✓ 통합검색 순위 확인 시작 { keyword: '키워드 분석', targetUrl: '...' }
✓ 통합검색 순위 확인 완료 { smartblock: 5, mainBlog: 12, blogTab: 8 }
```

---

## 🎉 완료 체크리스트

배포 후 확인사항:

- [ ] Functions 배포 성공
- [ ] Firebase Console에서 Functions 확인
- [ ] 로컬에서 Functions 호출 테스트
- [ ] 실제 블로그 URL로 테스트
- [ ] 3가지 순위 모두 정상 확인
- [ ] Firebase 로그 확인

---

## 📚 다음 단계

1. ✅ Firebase Functions 배포
2. ⏳ 실제 테스트 (본인 블로그)
3. ⏳ UI 개발 (랭킹 추적 대시보드)
4. ⏳ 스케줄링 (자동 업데이트)

---

## 🆘 도움이 필요하면

1. Firebase Console 로그 확인
2. `firebase functions:log` 실행
3. 에러 메시지 복사해서 물어보기

---

## 서버 비교 (참고)

| 옵션 | 설정 | 비용 | 관리 | 추천 |
|------|------|------|------|------|
| **Firebase Functions** | 쉬움 | 무료~저렴 | 자동 | ⭐⭐⭐⭐⭐ |
| AWS Lambda | 복잡 | 중간 | 자동 | ⭐⭐⭐ |
| Cafe24 | 중간 | 월 3~10만원 | 수동 | ⭐⭐ |
| 자체 서버 | 매우 복잡 | 월 10만원~ | 수동 | ⭐ |

→ **Firebase Functions 강력 추천!**
