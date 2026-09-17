# B4SIGN 프로젝트 메모리

프로젝트 결정·상태·미해결 사항 기록. **매 작업 세션마다 갱신한다.**
상세 문서: [docs/api-spec.md](docs/api-spec.md) · [docs/ai-stack.md](docs/ai-stack.md) · [docs/ISSUES.md](docs/ISSUES.md)

## 프로젝트

- **B4SIGN (비포사인)** — "4 checks before you sign." 부동산 계약(전세·월세·매매) 서류 위험 확인 앱
- 4 Checks: ①WHO 계약 상대 ②DEBT 선순위 권리 ③HOME 집 대조 ④CONTRACT 계약 내용
- 저장소: [b4sign-front](https://github.com/2026-ai-challenge/b4sign-front) (Next.js, Vercel Git 연동 배포 https://b4sign-front.vercel.app) · [b4sign-backend](https://github.com/2026-ai-challenge/b4sign-backend) (NestJS 12 ESM + Prisma, Docker+GHCR+EC2 Actions 준비)

## 확정된 결정

- LLM: **Anthropic Claude (claude-opus-5)** — 키만 넣으면 상담 실전환 (`llm.service.ts`)
- PDF 파이프라인: 구조 추출 = **Upstage Document Parse** / 챗·검토 = **Claude** (3단계: 텍스트 레이어 → Parse → Claude 네이티브 PDF 폴백)
- AI 스택: voyage-4 임베딩(실측 후 확정) · pgvector · SDK 직접(LangChain 불채택) · Neo4j 불채택
- DB: Prisma — dev SQLite, 배포 시 Postgres(스키마 호환 작성됨). 목 데이터는 `prisma/seed.mjs`에만 격리
- 날짜는 **항상 KST(UTC+9)** 기준 (`kstTodayStr`/`kstToday`)
- 알림: 페이지 열림 동안 **SSE**(`/notifications/stream`, D-1·D-day·D+7 지남), Web Push는 후속
- BullMQ **불채택**(Redis 불필요 규모 — @nestjs/schedule로 충분), 등기 자동 열람은 **API 부재로 보류** → ISSUES #1·#2

## 화면 (전부 구현)

랜딩(4 Checks·스크롤 리빌·가이드 목업) / 인증(실 이메일 코드) / 케이스 생성(카카오 주소검색·KST 달력) /
홈(단계 바=완료율, 현 단계 할 일 요약, 전체 완료 축하 카드, 중개보수 계산기, 이사 체크리스트 진입) /
서류(파일선택·카메라, 실패 3종, 등기 모니터링 진입) / 뷰어 / 분석(판정 필터·법 근거 카드) /
할 일(단계 기한·권장 dueRule·바로가기 링크·완료 애니메이션) / 필수 특약 / AI 상담(세션 CRUD 드로어·대기 인디케이터) /
내 정보 / 이사 체크리스트(/moving) / 등기 모니터링(/registry-watch)

## 기본 할 일 (2026-09 최신 제도 반영)

전세 13·월세 12·매매 11 — 임대차 신고 30일(2025.6.1 과태료), 임대인 미납 국세·지방세 확인,
보증보험 신청(계약기간 ½ 전), 자금조달계획서, 확정일자 "전입 당일 즉시"로 정정 등

## 백엔드 (2026-09-17 완성 점검)

- 프론트가 호출하는 API는 **전부 연결 확인** (bootstrap·tasks·documents·jobs·chat SSE·auth·notifications SSE)
- 케이스 CRUD 완비: `POST/PATCH/DELETE /cases` (생성 시 서류 상태 + 유형별 기본 할 일 자동, 할 일 id는 `caseId.기본id`)
- 인증 실구현: 가입 = 이메일 코드 + **scrypt 해시** 저장(의존성 0), 가입된 사용자는 **항상 실제 비밀번호 검증**(오답 401),
  미가입은 `AUTH_ENFORCE=true`면 401 / 아니면 데모 규칙 유지. 탈퇴 = 실제 cascade 삭제. 재가입 409 EMAIL_TAKEN
- `GET /health` (DB ping 포함) — ALB·모니터링용. e2e 35개
- **AWS 배포 가이드: `zipsalpi-api/docs/DEPLOY.md`** — EC2+Docker+Caddy(HTTPS 필수!), GitHub secrets, 시드, RDS 전환 절차
- 미구현(의도): 멀티유저 스코핑(ISSUES #7), 프론트 케이스 동적화(#6), 아이디찾기·비번재설정·소셜 OAuth 목(#8)

## 백엔드 (2026-09-17 2차 — 멱등성·오류로그·틸코·데모서류)

- **멱등성**: `Idempotency-Key` 헤더 → 저장 응답 재생 / 처리중 409 / 실패 키 삭제 (api-spec §11). 케이스·할일·세션 생성은 클라이언트 id로 자연 멱등
- **오류 로그 영속**: 5xx가 ErrorLog 테이블에 저장 → `GET /admin/errors` (ADMIN_KEY로 보호 가능)
- **틸코 등기부 발급 스캐폴드**: `/registry/search`·`/registry/issue` (유료 — Idempotency-Key 강제).
  필요 env 6개(TILKO_API_KEY + IROS 계정·선불수단), 미설정 시 501+목록. **실키 검증 미완** (ISSUES #1)
- **데모 서류 8종**: `GET /demo/documents` → 샘플 PDF (등기부·전세/월세/매매 계약서·위반건축물대장·전입세대·토지대장·등기완료). `scripts/gen-demo-docs.mjs`로 생성, fixtures/demo-docs 커밋됨
- **결정**: 소셜 OAuth 구현 안 함(심사=데모 로그인, AUTH_ENFORCE 끔) / Kafka·Redpanda 불채택(ISSUES #9) / e2e 40개
- Anthropic API 키 **아직 미수령** (.env에 없음 — 받으면 ANTHROPIC_API_KEY로 투입)

## 다음 할 일

- [ ] **AWS 배포 (사용자)**: EC2 생성 → `docs/DEPLOY.md` 1~7 순서대로 (도메인+HTTPS 필수, GitHub secrets 3개)
- [ ] 실데이터 오면: **골든셋 20~30개 먼저** → 법령 수집(조문 청킹) → Postgres+pgvector → 상담 출처 칩(RAG)
- [ ] ANTHROPIC_API_KEY / RESEND_API_KEY / S3 버킷 투입 (b4sign.env)
- [ ] Vercel env `NEXT_PUBLIC_API_URL` (백엔드 배포 후) — 백엔드 CORS에 vercel.app 이미 포함
- [ ] Web Push, 등기 자동 열람 경로 확정 (ISSUES #1·#3, 대행 API: CODEF/Tilko 조사됨)

## 백엔드 (2026-09-17 3차 — 키 투입·라이브 검증)

- **Claude 상담 실전환 확인**: 실키로 SSE 스트리밍 라이브 테스트 통과 (케이스 컨텍스트 인용·시세 거절 가드레일 동작). 키는 `.env`에만 (메모리·저장소에 기록 금지 — 사용자 지시)
- **Voyage 키 수령** → `.env` (RAG 시 사용 예정)
- **틸코 실검증**: 키 유효·암호화 흐름 통과, 주소검색 최소바디(Address+Page, v2.0) 확정.
  막힌 곳 = 계정의 **API 사용 신청/정액제 미활성(9910025)** → 대시보드 신청 필요 (ISSUES #1)
- **Swagger**: `/api/docs` (JSON `/api/docs-json`) — 404 핸들러보다 먼저 등록
- e2e는 실키 무시(빈 값 강제)로 결정적·무과금 유지. 40/40
- Redis 불필요 결정: 중복 방지는 DB 기반 Idempotency-Key로 이미 해결 (단일 인스턴스)
- Upstage(Document Parse) 키 아직 없음 — 실검증 대기. 업로드→분석은 아직 시뮬레이션(실추출 미구현)

## 백엔드 (2026-09-17 4차 — PDF 실파이프라인 가동)

- **Upstage Document Parse 실검증·연동 완료**: 업로드(PDF/사진) → 스토리지 저장 → **자동 파싱 →
  DocumentState.parsedText 저장** → `GET /cases/:id/documents/:docKey`의 `parsed {at, chars, preview}`로 확인.
  엔드포인트 `api.upstage.ai/v1/document-digitization` (model=document-parse), 데모 등기부로 E2E 실동작 확인
- parsedText가 룰엔진·RAG 입력 — 다음 단계: 파싱 텍스트 → Claude 판정 → ANALYSIS 실데이터화(빨간 하이라이트 실구동)
- **틸코 등기부 실발급 E2E 완료 (2026-09-17)**: 검색→발급→실제 등기부 PDF(말소포함) 수신→Upstage 파싱까지 전부 실검증.
  확정 스펙(암호화 5필드만, Pin·플래그 평문, 캐시 8+4 분할, AbsCls 11/12)은 **ISSUES #1** 참고.
  ⚠️ 발급 실패도 100p 차감 — 재시도 주의. IROS 계정·캐시 정보는 .env에만
- e2e 40/40 (실키는 테스트에서 빈 값 강제 — Upstage 포함)

## 백엔드 (2026-09-17 6차 — 실판정 파이프라인 가동 🎉)

- **실분석 완성**: 업로드/자동발급 → Upstage 파싱 → **Claude 등기부 판정**(AnalysisItem 저장) →
  `/analysis`가 실판정 서빙(`source:"live"`), 뷰어 `/documents/registry`가 **실제 원문+빨간 하이라이트(mark)** 생성.
  실물 검증: 성산동 80-2 등기부 → 8개 판정(근저당 4.4억 danger·깡통 위험·명의변동 warn 등)·하이라이트 9줄
- **판정 멱등**: parsedText sha256(analyzedHash) 동일하면 Claude 재판정 안 함 (재과금 방지)
- **비용 원장**: CostLog(tilko/upstage/anthropic) + `GET /admin/costs` (호출수·units 합계)
- 실판정 없는 케이스는 기존 데모 콘텐츠 폴백 — 목 삭제해도 실경로만 남음
- ⚠️ Nest 함정: 컨트롤러 주입 프로퍼티명이 라우트 메서드명과 겹치면(analysis) 핸들러가 덮여 500
- e2e 41/41

## 데이터 확보 (2026-09-17)

- **실거래가 8종** (아파트·빌라·단독·오피스텔 × 매매·전월세) ✅ 승인·실호출 검증 (DATA_GO_KR_KEY)
- **건축HUB 건축물대장** ✅ 승인·검증 (성산동 80-2 표제부 = 등기부와 교차검증 성공)
- **법령 OC** ✅ 승인·실검증 (주임법 3조의2·민법 615조 원문 실수신) / **V-World 키** ✅ (주소→lawdCd 자동 변환)
- **공시가격** ✅ API 대신 **파일데이터(3.4GB, 2025 호별)**로 해결 — 마포·은평 253,730호 DB 적재
  (`scripts/import-gongsi.mjs`, 원본 zip: 사용자 다운로드 폴더. 다른 지역 필요 시 grep 추출→적재. CSV는 git 제외)
- **Resend** ✅ 실발송 전환 (인증 메일 실측 수신). 단 도메인 미인증 상태라 **본인 계정 이메일로만 발송 가능** — 타인에게 보내려면 resend.com 도메인 인증 필요

## 백엔드 (2026-09-17 7차 — 시세·깡통 위험률 실계산)

- **MolitService**: 실거래 전월세/매매 조회(월별 6h 캐시), 시세 추정(중위가·㎡단가·유사면적 ±25%), 건축물대장 표제부
- **GET /cases/:id/risk**: (보증금 + Claude 추출 선순위 채권최고액) ÷ 실거래 시세 → ratio%·grade(90↑danger/70↑warn)
- 실측: c1(성산동 80-2) = 2억+4.4억 vs 마포 단독 29건 시세 13.98억 → **46% safe**
- analyzeRegistry에 **metrics**(seniorLienTotal·coOwnership·hasSeizure·ownerName) 추가 → Case.metricsJson
- POST /cases/:id/reanalyze (저장된 파싱 텍스트 재판정 — Upstage 비용 없음)
- Case에 lawdCd/bjdongCd/bun/ji 컬럼 — **프론트: 카카오 주소검색 bcode 앞 5자리를 lawdCd로 저장** (api-spec §11)
- e2e 43/43

## 백엔드 (2026-09-17 8차 — 법령 원문·주소 변환)

- **LawService**: 국가법령정보센터 실시간 조문 조회 — `GET /laws/:key/original` (KEY_MAP: jl3~build79 11종, MST·본문 24h 캐시)
- **GET /geo/resolve**: V-World 주소→lawdCd·좌표. POST /cases가 lawdCd 없으면 자동 보완
- e2e 44/44

## 백엔드 (2026-09-17 9차 — 공시가격·메일 실발송)

- GongsiPrice 테이블(25.4만호) + `GET /gongsi/search` (호별 공시가 + HUG 한도 126%)
- risk 시세 폴백: 실거래 없으면 주소 매칭 공시가 × 140% (`valueSource: gongsi`)
- .env 완비: 13키 + JWT_SECRET·ADMIN_KEY 생성 + RESEND — **EC2 갈 때 이 파일 = b4sign.env**
- e2e 45/45 (실키 전부 테스트 격리)

## 백엔드 (2026-09-17 10차 — 계약서 판정 + 상담 출처 칩)

- **계약서 실판정**: 필수 특약(CLAUSES 기준)·불리 조항 + **등기부 교차검증**(임대인↔소유자·주소·면적).
  실측: 데모 계약서 vs 실등기부 → "임대인·소유자 불일치 danger, 주소·면적 불일치 danger" 정확 검출, 통합 16항목
- **상담 법령 출처 칩**: Claude가 근거 법령을 `<refs>` 마커로 출력 → 서버가 스트림에서 숨기고
  SSE `refs` 이벤트·DB 저장 (실측: jl3·jl3_2·jl8). 상담 컨텍스트도 실판정 우선
- reanalyze에 docKey(contract) 지원, Dockerfile에 scripts/ 포함(공시가 적재), DEPLOY.md에 공시가 적재 절차
- e2e 45/45

## 백엔드 (2026-09-17 11차 — 챗이 DB를 안다)

- **챗 컨텍스트 = DB 스냅샷**: `store.chatContext()` — 실판정+지표(선순위 금액·소유자·압류)+
  서류 제출 현황+할 일 진행+**등기부 원문 발췌(6천자)**+**깡통 위험률 실계산 라인**(시세 캐시)
- 실측: "근저당 총액? 을구 9번?" → 원문에서 접수번호·은행·공동담보까지 읽어 답변, 시세 대비 44% 계산,
  말소 근저당 제외 논리까지. 출처 칩 jl3_2
- e2e 45/45

## 배포 (2026-09-17 — EC2 가동 🚀)

- **EC2**: 서울 리전, Ubuntu 26.04, t3.small, 탄력적 IP **43.201.119.217** (인스턴스명 B4Sign)
- 보안그룹: 22(전체 — GitHub Actions 배포용)/80/443. **4000은 외부 비공개** (Caddy가 프록시 예정)
- GHCR 패키지는 조직 정책상 공개 불가 → EC2에 **read:packages PAT로 docker login** 저장됨 (자동배포 동작)
- 배포 완료 상태: 컨테이너 b4sign 가동, health ok, **시드 + 공시가 253,730건 적재 완료**, bootstrap·gongsi 검증
- env: EC2 `~/b4sign.env` (로컬 `zipsalpi-api/deploy/b4sign.env` 사본, git 제외)
- 이후 main 푸시 = 자동 배포 (secrets EC2_HOST/USER/SSH_KEY 설정됨)
- **S3 연결 완료(2026-09-17)**: 버킷 b4sign-uploads-dlckdgh(서울, 비공개) — EC2 env STORAGE_DRIVER=s3, 실업로드 검증(s3 put 로그). 키는 EC2 env에만·심사 후 로테이션 권장
- **HTTPS 가동**: Caddy + Let's Encrypt, 공개 API = **`https://43-201-119-217.sslip.io/api/v1`**
  (Swagger: `/api/docs`). sslip.io는 IP 매핑 무료 도메인 — 실도메인 사면 Caddyfile 한 줄 교체
- CORS: vercel.app + localhost:3000 허용됨 (팀원 로컬 개발 가능)
- Vercel env: `NEXT_PUBLIC_API_URL=https://43-201-119-217.sslip.io/api/v1` 넣고 Redeploy

## 백엔드 (2026-09-17 12차 — Postgres+RAG, EC2 이전 완료)

- **Postgres(pgvector) 전환**: 로컬 `b4pg` 컨테이너(pw b4sign-local) / EC2 `b4pg`(b4net 네트워크, pw는 EC2 env에만).
  RDS 불채택 — 컨테이너로 비용 0. e2e는 b4sign_test DB(스키마 드롭 리셋), CI에 pgvector 서비스
- **법령 RAG 가동**: 17개 법령 708조문 (전세사기특별법·민사집행법·조세우선 등 포함) voyage-4 임베딩 → 상담에 top-5 조문 주입 (항 단위 인용 실측).
  `POST /admin/laws/ingest`(멱등) · `GET /laws-search`. LangChain/LangGraph 불채택 유지
- **EC2 = PG+RAG 최신**: 시드·공시가 25만·법령 258 전부 라이브 검증. 단 이번 배포는 CI 실패로
  **로컬 빌드 이미지를 수동 전송**(docker save/scp/load, 이미지명 b4sign-local:latest)
- ⚠️ **미해결 2건**: ① CI가 8245ee3에서 실패 — Actions 로그 확인 필요 (사용자에게 요청함)
  ② law.go.kr가 **호출 서버 IP 검증** — open.law.go.kr 신청 수정에서 43.201.119.217 추가 필요
  (전까지 EC2에서 재인제스트 불가 — 로컬 인제스트 후 pg_dump로 복사하는 우회 사용)
- 이전 SQLite 데이터(EC2 볼륨 b4sign-data의 prod.db)는 백업으로 잔존

## 마지막 갱신

2026-09-17 — 11차 + **EC2 배포 완료**. 남은 것: 도메인/HTTPS → Vercel 연결

## 백엔드 (2026-09-17 13차 — 사용자 스코핑)

- **JWT sub 기준 전 데이터 분리** (ISSUES #7 해결): UserContextMiddleware(ALS) + store 소유권 검증.
  남의 리소스 404, 신규 가입자는 빈 상태·알림 0건, 무토큰=데모(김민지) 폴백 (심사 데모 유지)
- **알림 SSE는 `?token=` 쿼리** — 프론트 NotificationHost 한 줄 수정 필요 (api-spec §11)
- 라이브 검증 4종 통과. e2e 49/49. EC2는 수동 배포본(스코핑 포함) — CI 런(ac87e68) 상태 확인 대기

## 2026-09-17 — "데모 변경이 유지 안 됨" 원인 2건

1. **Vercel 프론트에 NEXT_PUBLIC_API_URL 미설정 (주원인)** — 배포 프론트가 로컬 목 모드로 동작
   → 저장 안 되고 알림 재계산. **해결 = Vercel env 추가 + Redeploy (사용자 액션 대기)**
2. **알림 dismiss 미영속** → `POST /notifications/dismiss` 구현 (같은 할일+기한 재알림 방지,
   NotificationDismiss 테이블). 프론트 NotificationHost 수정 2가지(api-spec §11): X클릭 시 dismiss 호출, ?token= 부착.
   e2e 50/50, EC2 수동 배포 반영

## 2026-09-17 — B 전건 연결 + 자동 등기부 파이프라인 (14차)

- 프론트 B 6건 연결(분석·뷰어 live, 특약, 법령원문 보기, 탈퇴, counts, POST /cases) + 대시보드 깡통위험률 카드 + 샘플서류 받기
- 백엔드: 계약서 분석 후 **자동 등기부 발급 파이프라인** (주소 1건 매칭 시만, AUTO_REGISTRY=off 가능),
  risk lawdCd 자동해석, 데모계정(dlminji) 탈퇴 보호
- 라이브 검증: 계약서 업로드→파싱→실판정 8건→자동발급 시도(가상주소 '성산로 12'라 검색 0건 → 안전 스킵 확인)
- law.go.kr에 EC2 IP 등록됨(사용자) — EC2에서 법령 원문 조회 가능해짐

## 2026-09-18 — 케이스 동적화 (15차, ISSUES #6 해결)

- `store.cases` = bootstrap cases 전체(비데모 id 포함), `currentCase`/`addCase`/`removeCase`, 전 화면 `D.CASES.find` 제거 → `currentCase` + `NoCase` 빈 상태
- `cases/new`가 실제 POST /cases 후 /documents 이동. caseId 초깃값 "c1" + useEffect로 localStorage 복원(하이드레이션 안전)
- 미해결: 전 페이지(/login 포함) 하이드레이션 경고 React #418 — 이번 변경 이전부터 존재, 원인 미확인
- 다음: 데모 데이터 비우기(사용자 제안) — 동적화로 가능해짐
