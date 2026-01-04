# TDD: 더나은기업연구소 관리자 시스템 개선

**작성일**: 2026-01-04
**버전**: 2.0
**상태**: 진행 중

---

## 1. 요구사항 요약

### 1.1 대시보드 (admin/index.html)
| 항목 | 현재 상태 | 목표 |
|------|----------|------|
| 최근접수내역 | "- - -" 표시 오류 | 실제 데이터 표시 |
| 접수내역 삭제 | 미검증 | 정상 작동 확인 |

### 1.2 게시판 시스템
| 항목 | 현재 상태 | 목표 |
|------|----------|------|
| 데이터 소스 | KPFC Airtable | 더나은기업연구소 Airtable |
| 이미지 업로드 | URL 입력 방식 | R2 파일 첨부 방식 |
| 프론트엔드 | API 직접 호출 | Airtable 캐시 조회 |
| 예시 게시글 | 없음 | 6개 (각 2,000자) |

### 1.3 방문통계
| 항목 | 현재 상태 | 목표 |
|------|----------|------|
| 기간 필터 | 오류 발생 | 정상 작동 |
| 데이터 저장 | GA4 직접 조회 | Airtable 캐시 |
| 자동 백필 | 미설정 | 일 1회 자동 수집 |

---

## 2. Airtable 스키마 설계

### 2.1 게시판 테이블 (board)

**Base ID**: 더나은기업연구소 Airtable Base

| 필드명 (영문) | 필드명 (한글) | 타입 | 설명 |
|--------------|--------------|------|------|
| title | 제목 | Single line text | 게시글 제목 |
| content | 내용 | Long text | HTML 또는 Markdown |
| summary | 요약 | Single line text | 목록 표시용 (100자) |
| category | 카테고리 | Single select | 정책자금, 지원사업, 공지사항 |
| thumbnailUrl | 썸네일URL | URL | R2 이미지 URL |
| tags | 태그 | Single line text | 쉼표 구분 |
| date | 작성일 | Date | YYYY-MM-DD |
| views | 조회수 | Number | 기본값 0 |
| isPublic | 게시여부 | Checkbox | 공개/비공개 |

### 2.2 분석 데이터 테이블 (analytics_daily)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| date | Date | YYYY-MM-DD |
| visitors | Number | 일일 방문자 수 |
| pageviews | Number | 일일 페이지뷰 |
| avg_duration | Number | 평균 체류시간 (초) |
| bounce_rate | Number | 이탈률 (0-1) |
| synced_at | DateTime | 수집 시간 |

---

## 3. 아키텍처

### 3.1 데이터 흐름

```
[GA4 API] → [Worker (백필)] → [Airtable 캐시]
                                    ↓
[Admin Dashboard] ←─────────── [Worker API]
                                    ↓
[Frontend (post.html)] ←───── [Worker API /posts]
```

### 3.2 이미지 업로드 흐름

```
[Admin 파일 선택] → [Worker /upload] → [R2 Bucket]
                                            ↓
                                    [Public URL 반환]
                                            ↓
                                    [Airtable thumbnailUrl 저장]
```

---

## 4. Worker API 엔드포인트

### 4.1 기존 엔드포인트 (검증 필요)

| 메서드 | 경로 | 설명 | 상태 |
|--------|------|------|------|
| GET | /leads | 접수 목록 조회 | 검증 필요 |
| DELETE | /leads/:id | 접수 삭제 | 검증 필요 |
| GET | /history/cached | 캐시된 분석 데이터 | 검증 필요 |

### 4.2 신규/수정 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /board | 게시글 목록 (공개만) |
| GET | /posts | 게시글 목록 (공개만, 별칭) |
| GET | /posts/:id | 개별 게시글 조회 |
| POST | /board | 게시글 생성 |
| PATCH | /board/:id | 게시글 수정 |
| DELETE | /board/:id | 게시글 삭제 |
| POST | /upload | 이미지 업로드 (R2) |
| POST | /analytics/backfill | GA4 데이터 백필 |

---

## 5. 구현 상세

### 5.1 대시보드 최근접수내역 수정

**파일**: `admin/index.html`

**현재 문제**: 
- API 호출은 정상이나 테이블 렌더링 로직에서 필드명 매핑 오류

**수정 사항**:
```javascript
// 수정 전: Airtable 필드명과 불일치
row.기업명

// 수정 후: Worker API 응답 필드명 사용
row.Company
```

### 5.2 게시판 Airtable 연동

**Worker 수정 (worker.js)**:

```javascript
// 게시글 목록 조회 - Airtable 직접 조회
if (method === 'GET' && (path === '/board' || path === '/posts')) {
  const response = await fetch(
    `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/board?` +
    `filterByFormula={isPublic}=TRUE()&sort[0][field]=date&sort[0][direction]=desc`,
    { headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` } }
  );
  // ...
}
```

### 5.3 이미지 업로드 (R2)

**Worker 추가 (worker.js)**:

```javascript
// POST /upload - R2 이미지 업로드
if (method === 'POST' && path === '/upload') {
  const formData = await request.formData();
  const file = formData.get('file');
  
  const key = `board/${Date.now()}-${file.name}`;
  await env.R2_BUCKET.put(key, file.stream());
  
  const url = `https://pub-1872e954c9da49929650d78642a05e08.r2.dev/${key}`;
  return new Response(JSON.stringify({ success: true, url }));
}
```

### 5.4 GA4 자동 백필 (Cron Trigger)

**wrangler.toml 추가**:

```toml
[triggers]
crons = ["0 16 * * *"]  # 매일 01:00 KST (UTC 16:00)
```

**Worker scheduled 핸들러**:

```javascript
export default {
  async scheduled(event, env, ctx) {
    // GA4에서 어제 데이터 수집
    const yesterday = getYesterdayDate();
    const accessToken = await getAccessToken(env);
    const data = await fetchGA4Data(accessToken, env.GA4_PROPERTY_ID, yesterday);
    
    // Airtable에 저장
    await saveToAirtable(env, yesterday, data);
  }
}
```

---

## 6. 예시 게시글 구조

**참고**: https://www.k-eai.kr/process 공지사항 형식

### 6.1 게시글 HTML 구조

```html
<article class="post-content">
  <h2>2026년 중소기업 정책자금 신규 지원 안내</h2>
  
  <div class="post-meta">
    <span class="date">2026.01.04</span>
    <span class="category">정책자금</span>
  </div>
  
  <div class="post-body">
    <h3>1. 개요</h3>
    <p>...</p>
    
    <h3>2. 지원 대상</h3>
    <ul>
      <li>...</li>
    </ul>
    
    <h3>3. 신청 방법</h3>
    <p>...</p>
    
    <div class="info-box">
      <strong>문의처</strong>
      <p>중소벤처기업부 정책자금과 ☎ 044-204-7800</p>
    </div>
  </div>
</article>
```

### 6.2 6개 예시 게시글 주제

1. **2026년 중소기업 정책자금 신규 지원 안내**
2. **소상공인 희망리턴패키지 지원사업 공고**
3. **중소벤처기업부 비수도권 균형발전 지원금 안내**
4. **2026년 K-뷰티 수출지원 프로그램 참가기업 모집**
5. **AX(AI 전환) 스프린트 트랙 지원사업 안내**
6. **소상공인 특별경영안정자금 긴급 지원**

---

## 7. 테스트 계획

### 7.1 대시보드 테스트

| 테스트 항목 | 예상 결과 |
|------------|----------|
| 최근접수내역 표시 | 기업명, 대표자, 연락처 등 정상 표시 |
| 접수 삭제 | 삭제 후 목록에서 제거 확인 |
| 방문통계 차트 | 데이터 정상 렌더링 |

### 7.2 게시판 테스트

| 테스트 항목 | 예상 결과 |
|------------|----------|
| 게시글 목록 조회 | 더나은기업연구소 데이터만 표시 |
| 게시글 작성 | Airtable에 저장, 목록 갱신 |
| 이미지 업로드 | R2에 저장, URL 반환 |
| 게시글 수정/삭제 | 정상 동작 |

### 7.3 방문통계 테스트

| 테스트 항목 | 예상 결과 |
|------------|----------|
| 기간 필터 | 7일/14일/30일 정상 전환 |
| 자동 백필 | 매일 01:00 실행, Airtable 저장 |

---

## 8. 작업 순서

1. ✅ 요구사항 정리 및 TDD 작성
2. ⏳ 대시보드 최근접수내역 오류 수정
3. ⏳ 접수내역 삭제 로직 검증
4. ⏳ Airtable 게시판 테이블 구조 설계 및 생성
5. ⏳ 게시판 API - Airtable 연동 수정
6. ⏳ 게시판 이미지 업로드 기능 (R2)
7. ⏳ k-eai.kr 게시글 구조 분석
8. ⏳ 예시 게시글 6개 작성
9. ⏳ 방문통계 기간필터 오류 수정
10. ⏳ 방문통계 Airtable 캐시 구조 설계
11. ⏳ GA4 데이터 자동 백필 설정
12. ⏳ 전체 테스트 및 배포

---

## 9. 환경 설정

### 9.1 Cloudflare Worker 환경변수

| 변수명 | 값 | 상태 |
|--------|-----|------|
| GA4_PROPERTY_ID | 518306214 | ✅ 설정됨 |
| ADMIN_PASSWORD | clsrndu!1 | ✅ 설정됨 |
| SERVICE_ACCOUNT_EMAIL | betterlab@... | ✅ 설정됨 |
| SERVICE_ACCOUNT_PRIVATE_KEY | (설정됨) | ✅ 설정됨 |
| AIRTABLE_TOKEN | (필요) | ⏳ 확인 필요 |
| AIRTABLE_BASE_ID | (필요) | ⏳ 확인 필요 |

### 9.2 R2 설정

| 항목 | 값 |
|------|-----|
| Account ID | 11fb32b3efbcb8f3de0a2dff940797a5 |
| Bucket | betterlab |
| Public URL | https://pub-1872e954c9da49929650d78642a05e08.r2.dev |

---

*문서 끝*
