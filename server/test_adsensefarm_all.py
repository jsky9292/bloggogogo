# -*- coding: utf-8 -*-
"""
Adsensefarm.kr 구글 검색어 전체 크롤링
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import json

def get_all_google_keywords():
    """모든 구글 검색어 크롤링"""
    print("\n=== Adsensefarm.kr 구글 검색어 전체 크롤링 ===")

    try:
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

        print("📡 Adsensefarm.kr 접속 중...")
        driver.get('https://adsensefarm.kr/realtime/')

        print("⏳ 페이지 로딩 대기 중...")
        time.sleep(5)

        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script('return document.readyState') == 'complete'
        )

        print("🔍 모든 구글 검색어 추출 중...")

        # 더 일반적인 선택자로 모든 키워드 가져오기
        selectors_to_try = [
            '#googletrend span.keyword a',
            '#googletrend .keyword a',
            '#googletrend span.keyword',
        ]

        keywords_found = []

        for selector in selectors_to_try:
            try:
                print(f"\n시도 중: {selector}")
                elements = driver.find_elements(By.CSS_SELECTOR, selector)

                if elements:
                    print(f"✅ {len(elements)}개 요소 발견")

                    for i, elem in enumerate(elements):
                        if elem.tag_name == 'a':
                            text = elem.text.strip()
                        else:
                            # span인 경우 내부의 a 태그 찾기
                            try:
                                a_tag = elem.find_element(By.TAG_NAME, 'a')
                                text = a_tag.text.strip()
                            except:
                                text = elem.text.strip()

                        if text and len(text) < 100 and text not in [k['keyword'] for k in keywords_found]:
                            print(f"  [{i+1}] {text}")
                            keywords_found.append({
                                'keyword': text,
                                'rank': len(keywords_found) + 1,
                                'source': 'google'
                            })

                    if len(keywords_found) >= 10:
                        break

            except Exception as e:
                print(f"❌ 선택자 '{selector}' 실패: {str(e)}")
                continue

        driver.quit()

        print(f"\n\n✅ 총 {len(keywords_found)}개 키워드 수집 완료!")
        return keywords_found[:20]  # 최대 20개

    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


if __name__ == '__main__':
    print("=" * 60)
    print("Adsensefarm.kr 구글 검색어 전체 크롤링")
    print("=" * 60)

    keywords = get_all_google_keywords()

    if keywords:
        print("\n✅ 크롤링 성공!")
        print(f"총 {len(keywords)}개 키워드:")
        for kw in keywords:
            print(f"  {kw['rank']}. {kw['keyword']}")

        with open('google_keywords_all.json', 'w', encoding='utf-8') as f:
            json.dump(keywords, f, ensure_ascii=False, indent=2)
        print("\n📁 결과가 google_keywords_all.json에 저장되었습니다.")
    else:
        print("\n❌ 크롤링 실패")
