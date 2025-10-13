# 🚀 Keyword Insight Pro 설치 가이드

## 📋 목차
1. [프로젝트 클론](#1-프로젝트-클론)
2. [환경 설정](#2-환경-설정)
3. [프론트엔드 실행](#3-프론트엔드-실행)
4. [Flask API 실행](#4-flask-api-실행)
5. [기능별 필요 API](#5-기능별-필요-api)

---

## 1. 프로젝트 클론

```bash
git clone https://github.com/jsky9292/bloggogogo.git
cd bloggogogo
```

---

## 2. 환경 설정

### 2.1 Firebase 설정 (.env 파일)

프로젝트 루트에 `.env` 파일을 생성하고 아래 내용을 입력하세요:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyB9OTHfn8ys8kC_9TWikwQegLfb3oJuKpE
VITE_FIREBASE_AUTH_DOMAIN=keyword-insight-pro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=keyword-insight-pro
VITE_FIREBASE_STORAGE_BUCKET=keyword-insight-pro.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=814882225550
VITE_FIREBASE_APP_ID=1:814882225550:web:275de97363373b3f3eb8df

# Flask API URL
# 로컬 개발: http://localhost:8080
# 프로덕션: https://your-api-domain.com 또는 https://keywinsight.com/api
VITE_API_URL=http://localhost:8080
```

> **중요**: 다른 PC나 도메인(keywinsight.com)에서 접속하는 경우, `VITE_API_URL`을 실제 API 서버 주소로 변경하세요.

### 2.2 네이버 API 키 설정 (Flask API 사용 시)

`server/` 폴더에 다음 파일들을 생성하세요:

#### `server/ad_key.txt`
```
API_KEY: your_naver_ad_api_key
SECRET_KEY: your_naver_ad_secret_key
CUSTOMER_ID: your_customer_id
```

#### `server/search_key.txt`
```
CLIENT_ID: your_naver_search_client_id
CLIENT_SECRET: your_naver_search_client_secret
```

#### `server/google_youtube_key.txt`
```
google_api_key: your_google_api_key
google_search_engine_id: your_google_search_engine_id
youtube_api_key: your_youtube_api_key
```

> **참고**: `server/` 폴더에 `.example.txt` 파일들이 있으니 참고하세요.

---

## 3. 프론트엔드 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

**접속**: http://localhost:5173

### ✅ 프론트엔드만으로 가능한 기능
- 회원가입 / 로그인
- 관리자 로그인 (jsky9292@gmail.com)
- 사용자 프로필 관리
- Firebase 데이터 조회

---

## 4. Flask API 실행

키워드 분석과 실시간 검색어 기능을 사용하려면 Flask API를 실행해야 합니다.

### 4.1 Python 환경 설정

```bash
# 가상환경 생성 (선택사항)
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 필요한 패키지 설치
pip install flask flask-cors pandas requests selenium webdriver-manager pyperclip
```

### 4.2 Flask 서버 실행

```bash
cd server
python naver_api.py
```

**접속**: http://localhost:8080

---

## 5. 기능별 필요 API

| 기능 | Flask API 필요 | 네이버 API 필요 | Firebase 필요 |
|------|---------------|----------------|--------------|
| 회원가입/로그인 | ❌ | ❌ | ✅ |
| 관리자 로그인 | ❌ | ❌ | ✅ |
| 실시간 검색어 | ✅ | ✅ | ❌ |
| 키워드 분석 | ✅ | ✅ | ❌ |
| 경쟁도 분석 | ✅ | ✅ | ❌ |
| 사용자 관리 | ❌ | ❌ | ✅ |

---

## 🔑 API 키 발급 방법

### 네이버 광고 API (ad_key.txt)
1. https://naver.com 접속
2. 네이버 광고 관리 시스템 로그인
3. API 키 발급 메뉴에서 키 생성

### 네이버 검색 API (search_key.txt)
1. https://developers.naver.com/main/ 접속
2. 애플리케이션 등록
3. Client ID와 Client Secret 발급

### Google API (google_youtube_key.txt)
1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성
3. API 라이브러리에서 필요한 API 활성화
4. API 키 생성

---

## 🚨 문제 해결

### Flask 서버가 실행되지 않음
- Python 패키지가 모두 설치되었는지 확인
- 네이버 API 키 파일이 `server/` 폴더에 있는지 확인

### 실시간 검색어가 표시되지 않음
- Flask 서버가 실행 중인지 확인 (http://localhost:8080)
- 브라우저 콘솔(F12)에서 에러 확인

### 관리자 로그인이 안됨
- `.env` 파일이 프로젝트 루트에 있는지 확인
- Firebase 설정이 올바른지 확인
- 이메일: jsky9292@gmail.com

---

## 📞 문의

문제가 발생하면 GitHub Issues에 등록해주세요.
