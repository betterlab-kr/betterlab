# PRD: 브랜드 마이그레이션 (KPFC → 더나은기업연구소)

## 개요

**목적**: 한국정책자금지원센터(KPFC) 브랜드를 더나은기업연구소(BETTER LAB)로 전환

**작업 방식**: 페이지별, 섹션별 순차 작업 (스크립트 일괄 변경 X)

---

## 브랜드 정보

### 기존 (KPFC)
| 항목 | 값 |
|------|-----|
| 브랜드명 | 한국정책자금지원센터 |
| 영문명 | KPFC |
| 대표번호 | 1588-9097 |
| 이메일 | gunme7@naver.com |
| 주소 | 서울특별시 강남구 강남대로 92길 31, 6층 |
| 도메인 | kpfc.kr |

### 신규 (더나은기업연구소)
| 항목 | 값 |
|------|-----|
| 브랜드명 | 더나은기업연구소 |
| 영문명 | BETTER LAB |
| 대표 | 안재우 |
| 연락처 | 010-3558-4305 |
| 이메일 | skai9@naver.com |
| 주소 | 서울특별시 마포구 서교동 351-11 이혜빌딩 2, 3층 |
| 도메인 | betterlab.kr |
| 사업자등록번호 | 112-10-17614 |

---

## 컬러 시스템

### 기존 (KPFC - 블루 계열)
```css
--primary: #1E3A8A;      /* 딥 블루 */
--primary-light: #3B82F6;
--accent: #60A5FA;
```

### 신규 (더나은기업연구소 - 그린 계열)
```css
/* Primary - 다크 포레스트 그린 */
--primary: #124330;
--primary-light: #1A5C42;
--primary-dark: #0C2E21;
--primary-pale: #E8F0EC;

/* Secondary - 세이지 그린 */
--secondary: #6BA88D;
--secondary-light: #8FBFA8;
--secondary-dark: #4E8A6F;
--secondary-pale: #E5F2EB;

/* Accent - 페일 라임 그린 */
--accent: #DDEBC6;
--accent-light: #EAF4D9;
--accent-dark: #C5D9A8;

/* 그라데이션 */
--gradient-primary: linear-gradient(135deg, #124330 0%, #1A5C42 100%);
--gradient-hero: linear-gradient(135deg, #124330 0%, #0C2E21 100%);
--gradient-secondary: linear-gradient(135deg, #6BA88D 0%, #8FBFA8 100%);
```

---

## 작업 범위

### Phase 1: 공통 요소
- [ ] **1-1. CSS 변수 (css/main.css)** - 컬러 시스템 교체
- [ ] **1-2. 로고 파일** - kpfc-logo.png → betterlab-logo.png

### Phase 2: index.html
- [ ] **2-1. 헤더** - 로고, 브랜드명, 네비게이션
- [ ] **2-2. Hero 섹션** - 배경색, 그라데이션, 텍스트
- [ ] **2-3. 본문 섹션들** - 컬러 적용 확인
- [ ] **2-4. 입력폼** - 브랜드명, 연락처
- [ ] **2-5. 푸터** - 회사 정보, 연락처, 주소
- [ ] **2-6. SEO/메타태그** - title, description, OG태그, JSON-LD

### Phase 3: 서브 페이지
- [ ] **3-1. about.html** - 회사소개
- [ ] **3-2. process.html** - 진행절차
- [ ] **3-3. fund.html** - 정책자금
- [ ] **3-4. service.html** - 전문가서비스
- [ ] **3-5. marketing.html** - 온라인마케팅
- [ ] **3-6. post.html** - 게시글

### Phase 4: 관리자 페이지
- [ ] **4-1. admin/index.html** - 대시보드
- [ ] **4-2. admin 기타 페이지들**

### Phase 5: 기타
- [ ] **5-1. sitemap.xml** - 도메인 변경
- [ ] **5-2. robots.txt** - 도메인 변경
- [ ] **5-3. llms.txt** - 브랜드 정보

---

## 작업 진행 상태

| Phase | 항목 | 상태 | 비고 |
|-------|------|------|------|
| 1-1 | CSS 변수 | 대기 | |
| 1-2 | 로고 파일 | 대기 | AI 파일에서 PNG 추출 필요 |
| 2-1 | index.html 헤더 | 대기 | |
| ... | ... | ... | |

---

## 주의사항

1. **페이지별 작업**: 한 페이지 완료 후 다음 페이지 진행
2. **섹션별 확인**: 각 섹션 수정 후 시각적 확인 필요
3. **Git 커밋**: 주요 단계별 커밋
4. **로고 파일**: .ai 파일을 PNG로 변환 필요 (사용자 제공 대기)

---

*문서 생성: 2025-01-03*
