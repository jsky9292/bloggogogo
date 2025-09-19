# Keyword Insight Pro 🔍

AI 기반 키워드 분석 및 SEO 최적화 SaaS 플랫폼

## 🚀 주요 기능

- **AI 경쟁력 분석**: 머신러닝 기반 실시간 키워드 경쟁도 측정
- **SERP 분석**: 구글/네이버 검색 결과 심층 분석
- **AI 콘텐츠 생성**: SEO 최적화된 블로그 글 자동 생성
- **실시간 트렌드**: 최신 검색 트렌드 분석
- **SaaS 기능**: 회원가입, 로그인, 구독 플랜, 사용량 추적

## 📋 시작하기

### 필요 사항

- Node.js 18.0 이상
- npm 또는 yarn
- Firebase 계정 (무료)
- Gemini API 키 (필수)

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/jsky9292/bloggogogo.git
cd bloggogogo
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 열어 API 키 입력
```

4. Firebase 프로젝트 설정
   - [Firebase Console](https://console.firebase.google.com) 접속
   - 새 프로젝트 생성
   - Authentication 활성화 (이메일/비밀번호)
   - Firestore Database 생성
   - 웹 앱 추가 및 설정값을 .env.local에 복사

5. 개발 서버 실행
```bash
npm run dev
```

## 🔧 환경 변수 설정

`.env.local` 파일 생성 및 설정:

```env
# Gemini API (필수)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (SaaS 모드에 필수)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 💻 기술 스택

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Firebase (Auth, Firestore)
- **AI**: Google Gemini API
- **Styling**: Inline Styles, Modern CSS
- **Deployment**: Vercel/Netlify 권장

## 📱 구독 플랜

| 플랜 | 가격 | 일일 검색 | 주요 기능 |
|------|------|-----------|-----------|
| Free | 무료 | 10회 | 기본 경쟁력 분석 |
| Basic | ₩9,900/월 | 50회 | + 블로그 주제 생성 |
| Pro | ₩29,900/월 | 200회 | + AI 콘텐츠 생성 |
| Enterprise | 문의 | 무제한 | + API 접근, 전담 지원 |

## 📁 프로젝트 구조

```
bloggogogo/
├── components/        # React 컴포넌트
├── services/         # API 서비스
├── hooks/           # Custom Hooks
├── src/             # 소스 파일
│   └── config/      # Firebase 설정
├── data/            # 정적 데이터
├── server/          # 서버 관련
├── .env.example     # 환경변수 예제
├── package.json     # 의존성
└── README.md        # 문서
```

## 🛡️ 보안 주의사항

- `.env.local` 파일은 절대 커밋하지 마세요
- Firebase 보안 규칙을 반드시 설정하세요
- API 키는 환경 변수로만 관리하세요
- 관리자 계정 정보는 별도 보관하세요

## 🚀 배포

### Vercel 배포 (권장)
1. [Vercel](https://vercel.com) 가입
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포

### Netlify 배포
1. [Netlify](https://netlify.com) 가입
2. GitHub 저장소 연결
3. Build command: `npm run build`
4. Publish directory: `dist`

## 📄 라이센스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

## 📞 문의

- GitHub: [@jsky9292](https://github.com/jsky9292)
- Issues: [GitHub Issues](https://github.com/jsky9292/bloggogogo/issues)

---

Made with ❤️ by Keyword Insight Pro Team
