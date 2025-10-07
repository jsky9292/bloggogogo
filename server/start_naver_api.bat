@echo off
echo ================================
echo  네이버 키워드 분석 Flask 서버
echo ================================
echo.

cd /d "%~dp0"

echo Python 가상환경 확인 중...
if not exist venv (
    echo 가상환경이 없습니다. 생성 중...
    python -m venv venv
    echo 가상환경 생성 완료!
)

echo.
echo 가상환경 활성화 중...
call venv\Scripts\activate

echo.
echo 필수 패키지 설치 중...
pip install -r requirements.txt

echo.
echo ================================
echo Flask 서버 시작!
echo 서버 주소: http://localhost:8080
echo 종료하려면: Ctrl+C
echo ================================
echo.

python naver_keyword_api.py

pause
