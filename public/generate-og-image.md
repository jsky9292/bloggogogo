# OG 이미지 생성 방법

## 방법 1: 온라인 HTML to Image 변환기 사용
1. https://htmlcsstoimage.com/ 접속
2. `og-image.html` 파일 내용 복사/붙여넣기
3. 1200x630px로 이미지 생성
4. `og-image.jpg`로 저장하여 public 폴더에 넣기

## 방법 2: 브라우저에서 직접 스크린샷
1. `og-image.html` 파일을 브라우저에서 열기
2. 개발자 도구(F12) → Device Toolbar → Responsive 모드
3. 1200x630 크기로 설정
4. 스크린샷 찍기
5. `og-image.jpg`로 저장

## 방법 3: Canva 또는 Figma 사용
1. 1200x630px 캔버스 생성
2. 배경: 보라색 그라데이션 (#667eea → #764ba2)
3. 텍스트:
   - 제목: Keyword Insight Pro
   - 부제: AI 기반 키워드 분석 & SEO 최적화 도구
   - 특징: 실시간 트렌드 | 경쟁력 분석 | AI 블로그 생성
4. JPG로 내보내기

## 이미지 요구사항
- 크기: 1200x630px (Facebook/LinkedIn 권장)
- 형식: JPG (용량 최적화)
- 파일명: og-image.jpg
- 위치: /public/og-image.jpg

## 배포 후 확인
1. https://cards-dev.twitter.com/validator 에서 Twitter 카드 테스트
2. https://developers.facebook.com/tools/debug/ 에서 Facebook 공유 테스트
3. 카카오톡, 슬랙 등에서 링크 공유 테스트