# PRD: 방문통계 데이터 파이프라인 수정

## 문서 정보
- **작성일**: 2025-01-04
- **작성자**: AI Assistant
- **버전**: 1.0
- **상태**: Draft

---

## 1. 문제 정의

### 1.1 현상
관리자 대시보드(`/admin/analytics.html`)에서 다음 데이터가 표시되지 않음:
1. **기간별 누적 데이터** (오늘/주간/월간 비교 카드)
2. **장기 추이 차트** (히스토리 차트)
3. **일별 상세 데이터 테이블**
4. **기간 분석 평가** (인사이트)

### 1.2 원인 분석
| 구분 | 원인 | 영향도 |
|------|------|--------|
| 1 | Airtable `analytics_daily` 테이블 미생성 또는 데이터 없음 | Critical |
| 2 | Worker Cron 최초 배포 후 Backfill 미수행 | High |
| 3 | 기간 필터 날짜 범위 필터링 로직 미작동 가능성 | Medium |

### 1.3 데이터 흐름 분석
```
현재 아키텍처:
┌─────────────────┐     ┌────────────────────┐     ┌──────────────┐
│   GA4 (Google)  │────▶│  Cloudflare Worker │────▶│   Airtable   │
│ 측정 ID: G-HMB  │     │  betterlab-analytics│     │ analytics_daily │
│ 속성 ID: 132389 │     │  Cron: 01:00 KST   │     │ (캐시 저장소)│
└─────────────────┘     └────────────────────┘     └──────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   프론트엔드      │
                        │ admin/analytics  │
                        │ /history/cached  │
                        └──────────────────┘
```

---

## 2. 요구사항

### 2.1 기능 요구사항

#### FR-01: Airtable 테이블 구조
| 필드명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| date | Text | 날짜 (YYYY-MM-DD) | O |
| visitors | Number | 일일 방문자 수 | O |
| pageviews | Number | 일일 페이지뷰 | O |
| avg_duration | Number | 평균 체류시간 (초) | O |
| bounce_rate | Number | 이탈률 (0-1) | O |
| collected_at | Text | 수집 시점 (ISO) | O |

#### FR-02: 데이터 수집 자동화
- 매일 KST 01:00 (UTC 16:00) 자동 실행
- 전일(어제) 데이터 GA4에서 수집
- Airtable `analytics_daily` 테이블에 저장/업데이트

#### FR-03: Backfill 기능
- `/backfill?days=N` 엔드포인트로 과거 N일 데이터 일괄 수집
- 중복 방지: 기존 레코드 있으면 UPDATE, 없으면 INSERT

#### FR-04: 캐시 조회 API
- `/history/cached?days=N`: Airtable에서 직접 조회 (GA4 API 호출 없음)
- 프론트엔드 기간 필터와 연동

### 2.2 비기능 요구사항
| 구분 | 요구사항 |
|------|----------|
| 성능 | 캐시 조회 응답시간 < 2초 |
| 신뢰성 | Cron 실패 시 다음 날 재수집 |
| 확장성 | 최대 365일 히스토리 저장 |

---

## 3. 해결 방안

### 3.1 단계별 실행 계획

#### Phase 1: Airtable 테이블 확인/생성 (즉시)
1. Airtable Base `appiCVibf1BnLxKOL`에 `analytics_daily` 테이블 존재 여부 확인
2. 없으면 필드 구조에 맞게 생성
3. 필드 타입 검증

#### Phase 2: 초기 데이터 수집 (즉시)
1. Backfill API 호출: `GET /backfill?days=30`
2. 최근 30일 GA4 데이터 Airtable에 저장
3. 결과 검증

#### Phase 3: 프론트엔드 연동 점검 (필요시)
1. 기간 필터 → `/history/cached` 호출 확인
2. 날짜 범위 필터링 로직 점검
3. 차트 및 테이블 렌더링 검증

### 3.2 기술 스택
- **백엔드**: Cloudflare Workers
- **데이터베이스**: Airtable (캐시)
- **데이터 소스**: Google Analytics 4 Data API
- **프론트엔드**: Vanilla JS + Chart.js

---

## 4. 성공 기준

### 4.1 완료 조건
- [ ] Airtable `analytics_daily` 테이블에 30일 이상 데이터 존재
- [ ] 관리자 대시보드에서 "기간별 누적 데이터" 정상 표시
- [ ] "장기 추이 차트" 정상 렌더링
- [ ] "일별 상세 데이터" 테이블 정상 표시
- [ ] "기간 분석 평가" 인사이트 정상 생성
- [ ] 기간 필터(7일/14일/30일/90일) 변경 시 데이터 갱신

### 4.2 검증 방법
1. 브라우저 DevTools Network 탭에서 `/history/cached` 응답 확인
2. Airtable UI에서 `analytics_daily` 테이블 데이터 확인
3. 관리자 페이지 UI 육안 확인

---

## 5. 참고 정보

### 5.1 API 엔드포인트
| 엔드포인트 | 설명 |
|------------|------|
| `GET /history/cached?days=N` | Airtable 캐시 데이터 조회 |
| `GET /backfill?days=N` | 과거 N일 데이터 백필 |
| `GET /analytics/all` | GA4 실시간 전체 데이터 |

### 5.2 환경 변수
- `AIRTABLE_TOKEN`: Airtable Personal Access Token
- `AIRTABLE_BASE_ID`: appiCVibf1BnLxKOL
- `GA4_PROPERTY_ID`: 13238940960
- `SERVICE_ACCOUNT_EMAIL`: betterlab@betterlab.iam.gserviceaccount.com

### 5.3 관련 파일
- `/admin/analytics.html` - 관리자 방문통계 페이지
- `/scripts/worker.js` - Cloudflare Worker (GA4 연동 + Cron)
- `/scripts/wrangler.toml` - Worker 설정 (Cron 스케줄)
