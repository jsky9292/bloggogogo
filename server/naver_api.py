# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import time
import urllib.parse
import urllib.request
import json
import hashlib
import hmac
import base64
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver import ActionChains
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import pyperclip
import os
import threading

app = Flask(__name__)
CORS(app)

# 전역 변수
ad_userkey_list = []
search_userkey_list = []
google_youtube_keys = {}
progress_status = {"current": 0, "total": 0, "message": ""}

class Signature:
    @staticmethod
    def generate(timestamp, method, uri, secret_key):
        message = "{}.{}.{}".format(timestamp, method, uri)
        hash = hmac.new(bytes(secret_key, "utf-8"), bytes(message, "utf-8"), hashlib.sha256)
        hash.hexdigest()
        return base64.b64encode(hash.digest())

    def get_header(self, method, uri, api_key, secret_key, customer_id):
        timestamp = str(round(time.time() * 1000))
        signature = Signature.generate(timestamp, method, uri, secret_key)

        return {'Content-Type': 'application/json; charset=UTF-8', 'X-Timestamp': timestamp,
                'X-API-KEY': api_key, 'X-Customer': str(customer_id), 'X-Signature': signature}

    def getresults(self, hintKeywords):
        BASE_URL = 'https://api.naver.com'

        API_KEY = ad_userkey_list[0]
        SECRET_KEY = ad_userkey_list[1]
        CUSTOMER_ID = ad_userkey_list[2]

        uri = '/keywordstool'
        method = 'GET'

        params={}
        params['hintKeywords']=hintKeywords
        params['showDetail']='1'

        r=requests.get(BASE_URL + uri, params=params,
                     headers= self.get_header(method, uri, API_KEY, SECRET_KEY, CUSTOMER_ID))

        # 응답 확인
        response_data = r.json()
        print(f"[DEBUG] API 응답 상태: {r.status_code}")
        print(f"[DEBUG] API 응답 키: {response_data.keys()}")

        if 'keywordList' not in response_data:
            print(f"[ERROR] API 응답 전체: {response_data}")
            raise Exception(f"API 오류: {response_data.get('message', '알 수 없는 오류')}")

        return response_data['keywordList']

# API 키 로드
def load_api_keys():
    global ad_userkey_list, search_userkey_list, google_youtube_keys

    # 환경 변수에서 먼저 시도, 없으면 파일에서 로드
    try:
        # 광고 API 키 로드
        if os.getenv('NAVER_AD_API_KEY'):
            # 환경 변수에서 로드 (Render.com)
            ad_userkey_list = [
                os.getenv('NAVER_AD_API_KEY'),
                os.getenv('NAVER_AD_SECRET_KEY'),
                os.getenv('NAVER_CUSTOMER_ID')
            ]
            print("[INFO] 네이버 광고 API 키 환경 변수에서 로드 완료")
        else:
            # 파일에서 로드 (로컬)
            ad_userkey_list = []
            with open('ad_key.txt', 'r') as f:
                lines = f.readlines()
                for line in lines:
                    line = line.strip().replace(" ","").split(':')[-1]
                    ad_userkey_list.append(line)
            print("[INFO] 네이버 광고 API 키 파일에서 로드 완료")

        # 검색 API 키 로드
        if os.getenv('NAVER_SEARCH_CLIENT_ID'):
            # 환경 변수에서 로드 (Render.com)
            search_userkey_list = [
                os.getenv('NAVER_SEARCH_CLIENT_ID'),
                os.getenv('NAVER_SEARCH_CLIENT_SECRET')
            ]
            print("[INFO] 네이버 검색 API 키 환경 변수에서 로드 완료")
        else:
            # 파일에서 로드 (로컬)
            search_userkey_list = []
            with open('search_key.txt', 'r') as f:
                lines = f.readlines()
                for line in lines:
                    line = line.strip().replace(" ","").split(':')[-1]
                    search_userkey_list.append(line)
            print("[INFO] 네이버 검색 API 키 파일에서 로드 완료")

        # Google & YouTube API 키 로드
        if os.getenv('GOOGLE_API_KEY'):
            # 환경 변수에서 로드 (Render.com)
            google_youtube_keys = {
                'google_api_key': os.getenv('GOOGLE_API_KEY'),
                'google_search_engine_id': os.getenv('GOOGLE_SEARCH_ENGINE_ID'),
                'youtube_api_key': os.getenv('YOUTUBE_API_KEY')
            }
            print("[INFO] Google/YouTube API 키 환경 변수에서 로드 완료")
        else:
            # 파일에서 로드 (로컬)
            google_youtube_keys = {}
            try:
                with open('google_youtube_key.txt', 'r') as f:
                    lines = f.readlines()
                    for line in lines:
                        parts = line.strip().replace(" ","").split(':')
                        if len(parts) >= 2:
                            key = parts[0]
                            value = ':'.join(parts[1:])  # API 키에 :가 포함될 수 있음
                            google_youtube_keys[key] = value
                print(f"[INFO] Google/YouTube API 키 파일에서 로드 완료: {list(google_youtube_keys.keys())}")
            except FileNotFoundError:
                print("[WARNING] google_youtube_key.txt not found. Google/YouTube features will be disabled.")

    except Exception as e:
        print(f"[ERROR] API 키 로드 실패: {str(e)}")
        raise

@app.route('/')
def index():
    return jsonify({
        'status': 'ok',
        'message': 'Keyword Insight Pro API Server',
        'version': '1.0.0'
    })

@app.route('/search_keywords', methods=['POST'])
def search_keywords():
    try:
        keyword = request.json['keyword']
        signature_obj = Signature()

        # 연관 키워드 조회
        keyword_list = signature_obj.getresults(keyword)

        # 데이터 변환
        result_data = []
        for item in keyword_list:
            mobile = int(str(item.get('monthlyMobileQcCnt', 0)).replace('<', '').strip())
            pc = int(str(item.get('monthlyPcQcCnt', 0)).replace('<', '').strip())

            result_data.append({
                '연관키워드': item.get('relKeyword', ''),
                '모바일검색량': mobile,
                'PC검색량': pc,
                '총검색량': mobile + pc,
                '경쟁강도': item.get('compIdx', '')
            })

        return jsonify({
            'success': True,
            'data': result_data,
            'total': len(result_data)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/analyze_competition', methods=['POST'])
def analyze_competition():
    try:
        keywords_data = request.json['keywords']

        # 총문서수 조회
        for idx, item in enumerate(keywords_data):
            keyword = item['연관키워드']
            client_id = search_userkey_list[0]
            client_secret = search_userkey_list[1]

            encText = urllib.parse.quote(keyword)
            url = "https://openapi.naver.com/v1/search/blog?query=" + encText

            req = urllib.request.Request(url)
            req.add_header("X-Naver-Client-Id", client_id)
            req.add_header("X-Naver-Client-Secret", client_secret)

            response = urllib.request.urlopen(req)
            rescode = response.getcode()

            if rescode == 200:
                response_body = response.read()
                total_num = response_body.decode('utf-8')
                item['총문서수'] = json.loads(total_num)['total']
            else:
                item['총문서수'] = 0

            # 경쟁률 계산
            if item['총문서수'] > 0:
                item['경쟁률'] = item['총검색량'] / item['총문서수']
            else:
                item['경쟁률'] = 0

            # 진행률 업데이트
            progress_status["current"] = idx + 1
            progress_status["total"] = len(keywords_data)
            progress_status["message"] = f"{keyword} 분석 완료"

            time.sleep(0.05)  # API 호출 제한 방지

        # 엑셀 파일 저장 (openpyxl 사용)
        from openpyxl import Workbook
        now = datetime.now()
        filename = f'키워드분석_{now.strftime("%Y%m%d_%H%M%S")}.xlsx'

        wb = Workbook()
        ws = wb.active
        ws.title = "키워드 분석"

        # 헤더
        headers = ['연관키워드', '모바일검색량', 'PC검색량', '총검색량', '경쟁강도', '총문서수', '경쟁률']
        ws.append(headers)

        # 데이터
        for item in keywords_data:
            ws.append([
                item.get('연관키워드', ''),
                item.get('모바일검색량', 0),
                item.get('PC검색량', 0),
                item.get('총검색량', 0),
                item.get('경쟁강도', ''),
                item.get('총문서수', 0),
                item.get('경쟁률', 0)
            ])

        wb.save(filename)

        return jsonify({
            'success': True,
            'data': keywords_data,
            'filename': filename
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/progress')
def get_progress():
    return jsonify(progress_status)


@app.route('/download/<filename>')
def download_file(filename):
    return send_file(filename, as_attachment=True)

def get_naver_realtime_keywords():
    """네이버 실시간 급상승 검색어 - Signal.bz 크롤링"""
    try:
        print("[INFO] Signal.bz에서 네이버 실시간 검색어 크롤링 시작...")

        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get('https://www.signal.bz/')
        time.sleep(3)

        # Signal.bz에서 네이버 실시간 검색어 추출
        # 순위와 키워드를 분리해서 추출
        keyword_elements = driver.find_elements(By.CSS_SELECTOR, '[class*="rank"]')

        keywords = []
        seen_keywords = set()

        for elem in keyword_elements:
            text = elem.text.strip()

            # 순위 번호가 아니고, 빈 문자열이 아니며, 적절한 길이의 텍스트만 추출
            if text and not text.isdigit() and len(text) > 2 and len(text) < 100:
                # 줄바꿈 처리 (순위와 키워드가 함께 있는 경우)
                if '\n' in text:
                    parts = text.split('\n')
                    keyword = parts[-1].strip()  # 마지막 부분이 키워드
                else:
                    keyword = text

                # 중복 제거
                if keyword not in seen_keywords and not keyword.isdigit():
                    keywords.append({
                        'keyword': keyword,
                        'rank': len(keywords) + 1,
                        'source': 'naver'
                    })
                    seen_keywords.add(keyword)

                    if len(keywords) >= 10:
                        break

        driver.quit()

        print(f"[INFO] Signal.bz에서 {len(keywords)}개 네이버 검색어 수집 완료")
        return keywords[:10]

    except Exception as e:
        print(f"[ERROR] Signal.bz 크롤링 실패: {str(e)}")
        import traceback
        traceback.print_exc()

        # Fallback: 기존 방식 사용
        print("[INFO] Fallback: 샘플 키워드 사용")
        sample_keywords = ['날씨', '뉴스', '주식', '부동산', '축구', '야구', '환율', '코스피', '프리미어리그', 'K리그']
        return [{'keyword': kw, 'rank': i+1, 'source': 'naver'} for i, kw in enumerate(sample_keywords)]

def get_google_trends_keywords():
    """구글 인기 검색어 - Adsensefarm.kr 크롤링"""
    try:
        print("[INFO] Adsensefarm.kr에서 구글 실시간 검색어 크롤링 시작...")

        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get('https://adsensefarm.kr/realtime/')
        time.sleep(5)

        # JavaScript 실행 완료 대기
        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script('return document.readyState') == 'complete'
        )

        # Adsensefarm.kr에서 구글 실시간 검색어 추출
        keyword_elements = driver.find_elements(By.CSS_SELECTOR, '#googletrend span.keyword a')

        keywords = []
        for i, elem in enumerate(keyword_elements):
            text = elem.text.strip()
            if text and len(text) < 100:
                keywords.append({
                    'keyword': text,
                    'rank': i + 1,
                    'source': 'google'
                })

        driver.quit()

        print(f"[INFO] Adsensefarm.kr에서 {len(keywords)}개 구글 검색어 수집 완료")
        return keywords[:10]

    except Exception as e:
        print(f"[ERROR] Adsensefarm.kr 크롤링 실패: {str(e)}")
        import traceback
        traceback.print_exc()

        # Fallback: 기존 방식 사용
        print("[INFO] Fallback: 샘플 키워드 사용")
        sample_keywords = ['ChatGPT', 'AI', '인공지능', 'Python', 'React', '디지털노마드', '재택근무', '부업', '투자', '주식']
        return [{'keyword': kw, 'rank': i+1, 'source': 'google'} for i, kw in enumerate(sample_keywords)]

def get_latest_news():
    """
    네이버 최신 뉴스 제목 가져오기 (네이버 검색 API 사용)
    """
    try:
        if not search_userkey_list or len(search_userkey_list) < 2:
            print("[WARN] 네이버 검색 API 키 없음")
            return []

        client_id = search_userkey_list[0]
        client_secret = search_userkey_list[1]

        # 최신 뉴스 검색 (정렬: 최신순)
        encText = urllib.parse.quote("경제 OR 정책 OR IT OR 트렌드")
        url = f"https://openapi.naver.com/v1/search/news.json?query={encText}&display=10&sort=date"

        req = urllib.request.Request(url)
        req.add_header("X-Naver-Client-Id", client_id)
        req.add_header("X-Naver-Client-Secret", client_secret)

        response = urllib.request.urlopen(req)
        rescode = response.getcode()

        if rescode == 200:
            response_body = response.read()
            result = json.loads(response_body.decode('utf-8'))

            news_list = []
            for idx, item in enumerate(result.get('items', [])[:10]):
                # HTML 태그 제거
                title = BeautifulSoup(item['title'], 'html.parser').get_text()
                news_list.append({
                    'keyword': title,
                    'rank': idx + 1,
                    'source': 'naver_news',
                    'link': item.get('link', ''),
                    'pubDate': item.get('pubDate', '')
                })

            print(f"[INFO] 네이버 최신 뉴스 {len(news_list)}개 수집")
            return news_list
        else:
            print(f"[ERROR] 네이버 뉴스 API 오류: {rescode}")
            return []

    except Exception as e:
        print(f"[ERROR] 네이버 뉴스 가져오기 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

@app.route('/trending_keywords', methods=['GET'])
def get_trending_keywords():
    """
    실시간 인기 검색어 조회
    네이버와 구글의 실시간 트렌드 검색어 가져오기
    """
    try:
        # 네이버 실시간 검색어
        naver_keywords = get_naver_realtime_keywords()

        # 구글 트렌드 검색어
        google_keywords = get_google_trends_keywords()

        # 실시간 데이터만 표시 (fallback 없음)
        print(f"[INFO] 네이버: {len(naver_keywords)}개, 구글: {len(google_keywords)}개")

        return jsonify({
            'success': True,
            'naver': naver_keywords,
            'google': google_keywords,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"[ERROR] 실시간 검색어 조회 실패: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'naver': [],
            'google': []
        })

@app.route('/latest_news', methods=['GET'])
def latest_news():
    """
    오늘의 글감: 최신 뉴스 제목 조회
    네이버 최신 뉴스 기사 제목 제공
    """
    try:
        news_list = get_latest_news()

        return jsonify({
            'success': True,
            'news': news_list,
            'count': len(news_list),
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"[ERROR] 최신 뉴스 조회 실패: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'news': []
        })

@app.route('/check_blog_ranking', methods=['POST'])
def check_blog_ranking():
    """
    블로그 순위 추적 API (Selenium 사용, JavaScript 렌더링 후 크롤링)
    """
    driver = None
    try:
        data = request.get_json()
        keyword = data.get('keyword')
        target_url = data.get('targetUrl')

        if not keyword or not target_url:
            return jsonify({
                'success': False,
                'error': '키워드와 URL이 필요합니다.'
            }), 400

        print(f"[INFO] 블로그 순위 확인: {keyword} / {target_url}")

        # URL 정규화
        def normalize_url(url):
            return url.replace('https://', '').replace('http://', '').replace('www.', '').split('?')[0].lower()

        normalized_target = normalize_url(target_url)

        # Selenium 드라이버 설정
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.set_page_load_timeout(30)

        # 1. 통합검색
        main_search_url = f"https://search.naver.com/search.naver?query={urllib.parse.quote(keyword)}"
        print(f"[INFO] 통합검색 접속: {main_search_url}")

        driver.get(main_search_url)
        time.sleep(2)  # JavaScript 렌더링 대기

        # 블로그 링크 추출
        import re
        main_html = driver.page_source
        blog_pattern = r'https?://blog\.naver\.com/[^"\'<>\s]+'
        main_matches = re.findall(blog_pattern, main_html)
        main_links = []
        seen = set()
        for link in main_matches:
            clean_link = link.split('?')[0]
            if clean_link not in seen and '/PostView.naver' in link or '/PostList.naver' in link or len(clean_link.split('/')) >= 5:
                seen.add(clean_link)
                main_links.append(clean_link)

        print(f"[INFO] 통합검색: {len(main_links)}개 블로그 포스트 링크")

        # 순위 찾기
        smartblock_rank = None
        main_blog_rank = None

        for i, link in enumerate(main_links[:30]):
            normalized_link = normalize_url(link)
            if normalized_target in normalized_link or normalized_link in normalized_target:
                if i < 10:
                    smartblock_rank = i + 1
                    print(f"[INFO] 스마트블록 {smartblock_rank}위 발견")
                else:
                    main_blog_rank = i - 9
                    print(f"[INFO] 블로그 영역 {main_blog_rank}위 발견")
                break

        # 2. 블로그 탭
        blog_tab_url = f"https://search.naver.com/search.naver?where=post&query={urllib.parse.quote(keyword)}"
        print(f"[INFO] 블로그 탭 접속: {blog_tab_url}")

        driver.get(blog_tab_url)
        time.sleep(2)

        blog_html = driver.page_source
        blog_matches = re.findall(blog_pattern, blog_html)
        blog_links = []
        seen = set()
        for link in blog_matches:
            clean_link = link.split('?')[0]
            if clean_link not in seen and ('/PostView.naver' in link or '/PostList.naver' in link or len(clean_link.split('/')) >= 5):
                seen.add(clean_link)
                blog_links.append(clean_link)

        print(f"[INFO] 블로그 탭: {len(blog_links)}개 블로그 포스트 링크")

        blog_tab_rank = None
        for i, link in enumerate(blog_links[:100]):
            normalized_link = normalize_url(link)
            if normalized_target in normalized_link or normalized_link in normalized_target:
                blog_tab_rank = i + 1
                print(f"[INFO] 블로그 탭 {blog_tab_rank}위 발견")
                break

        driver.quit()

        return jsonify({
            'success': True,
            'smartblock': {
                'found': smartblock_rank is not None,
                'rank': smartblock_rank,
                'area': 'smartblock',
                'areaName': '통합검색-스마트블록'
            },
            'mainBlog': {
                'found': main_blog_rank is not None,
                'rank': main_blog_rank,
                'area': 'blog',
                'areaName': '통합검색-블로그'
            },
            'blogTab': {
                'found': blog_tab_rank is not None,
                'rank': blog_tab_rank,
                'area': 'blog_tab',
                'areaName': '블로그탭'
            },
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        if driver:
            driver.quit()
        print(f"[ERROR] 순위 확인 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    load_api_keys()
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
