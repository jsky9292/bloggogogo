# -*- coding: utf-8 -*-
"""
실시간 검색어 크롤링 테스트 스크립트
Signal.bz와 Adsensefarm.kr에서 실제 데이터 추출 가능한지 확인
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import json

def test_signal_bz():
    """Signal.bz 네이버 실시간 검색어 크롤링 테스트"""
    print("\n=== Signal.bz 크롤링 테스트 시작 ===")

    try:
        # Chrome 드라이버 설정
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')  # 백그라운드 실행
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

        print("📡 Signal.bz 접속 중...")
        driver.get('https://www.signal.bz/')

        # 페이지 로딩 대기
        time.sleep(3)

        print("🔍 페이지 HTML 구조 분석 중...")

        # 가능한 CSS 선택자들 시도
        selectors = [
            '.rank-item',
            '.keyword-item',
            '.search-keyword',
            '[class*="keyword"]',
            '[class*="rank"]',
            '.realtime-keyword',
            '.trend-keyword',
            'li[class*="item"]',
            'div[class*="keyword"]'
        ]

        keywords_found = []

        for selector in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(f"✅ 선택자 '{selector}' 발견: {len(elements)}개 요소")
                    for i, elem in enumerate(elements[:10]):
                        text = elem.text.strip()
                        if text and len(text) < 50:  # 너무 긴 텍스트 제외
                            print(f"  [{i+1}] {text}")
                            keywords_found.append({
                                'keyword': text,
                                'rank': i+1,
                                'source': 'naver',
                                'selector': selector
                            })
                    break  # 첫 번째로 발견된 선택자 사용
            except Exception as e:
                continue

        if not keywords_found:
            print("❌ 키워드를 찾지 못했습니다. 페이지 소스 일부 출력:")
            print(driver.page_source[:1000])

        driver.quit()

        return keywords_found

    except Exception as e:
        print(f"❌ Signal.bz 크롤링 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


def test_adsensefarm():
    """Adsensefarm.kr 구글 실시간 검색어 크롤링 테스트"""
    print("\n=== Adsensefarm.kr 크롤링 테스트 시작 ===")

    try:
        # Chrome 드라이버 설정
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

        print("📡 Adsensefarm.kr 접속 중...")
        driver.get('https://adsensefarm.kr/realtime/')

        # 페이지 로딩 대기
        time.sleep(3)

        print("🔍 페이지 HTML 구조 분석 중...")

        # 가능한 CSS 선택자들 시도
        selectors = [
            '.google-trend',
            '.trend-item',
            '.keyword-list li',
            '[class*="google"]',
            '[class*="trend"]',
            '.realtime-list li',
            'ul li[class*="item"]',
            'div[class*="keyword"]'
        ]

        keywords_found = []

        for selector in selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    print(f"✅ 선택자 '{selector}' 발견: {len(elements)}개 요소")
                    for i, elem in enumerate(elements[:10]):
                        text = elem.text.strip()
                        if text and len(text) < 50:
                            print(f"  [{i+1}] {text}")
                            keywords_found.append({
                                'keyword': text,
                                'rank': i+1,
                                'source': 'google',
                                'selector': selector
                            })
                    break
            except Exception as e:
                continue

        if not keywords_found:
            print("❌ 키워드를 찾지 못했습니다. 페이지 소스 일부 출력:")
            print(driver.page_source[:1000])

        driver.quit()

        return keywords_found

    except Exception as e:
        print(f"❌ Adsensefarm.kr 크롤링 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


if __name__ == '__main__':
    print("=" * 60)
    print("실시간 검색어 크롤링 가능성 테스트")
    print("=" * 60)

    # Signal.bz 테스트
    naver_keywords = test_signal_bz()

    # Adsensefarm.kr 테스트
    google_keywords = test_adsensefarm()

    # 결과 요약
    print("\n" + "=" * 60)
    print("테스트 결과 요약")
    print("=" * 60)

    if naver_keywords:
        print(f"\n✅ 네이버 실시간 검색어: {len(naver_keywords)}개 수집 성공")
        print(f"   사용된 선택자: {naver_keywords[0]['selector']}")
    else:
        print("\n❌ 네이버 실시간 검색어: 수집 실패")

    if google_keywords:
        print(f"\n✅ 구글 실시간 검색어: {len(google_keywords)}개 수집 성공")
        print(f"   사용된 선택자: {google_keywords[0]['selector']}")
    else:
        print("\n❌ 구글 실시간 검색어: 수집 실패")

    # JSON 파일로 저장
    result = {
        'naver': naver_keywords,
        'google': google_keywords,
        'success': len(naver_keywords) > 0 or len(google_keywords) > 0
    }

    with open('crawler_test_result.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("\n📁 결과가 crawler_test_result.json 파일로 저장되었습니다.")
    print("\n결론:")

    if naver_keywords and google_keywords:
        print("✅ 두 사이트 모두 크롤링 가능합니다!")
        print("   방법 1 (크롤링)을 사용할 수 있습니다.")
    elif naver_keywords or google_keywords:
        print("⚠️ 일부 사이트만 크롤링 가능합니다.")
        print("   부분적으로 방법 1을 사용하고, 나머지는 방법 3을 사용하는 것을 권장합니다.")
    else:
        print("❌ 크롤링이 어렵습니다.")
        print("   방법 3 (키워드 리스트 개선)을 사용하는 것을 권장합니다.")
