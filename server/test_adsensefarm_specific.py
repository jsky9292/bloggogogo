# -*- coding: utf-8 -*-
"""
Adsensefarm.kr 구글 검색어 크롤링 - 정확한 선택자로 재테스트
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import json

def test_adsensefarm_with_exact_selector():
    """사용자가 제공한 정확한 선택자로 테스트"""
    print("\n=== Adsensefarm.kr 정확한 선택자 테스트 ===")

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

        # 페이지 로딩 대기 (더 길게)
        print("⏳ 페이지 로딩 대기 중...")
        time.sleep(5)

        # JavaScript 실행 대기
        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script('return document.readyState') == 'complete'
        )

        print("🔍 사용자 제공 선택자로 크롤링 시도...")

        # 방법 1: 사용자가 제공한 정확한 선택자
        selector1 = '#googletrend > div.kwds > div:nth-child(1) > p:nth-child(1) > span.keyword > a'

        # 방법 2: 좀 더 일반적인 선택자들
        selectors = [
            selector1,
            '#googletrend span.keyword a',
            '#googletrend .keyword a',
            '#googletrend a',
            'div.kwds span.keyword a',
            'div.kwds a'
        ]

        keywords_found = []

        for selector in selectors:
            try:
                print(f"\n시도 중: {selector}")
                elements = driver.find_elements(By.CSS_SELECTOR, selector)

                if elements:
                    print(f"✅ 선택자 '{selector}' 발견: {len(elements)}개 요소")

                    for i, elem in enumerate(elements[:20]):
                        text = elem.text.strip()
                        href = elem.get_attribute('href') if elem.tag_name == 'a' else ''

                        if text and len(text) < 100:
                            print(f"  [{i+1}] {text}")
                            if text not in [k['keyword'] for k in keywords_found]:
                                keywords_found.append({
                                    'keyword': text,
                                    'rank': len(keywords_found) + 1,
                                    'source': 'google',
                                    'selector': selector,
                                    'url': href
                                })

                    if keywords_found:
                        break
            except Exception as e:
                print(f"❌ 선택자 '{selector}' 실패: {str(e)}")
                continue

        if not keywords_found:
            print("\n❌ 모든 선택자 실패. 페이지 구조 확인:")

            # #googletrend 요소 확인
            try:
                googletrend_div = driver.find_element(By.ID, 'googletrend')
                print(f"\n✅ #googletrend 요소 발견!")
                print(f"내용 (처음 500자):\n{googletrend_div.get_attribute('innerHTML')[:500]}")
            except:
                print("\n❌ #googletrend 요소를 찾을 수 없습니다.")

            # 전체 페이지 소스 일부 출력
            print(f"\n전체 페이지 소스 (처음 2000자):\n{driver.page_source[:2000]}")

        driver.quit()

        print(f"\n\n결과: {len(keywords_found)}개 키워드 수집")
        return keywords_found

    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


if __name__ == '__main__':
    print("=" * 60)
    print("Adsensefarm.kr 구글 검색어 크롤링 - 정확한 선택자 테스트")
    print("=" * 60)

    keywords = test_adsensefarm_with_exact_selector()

    if keywords:
        print("\n✅ 크롤링 성공!")
        print(f"총 {len(keywords)}개 키워드:")
        for kw in keywords[:10]:
            print(f"  {kw['rank']}. {kw['keyword']}")

        # JSON 저장
        with open('adsensefarm_test_result.json', 'w', encoding='utf-8') as f:
            json.dump(keywords, f, ensure_ascii=False, indent=2)
        print("\n📁 결과가 adsensefarm_test_result.json에 저장되었습니다.")
    else:
        print("\n❌ 크롤링 실패")
