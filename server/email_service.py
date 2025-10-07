# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# 스티비 API 설정 (파일에서 읽기)
def load_stibee_config():
    """stibee_key.txt 파일에서 API 키 정보를 읽어옵니다."""
    api_key = ''

    try:
        with open('stibee_key.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith('#') or not line.strip():
                    continue
                if ':' in line:
                    key, value = line.strip().split(':', 1)
                    key = key.strip().replace(' ', '').upper()
                    value = value.strip()

                    if key == 'STIBEE_API_KEY':
                        api_key = value
                        break
    except FileNotFoundError:
        print('[WARNING] stibee_key.txt 파일을 찾을 수 없습니다.')
    except Exception as e:
        print(f'[ERROR] 스티비 설정 파일 읽기 오류: {str(e)}')

    return api_key

STIBEE_API_KEY = load_stibee_config() or os.getenv('STIBEE_API_KEY', '')
STIBEE_API_URL = 'https://api.stibee.com/v1'

def send_email_via_stibee(subject, body, recipients):
    """
    스티비 API를 사용하여 이메일 발송

    Args:
        subject (str): 이메일 제목
        body (str): 이메일 본문 (HTML 또는 텍스트)
        recipients (list): 수신자 리스트 [{'email': 'xxx@xxx.com', 'name': 'xxx'}, ...]

    Returns:
        dict: 발송 결과
    """
    if not STIBEE_API_KEY:
        return {'success': False, 'message': 'Stibee API 키가 설정되지 않았습니다.'}

    try:
        # 스티비 API 엔드포인트
        url = f'{STIBEE_API_URL}/campaigns'

        headers = {
            'AccessToken': STIBEE_API_KEY,
            'Content-Type': 'application/json'
        }

        # HTML 형식으로 본문 변환 (줄바꿈 처리)
        html_body = body.replace('\n', '<br>')

        # 발송 데이터 구성 (스티비 Transactional Email API 사용)
        data = {
            'subject': subject,
            'content': f'''
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                        padding: 30px;
                        text-align: center;
                        border-radius: 8px 8px 0 0;
                    }}
                    .header h1 {{
                        color: white;
                        margin: 0;
                        font-size: 24px;
                    }}
                    .content {{
                        background: #ffffff;
                        padding: 30px;
                        border: 1px solid #e5e7eb;
                        border-top: none;
                    }}
                    .footer {{
                        background: #f9fafb;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #6b7280;
                        border-radius: 0 0 8px 8px;
                    }}
                    .button {{
                        display: inline-block;
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        margin-top: 20px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Keyword Insight Pro</h1>
                </div>
                <div class="content">
                    {html_body}
                </div>
                <div class="footer">
                    <p>이 이메일은 Keyword Insight Pro에서 발송되었습니다.</p>
                    <p>더 이상 이메일을 받고 싶지 않으시다면, <a href="{{$unsubscribe_link$}}">수신 거부</a>를 클릭하세요.</p>
                </div>
            </body>
            </html>
            ''',
            'subscribers': []
        }

        # 수신자 추가
        for recipient in recipients:
            if recipient.get('email'):
                data['subscribers'].append({
                    'email': recipient['email'],
                    'name': recipient.get('name', recipient['email'].split('@')[0])
                })

        print(f'[INFO] 스티비 API 호출 시작: {len(recipients)}명에게 발송')
        print(f'[INFO] 제목: {subject}')

        # API 호출
        response = requests.post(url, json=data, headers=headers)

        print(f'[INFO] 스티비 API 응답 코드: {response.status_code}')
        print(f'[INFO] 스티비 API 응답: {response.text}')

        if response.status_code in [200, 201]:
            return {
                'success': True,
                'message': f'{len(recipients)}명에게 이메일이 발송되었습니다.',
                'data': response.json()
            }
        else:
            return {
                'success': False,
                'message': f'이메일 발송 실패: {response.text}'
            }

    except Exception as e:
        print(f'[ERROR] 이메일 발송 중 오류 발생: {str(e)}')
        return {
            'success': False,
            'message': f'이메일 발송 중 오류가 발생했습니다: {str(e)}'
        }


@app.route('/api/send-email', methods=['POST'])
def send_email():
    """
    이메일 발송 API 엔드포인트
    """
    try:
        data = request.json
        subject = data.get('subject', '')
        body = data.get('body', '')
        recipients = data.get('recipients', [])

        # 유효성 검사
        if not subject or not body:
            return jsonify({
                'success': False,
                'message': '제목과 본문은 필수입니다.'
            }), 400

        if not recipients or len(recipients) == 0:
            return jsonify({
                'success': False,
                'message': '수신자가 없습니다.'
            }), 400

        # 스티비를 통해 이메일 발송
        result = send_email_via_stibee(subject, body, recipients)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        print(f'[ERROR] /api/send-email 오류: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'서버 오류: {str(e)}'
        }), 500


@app.route('/api/email/test', methods=['GET'])
def test_email_api():
    """
    이메일 API 테스트 엔드포인트
    """
    return jsonify({
        'success': True,
        'message': 'Email API is running',
        'stibee_api_configured': bool(STIBEE_API_KEY)
    })


if __name__ == '__main__':
    print('=' * 50)
    print('Email Service API Server')
    print('=' * 50)
    print(f'Stibee API Key 설정: {"✓ 설정됨" if STIBEE_API_KEY else "✗ 미설정"}')
    print('=' * 50)

    if not STIBEE_API_KEY:
        print('\n⚠️  경고: 스티비 API 키가 설정되지 않았습니다.')
        print('환경 변수 STIBEE_API_KEY를 설정하거나')
        print('server/stibee_key.txt 파일을 생성해주세요.\n')

    app.run(debug=True, port=8082)
