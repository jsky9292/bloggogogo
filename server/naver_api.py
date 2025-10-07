# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, jsonify, send_file
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

        return pd.DataFrame(response_data['keywordList'])

# API 키 로드
def load_api_keys():
    global ad_userkey_list, search_userkey_list, google_youtube_keys

    # 광고 API 키 로드
    ad_userkey_list = []
    with open('ad_key.txt', 'r') as f:
        lines = f.readlines()
        for line in lines:
            line = line.strip().replace(" ","").split(':')[-1]
            ad_userkey_list.append(line)

    # 검색 API 키 로드
    search_userkey_list = []
    with open('search_key.txt', 'r') as f:
        lines = f.readlines()
        for line in lines:
            line = line.strip().replace(" ","").split(':')[-1]
            search_userkey_list.append(line)

    # Google & YouTube API 키 로드
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
            print(f"[INFO] Google/YouTube API 키 로드 완료: {list(google_youtube_keys.keys())}")
    except FileNotFoundError:
        print("Warning: google_youtube_key.txt not found. Google/YouTube features will be disabled.")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search_keywords', methods=['POST'])
def search_keywords():
    try:
        keyword = request.json['keyword']
        signature_obj = Signature()

        # 연관 키워드 조회
        df = signature_obj.getresults(keyword)

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
        return jsonify({'success': False, 'error': str(e)})

@app.route('/analyze_competition', methods=['POST'])
def analyze_competition():
    try:
        keywords_data = request.json['keywords']
        df = pd.DataFrame(keywords_data)

        total_values_list = []

        for idx, text in enumerate(df['연관키워드']):
            client_id = search_userkey_list[0]
            client_secret = search_userkey_list[1]

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
                total_values_list.append(json.loads(total_num)['total'])

            # 진행률 업데이트
            progress_status["current"] = idx + 1
            progress_status["total"] = len(df)
            progress_status["message"] = f"{text} 분석 완료"

            time.sleep(0.05)  # API 호출 제한 방지

        df['총문서수'] = total_values_list
        df['경쟁률'] = df['총검색량'] / df['총문서수']

        # 엑셀 파일 저장
        now = datetime.now()
        filename = f'키워드분석_{now.strftime("%Y%m%d_%H%M%S")}.xlsx'
        df.to_excel(filename, index=False)

        return jsonify({
            'success': True,
            'data': df.to_dict('records'),
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

if __name__ == '__main__':
    load_api_keys()
    app.run(debug=True, port=8080)
