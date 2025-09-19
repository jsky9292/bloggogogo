# Keyword Insight Pro - SaaS 아키텍처 설계

## 1. 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  - 사용자 인증 (JWT)                                          │
│  - 요금제별 기능 제한                                         │
│  - 대시보드 & 분석 화면                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
┌──────────────────────▼──────────────────────────────────────┐
│               Backend API Server (Node.js/Express)           │
│  - 인증/인가 미들웨어                                         │
│  - 사용량 추적 & 제한                                        │
│  - 결제 처리 (Stripe/PayPal)                                │
│  - API 프록시 & 캐싱                                        │
└──────────┬─────────────────────────────┬────────────────────┘
           │                             │
┌──────────▼──────────┐       ┌─────────▼────────────────────┐
│     PostgreSQL      │       │      Redis Cache             │
│  - 사용자 정보      │       │  - 세션 관리                  │
│  - 구독 정보        │       │  - API 응답 캐싱              │
│  - 사용 로그        │       │  - Rate Limiting             │
│  - 분석 결과        │       └──────────────────────────────┘
└────────────────────┘       

## 2. 요금제 구조

### 무료 플랜 (Free)
- 일일 10회 검색
- 기본 키워드 분석만
- 광고 표시

### 스타터 플랜 (월 $19)
- 일일 100회 검색
- 모든 분석 기능
- API 응답 캐싱
- 이메일 지원

### 프로 플랜 (월 $49)
- 일일 500회 검색
- AI 블로그 글쓰기
- 벌크 분석
- 우선 지원
- 팀 협업 (5명)

### 엔터프라이즈 플랜 (맞춤형)
- 무제한 검색
- 전용 서버
- SLA 보장
- 24/7 지원

## 3. 데이터베이스 스키마

### Users 테이블
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active'
);
```

### Subscriptions 테이블
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    plan_type VARCHAR(50) NOT NULL, -- free, starter, pro, enterprise
    status VARCHAR(50) NOT NULL, -- active, cancelled, expired
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Usage 테이블
```sql
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255),
    request_data JSONB,
    response_data JSONB,
    tokens_used INTEGER,
    credits_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Keys 테이블
```sql
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    service_name VARCHAR(50), -- gemini, claude, openai
    encrypted_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 4. 백엔드 API 엔드포인트

### 인증 관련
- POST /api/auth/register - 회원가입
- POST /api/auth/login - 로그인
- POST /api/auth/logout - 로그아웃
- POST /api/auth/refresh - 토큰 갱신
- POST /api/auth/forgot-password - 비밀번호 찾기
- POST /api/auth/reset-password - 비밀번호 재설정

### 구독 관련
- GET /api/subscription/plans - 요금제 목록
- GET /api/subscription/current - 현재 구독 정보
- POST /api/subscription/subscribe - 구독 시작
- POST /api/subscription/cancel - 구독 취소
- POST /api/subscription/upgrade - 플랜 업그레이드

### 키워드 분석 API
- POST /api/keywords/analyze - 키워드 분석
- POST /api/keywords/related - 연관 키워드 분석
- POST /api/keywords/blogs - 블로그 분석
- POST /api/keywords/competition - 경쟁력 분석
- GET /api/keywords/history - 검색 히스토리

### 사용량 관련
- GET /api/usage/current - 현재 사용량
- GET /api/usage/history - 사용 기록
- GET /api/usage/limits - 사용 한도

## 5. 보안 및 인증

### JWT 토큰 구조
```javascript
{
  "userId": "uuid",
  "email": "user@example.com",
  "plan": "pro",
  "limits": {
    "dailySearches": 500,
    "features": ["ai_blog", "bulk_analysis"]
  },
  "exp": 1234567890
}
```

### API Rate Limiting
```javascript
// Redis를 사용한 Rate Limiting
const rateLimits = {
  free: { requests: 10, window: '1d' },
  starter: { requests: 100, window: '1d' },
  pro: { requests: 500, window: '1d' },
  enterprise: { requests: Infinity, window: '1d' }
};
```

## 6. 결제 시스템 (Stripe Integration)

### Webhook 처리
- payment_intent.succeeded - 결제 성공
- customer.subscription.created - 구독 생성
- customer.subscription.updated - 구독 변경
- customer.subscription.deleted - 구독 취소

## 7. 모니터링 및 분석

### 추적할 메트릭
- DAU/MAU (일일/월간 활성 사용자)
- 검색 횟수 및 패턴
- API 응답 시간
- 에러율
- 전환율 (무료→유료)
- 이탈률

### 관리자 대시보드
- 실시간 사용자 활동
- 수익 현황
- 서버 상태
- 에러 로그
- 사용자 지원 티켓

## 8. 배포 아키텍처

### 프로덕션 환경
```yaml
# Docker Compose 구성
services:
  frontend:
    - React App (Nginx)
    - CloudFlare CDN
  
  backend:
    - Node.js API (PM2)
    - Load Balancer (3+ instances)
  
  database:
    - PostgreSQL (Master-Slave)
    - Automatic Backups
  
  cache:
    - Redis Cluster
    - Session Store
  
  monitoring:
    - Prometheus
    - Grafana
    - Sentry
```

## 9. 구현 우선순위

1. **Phase 1 (MVP)** - 2주
   - 사용자 인증 시스템
   - 기본 요금제 구조
   - 사용량 제한

2. **Phase 2** - 2주
   - 결제 시스템 통합
   - 구독 관리
   - 이메일 알림

3. **Phase 3** - 2주
   - 관리자 대시보드
   - 분석 및 리포팅
   - 고객 지원 시스템

4. **Phase 4** - 1주
   - 성능 최적화
   - 보안 강화
   - 배포 자동화

## 10. 예상 비용 구조

### 월간 운영비 (1000명 사용자 기준)
- 서버 호스팅 (AWS/GCP): $200-300
- 데이터베이스: $50-100
- CDN: $20-50
- 이메일 서비스: $10-20
- 모니터링 도구: $50
- **총 예상 비용: $330-520/월**

### 수익 예상
- 무료 사용자 70% (700명): $0
- 스타터 20% (200명): $3,800
- 프로 8% (80명): $3,920
- 엔터프라이즈 2% (20명): $2,000+
- **총 예상 수익: $9,720+/월**
- **순이익: $9,200+/월**