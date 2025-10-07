# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

# Gmail 설정 (파일에서 읽기)
def load_gmail_config():
    """gmail_config.txt 파일에서 Gmail 설정을 읽어옵니다."""
    config = {
        'email': '',
        'password': ''
    }

    try:
        with open('gmail_config.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith('#') or not line.strip():
                    continue
                if ':' in line:
                    key, value = line.strip().split(':', 1)
                    key = key.strip().replace(' ', '').upper()
                    value = value.strip()

                    if key == 'GMAIL_EMAIL':
                        config['email'] = value
                    elif key == 'GMAIL_APP_PASSWORD':
                        config['password'] = value
    except FileNotFoundError:
        print('[WARNING] gmail_config.txt 파일을 찾을 수 없습니다.')
    except Exception as e:
        print(f'[ERROR] Gmail 설정 파일 읽기 오류: {str(e)}')

    return config

STIBEE_API_KEY = load_stibee_config() or os.getenv('STIBEE_API_KEY', '')
STIBEE_API_URL = 'https://api.stibee.com/v1'

GMAIL_CONFIG = load_gmail_config()
GMAIL_EMAIL = GMAIL_CONFIG.get('email') or os.getenv('GMAIL_EMAIL', '')
GMAIL_PASSWORD = GMAIL_CONFIG.get('password') or os.getenv('GMAIL_APP_PASSWORD', '')

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


def send_email_via_gmail(subject, body, recipients):
    """
    Gmail SMTP를 사용하여 이메일 발송

    Args:
        subject (str): 이메일 제목
        body (str): 이메일 본문 (HTML 또는 텍스트)
        recipients (list): 수신자 리스트 [{'email': 'xxx@xxx.com', 'name': 'xxx'}, ...]

    Returns:
        dict: 발송 결과
    """
    if not GMAIL_EMAIL or not GMAIL_PASSWORD:
        return {'success': False, 'message': 'Gmail 설정이 완료되지 않았습니다.'}

    try:
        # HTML 형식으로 본문 변환
        html_body = body.replace('\n', '<br>')

        # HTML 이메일 템플릿
        html_template = f'''
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
            </div>
        </body>
        </html>
        '''

        print(f'[INFO] Gmail SMTP 발송 시작: {len(recipients)}명에게 발송')
        print(f'[INFO] 제목: {subject}')

        # SMTP 서버 연결
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_EMAIL, GMAIL_PASSWORD)

        success_count = 0
        failed_count = 0

        # 각 수신자에게 개별 발송
        for recipient in recipients:
            try:
                msg = MIMEMultipart('alternative')
                msg['From'] = GMAIL_EMAIL
                msg['To'] = recipient['email']
                msg['Subject'] = subject

                html_part = MIMEText(html_template, 'html')
                msg.attach(html_part)

                server.send_message(msg)
                success_count += 1
                print(f'[INFO] 발송 성공: {recipient["email"]}')
            except Exception as e:
                failed_count += 1
                print(f'[ERROR] 발송 실패 ({recipient["email"]}): {str(e)}')

        server.quit()

        if success_count > 0:
            return {
                'success': True,
                'message': f'{success_count}명에게 이메일이 발송되었습니다. (실패: {failed_count}명)',
                'data': {'success': success_count, 'failed': failed_count}
            }
        else:
            return {
                'success': False,
                'message': f'모든 이메일 발송에 실패했습니다.'
            }

    except Exception as e:
        print(f'[ERROR] Gmail 발송 중 오류 발생: {str(e)}')
        return {
            'success': False,
            'message': f'Gmail 발송 중 오류가 발생했습니다: {str(e)}'
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
        method = data.get('method', 'stibee')  # 'stibee' 또는 'gmail'

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

        # 선택된 방식으로 이메일 발송
        if method == 'gmail':
            result = send_email_via_gmail(subject, body, recipients)
        else:
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
        'stibee_configured': bool(STIBEE_API_KEY),
        'gmail_configured': bool(GMAIL_EMAIL and GMAIL_PASSWORD)
    })


if __name__ == '__main__':
    print('=' * 50)
    print('Email Service API Server')
    print('=' * 50)
    print(f'Stibee API 설정: {"✓ 설정됨" if STIBEE_API_KEY else "✗ 미설정"}')
    print(f'Gmail 설정: {"✓ 설정됨" if (GMAIL_EMAIL and GMAIL_PASSWORD) else "✗ 미설정"}')
    print('=' * 50)

    if not STIBEE_API_KEY and not (GMAIL_EMAIL and GMAIL_PASSWORD):
        print('\n⚠️  경고: 이메일 발송 설정이 완료되지 않았습니다.')
        print('다음 중 하나를 설정해주세요:')
        print('1. 스티비: server/stibee_key.txt 파일 생성')
        print('2. Gmail: server/gmail_config.txt 파일 생성\n')

    app.run(debug=True, port=8082)
