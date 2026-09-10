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

## 다음 할 일

- [ ] 실데이터 오면: **골든셋 20~30개 먼저** → 법령 수집(조문 청킹) → Postgres+pgvector → 상담 출처 칩(RAG)
- [ ] ANTHROPIC_API_KEY / RESEND_API_KEY / S3 버킷 / EC2 secrets 투입
- [ ] Vercel env `NEXT_PUBLIC_API_URL` (백엔드 배포 후) — 백엔드 CORS에 vercel.app 이미 포함
- [ ] Web Push, 등기 자동 열람 경로 확정 (ISSUES #1·#3)

## 마지막 갱신

2026-09-11 — 홈 할 일 요약·SSE 알림·중개보수 계산기·이사 체크리스트·등기 모니터링 메뉴 추가
