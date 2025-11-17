# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import time
import urllib.parse
import urllib.request
import json
import hashlib
import hmac
import base64
import requests
from datetime import datetime
import os

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

    def getresults(self, hintKeywords, api_key=None, secret_key=None, customer_id=None):
        BASE_URL = 'https://api.naver.com'

        # 사용자 제공 API 키가 있으면 사용, 없으면 기본 키 사용
        API_KEY = api_key if api_key else ad_userkey_list[0]
        SECRET_KEY = secret_key if secret_key else ad_userkey_list[1]
        CUSTOMER_ID = customer_id if customer_id else ad_userkey_list[2]

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

        return pd.DataFrame(response_data['keywordList'])

# API 키 로드
def load_api_keys():
    global ad_userkey_list, search_userkey_list, google_youtube_keys

    # 현재 파일의 디렉토리 경로
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # 광고 API 키 로드
    ad_userkey_list = []
    ad_key_path = os.path.join(current_dir, 'ad_key.txt')
    with open(ad_key_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines:
            line = line.strip().replace(" ","").split(':')[-1]
            ad_userkey_list.append(line)

    # 검색 API 키 로드
    search_userkey_list = []
    search_key_path = os.path.join(current_dir, 'search_key.txt')
    with open(search_key_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in lines:
            line = line.strip().replace(" ","").split(':')[-1]
            search_userkey_list.append(line)

    # Google & YouTube API 키 로드
    google_youtube_keys = {}
    try:
        google_key_path = os.path.join(current_dir, 'google_youtube_key.txt')
        with open(google_key_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                parts = line.strip().replace(" ","").split(':')
                if len(parts) >= 2:
                    key = parts[0]
                    value = ':'.join(parts[1:])  # API 키에 :가 포함될 수 있음
                    google_youtube_keys[key] = value
            print(f"[INFO] Google/YouTube API 키 로드 완료: {list(google_youtube_keys.keys())}")
    except FileNotFoundError:
        print("Warning: google_youtube_key.txt not found. Google/YouTube features will be disabled.")

@app.route('/search_keywords', methods=['POST'])
def search_keywords():
    try:
        data = request.json
        keyword = data['keyword']

        # 사용자가 제공한 API 키 (선택사항)
        api_keys = data.get('apiKeys', {})
        user_api_key = api_keys.get('adApiKey')
        user_secret_key = api_keys.get('adSecretKey')
        user_customer_id = api_keys.get('adCustomerId')

        print(f"[INFO] 키워드 검색 요청: {keyword}")
        print(f"[INFO] 사용자 API 키 제공: {bool(user_api_key)}")

        signature_obj = Signature()

        # 연관 키워드 조회 (사용자 API 키 또는 기본 키)
        df = signature_obj.getresults(keyword, user_api_key, user_secret_key, user_customer_id)
        print(f"[INFO] 조회된 키워드 수: {len(df)}")

        df.rename({
            'relKeyword':'연관키워드',
            'monthlyPcQcCnt':'모바일검색량',
            'monthlyMobileQcCnt':'PC검색량',
            'compIdx':'경쟁강도'
        }, axis=1, inplace=True)

        df['모바일검색량'] = df['모바일검색량'].apply(lambda x: int(str(x).replace('<', '').strip()))
        df['PC검색량'] = df['PC검색량'].apply(lambda x: int(str(x).replace('<', '').strip()))
        df['총검색량'] = df['모바일검색량'] + df['PC검색량']
        df = df[['연관키워드', '모바일검색량','PC검색량','총검색량','경쟁강도']]

        return jsonify({
            'success': True,
            'data': df.to_dict('records'),
            'total': len(df)
        })
    except Exception as e:
        print(f"[ERROR] 키워드 검색 실패: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/analyze_competition', methods=['POST'])
def analyze_competition():
    try:
        data = request.json
        keywords_data = data['keywords']

        # 사용자가 제공한 검색 API 키 (선택사항)
        api_keys = data.get('apiKeys', {})
        user_client_id = api_keys.get('searchClientId')
        user_client_secret = api_keys.get('searchClientSecret')

        print(f"[INFO] 경쟁도 분석 요청: {len(keywords_data)}개 키워드")
        print(f"[INFO] 사용자 검색 API 키 제공: {bool(user_client_id)}")

        df = pd.DataFrame(keywords_data)

        total_values_list = []

        for idx, text in enumerate(df['연관키워드']):
            try:
                # 사용자 키가 있으면 사용, 없으면 기본 키 사용
                client_id = user_client_id if user_client_id else search_userkey_list[0]
                client_secret = user_client_secret if user_client_secret else search_userkey_list[1]

                encText = urllib.parse.quote(text)
                url = "https://openapi.naver.com/v1/search/blog?query=" + encText

                req = urllib.request.Request(url)
                req.add_header("X-Naver-Client-Id", client_id)
                req.add_header("X-Naver-Client-Secret", client_secret)

                response = urllib.request.urlopen(req)
                rescode = response.getcode()

                if rescode == 200:
                    response_body = response.read()
                    total_num = response_body.decode('utf-8')
                    total = json.loads(total_num)['total']
                    total_values_list.append(total)
                    print(f"[INFO] {text}: 총문서수 {total}")
                else:
                    print(f"[WARNING] {text}: API 응답 코드 {rescode}")
                    total_values_list.append(0)

                # 진행률 업데이트
                progress_status["current"] = idx + 1
                progress_status["total"] = len(df)
                progress_status["message"] = f"{text} 분석 완료"

                time.sleep(0.05)  # API 호출 제한 방지
            except Exception as e:
                print(f"[ERROR] {text} 분석 실패: {str(e)}")
                total_values_list.append(0)

        df['총문서수'] = total_values_list
        df['경쟁률'] = df['총검색량'] / df['총문서수']

        print(f"[INFO] 경쟁도 분석 완료")
        print(f"[DEBUG] 첫 번째 데이터: {df.iloc[0].to_dict()}")

        # 엑셀 파일 저장
        now = datetime.now()
        filename = f'키워드분석_{now.strftime("%Y%m%d_%H%M%S")}.xlsx'
        current_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(current_dir, filename)
        df.to_excel(file_path, index=False)
        print(f"[INFO] 엑셀 파일 저장: {filename}")

        return jsonify({
            'success': True,
            'data': df.to_dict('records'),
            'filename': filename
        })
    except Exception as e:
        print(f"[ERROR] 경쟁도 분석 실패: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})


@app.route('/progress')
def get_progress():
    return jsonify(progress_status)


@app.route('/download/<filename>')
def download_file(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, filename)
    return send_file(file_path, as_attachment=True)

# API 키 로드 (모듈 임포트 시 자동 실행)
load_api_keys()

if __name__ == '__main__':
    app.run(debug=True, port=8080)