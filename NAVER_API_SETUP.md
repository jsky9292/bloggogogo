# 네이버 키워드 분석 기능 설정 가이드

## 📋 목차
1. [네이버 API 키 발급 방법](#네이버-api-키-발급-방법)
2. [API 키 설정](#api-키-설정)
3. [서버 실행](#서버-실행)
4. [사용 방법](#사용-방법)
5. [문제 해결](#문제-해결)

---

## 🔑 네이버 API 키 발급 방법

### 1. 네이버 광고 API (필수)

**용도**: 연관 키워드 검색량, 경쟁강도 조회

**발급 방법**:
1. [네이버 광고 관리시스템](https://manage.searchad.naver.com/) 접속
2. 로그인 후 **도구 > API 관리** 메뉴 선택
3. **API 키 발급** 버튼 클릭
4. 다음 3가지 정보 저장:
   - `API Key`
   - `Secret Key`
   - `Customer ID`

**참고 링크**: https://saedu.naver.com/searchad/guide/api

---

### 2. 네이버 검색 API (필수)

**용도**: 블로그 문서 수 조회 (경쟁 분석)

**발급 방법**:
1. [네이버 개발자 센터](https://developers.naver.com/main/) 접속
2. 로그인 후 **Application > 애플리케이션 등록** 선택
3. 애플리케이션 정보 입력:
   - 애플리케이션 이름: `키워드 분석 툴` (자유)
   - 사용 API: **검색** 선택
4. 등록 완료 후 다음 정보 저장:
   - `Client ID`
   - `Client Secret`

**참고 링크**: https://developers.naver.com/docs/serviceapi/search/blog/blog.md

---

## ⚙️ API 키 설정

### 파일 위치
```
D:\bloggogogo\server\
├── ad_key.txt           # 광고 API 키
├── search_key.txt       # 검색 API 키
└── naver_keyword_api.py
```

### 1. 광고 API 키 설정 (ad_key.txt)

파일 내용 형식:
```
API_KEY: 여기에_발급받은_API_Key_입력
SECRET_KEY: 여기에_발급받은_Secret_Key_입력
CUSTOMER_ID: 여기에_발급받은_Customer_ID_입력
```

**실제 예시**:
```
API_KEY: 0100000000a1b2c3d4e5f6g7h8i9j0k1
SECRET_KEY: AQAAAACa1b2c3d4e5f6g7h8i9j0k1l2m==
CUSTOMER_ID: 1234567
```

---

### 2. 검색 API 키 설정 (search_key.txt)

파일 내용 형식:
```
CLIENT_ID: 여기에_발급받은_Client_ID_입력
CLIENT_SECRET: 여기에_발급받은_Client_Secret_입력
```

**실제 예시**:
```
CLIENT_ID: AbCdEfGhIjKlMn
CLIENT_SECRET: 1A2B3C4D5E
```

---

## 🚀 서버 실행

### Windows 사용자

1. `server` 폴더로 이동
2. `start_naver_api.bat` 파일 더블클릭
3. 자동으로 가상환경 생성 및 패키지 설치 진행
4. 서버 시작 메시지 확인: `http://localhost:8080`

### 수동 실행 (고급)

```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python naver_keyword_api.py
```

---

## 📱 사용 방법

### 1. 프론트엔드 실행

```bash
# 프로젝트 루트 디렉토리에서
npm run dev
```

### 2. 네이버 키워드 분석 사용

1. 웹 브라우저에서 `http://localhost:5173` 접속
2. 좌측 사이드바 **"네이버 키워드 분석"** 버튼 클릭
3. 분석할 키워드 입력 (예: `블로그 만들기`)
4. **"키워드 검색"** 버튼 클릭

### 3. 경쟁 분석 실행

1. 키워드 검색 결과가 나타나면
2. **"경쟁 분석 시작하기"** 버튼 클릭
3. 분석 완료 후 **"엑셀 다운로드"** 버튼으로 결과 저장

---

## 🔧 문제 해결

### Flask 서버가 실행되지 않을 때

**증상**: `ModuleNotFoundError: No module named 'flask'`

**해결방법**:
```bash
cd server
pip install -r requirements.txt
```

---

### API 오류 발생 시

**증상**: `API 오류: 인증 실패` 또는 `401 Unauthorized`

**해결방법**:
1. `ad_key.txt`, `search_key.txt` 파일 내용 재확인
2. 공백이나 줄바꿈 제거
3. API 키가 정확히 복사되었는지 확인
4. 네이버 개발자 센터에서 API 상태 확인

---

### CORS 오류 발생 시

**증상**: `Access to fetch at 'http://localhost:8080' from origin 'http://localhost:5173' has been blocked by CORS policy`

**해결방법**:
1. Flask 서버 재시작
2. `flask-cors` 패키지 설치 확인:
   ```bash
   pip install flask-cors
   ```

---

### 엑셀 다운로드 오류

**증상**: `ModuleNotFoundError: No module named 'openpyxl'`

**해결방법**:
```bash
pip install openpyxl
```

---

## 📊 API 사용량 확인

- **네이버 광고 API**: [관리시스템 > API 관리](https://manage.searchad.naver.com/)
- **네이버 검색 API**: [개발자 센터 > 내 애플리케이션](https://developers.naver.com/apps)

**무료 사용량**:
- 광고 API: 계정별 일일 제한 있음
- 검색 API: 일일 25,000건

---

## 💡 Tips

1. **API 키 보안**: 절대 GitHub 등에 올리지 마세요!
2. **사용량 관리**: API 호출 시 0.05초 딜레이로 제한 회피
3. **엑셀 저장**: 자동으로 `server/` 폴더에 저장됩니다
4. **다중 키워드**: 한 번에 여러 연관 키워드 분석 가능

---

## 📞 지원

문제가 계속 발생하면:
1. Flask 서버 콘솔 로그 확인
2. 브라우저 개발자 도구(F12) > Console 탭 확인
3. API 키 발급 상태 재확인

**성공적인 설정을 기원합니다! 🎉**
