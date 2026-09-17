# 알려진 제약·검토 결과 (문제점 기록)

구현 전 확인이 필요하거나, 현 단계에서 의도적으로 보류한 것들. **작업 전 이 문서를 먼저 확인.**

## 1. 등기부 "3개월 주기 자동 열람" — 핵심 제약 🔴

**요청**: 등기를 3개월 주기로 자동으로 읽어와 달라진 점을 알려주는 메뉴.

**제약**:
- 대법원 인터넷등기소는 **공식 개방 API가 없다**. 열람은 건당 700원 유료 + 로그인/결제 필요.
- 자동화(스크래핑+결제 대행)는 약관·법적 검토 없이는 불가. 사업자 제휴(법무사/프롭테크 등기 API 대행업체) 경로가 현실적이나 비용·계약 필요.
- 참고: 대법원 "등기변경사실 통지(맞춤형)" 유사 서비스 존재 여부는 추가 확인 필요.

**연동 스캐폴드 구현됨 (2026-09-17)** — `zipsalpi-api/src/registry/` (틸코 경유):
- `POST /registry/search`(주소→고유번호), `POST /registry/issue`(열람→PDF 저장→서류 상태 갱신)
- 유료라 `Idempotency-Key` 헤더 강제 (중복 과금 방지), 미설정 시 501 + 부족한 env 목록 응답
- **활성화에 필요한 것 (사용자 준비)**:
  1. 틸코 가입 → [내정보 > API KEY] 발급 → `TILKO_API_KEY` (대시보드의 RSA 공개키가 아님!)
  2. 틸코 **포인트 충전** (tilko.net) — 발급 100p/건, 주소검색 20p/건
  3. **인터넷등기소(iros.go.kr) 계정** → `IROS_USER_ID`/`IROS_USER_PW`
  4. 등기소 [선불전자지급수단] 발급·충전 → `IROS_EMONEY_NO1/NO2/PWD` — 열람료 700원/건이 여기서 차감
- ⚠️ 요청 필드 구성은 틸코 문서 기준 작성 — **실키 투입 후 1건 실호출 검증 필요** (미검증 상태)

**실키 검증 결과 (2026-09-17, API 키 투입 후)**:
- ✅ API 키 유효 (GetPublicKey 200), RSA/AES 암호화 흐름 정상 (틸코가 요청을 해독·처리함)
- ✅ 주소검색 바디는 `Address`+`Page` 최소 구성이 검증 통과 (v2.0 경로)
- ✅✅ **등기부 실발급 엔드투엔드 검증 완료 (2026-09-17)** — 틸코 → 인터넷등기소 →
  실제 등기사항전부증명서 PDF(말소사항 포함) 수신 → Upstage 파싱(표제부 표 구조 보존)까지 확인.
  **확정 스펙 (RealtyRegistry v2.0)**:
  - 암호화(AES) 대상은 5개뿐: `Auth.UserId`, `Auth.UserPassword`, `EmoneyNo1`, `EmoneyNo2`, `EmoneyPwd`
  - **평문**: `Pin`(고유번호, '-' 제외 14자리 — 검색 응답의 pin 그대로), `AbsCls`(11=현재유효/12=말소포함),
    `CmortFlag`/`TradeSeqFlag`(Y/N), `RgsMttrSmry`(1/공백) — 암호화하면 "소재지번 확인 불가"
  - 전자민원캐시 분할: **앞 8자리(영문 포함) / 뒤 4자리** (6+6 아님)
  - 키 타입: **"일반용" = 포인트 종량제** (정액제 키는 9910025)
  - 주소검색(RetrieveSmplSrchList)은 전부 평문 (개인정보 없음)
  - ⚠️ **실패 응답도 로그인 통과 후에는 건당 100p 차감** — 재시도 남발 금지, 멱등키 필수
  - 디버깅 여정 비용: 틸코 ~1,480p + 등기소 700원 (성공 1건 포함)
- 등기소 선불전자지급수단 = **전자민원캐시**(갤럭시아머니트리)로 확인. 캐시 발급·1만원 충전 완료,
  유효기간 2031-09. 번호·계정은 `.env`에만 보관. **남은 것: 캐시 비밀번호(구매 시 설정한 것,
  사이트 로그인 비번 아님)를 `IROS_EMONEY_PWD`에 기입** — 전자민원캐시 사이트 [내 번호/잔액 조회]
  또는 구매 확인 메일에서 확인 가능. IROS 사이트에 별도 "결제수단 등록" 절차는 없다 —
  결제 시점에 캐시 번호+비밀번호를 내는 방식이라 등록을 못 찾는 게 정상.
- 미확정: 발급(RealtyRegistry)의 부동산 고유번호 필드(현재 Auth.Pin으로 매핑)와 AbsCls
  구분값 — 활성화 후 1건 실검증으로 확정.

**등기소 선불전자지급수단**: 인터넷등기소(iros.go.kr) 로그인 → 상단 [결제] 또는
[나의메뉴 > 선불전자지급수단] → 발급(본인발급) → 계좌이체/카드로 충전. 발급되면 번호 2조각과
비밀번호가 생기며 그대로 `IROS_EMONEY_NO1/NO2/PWD`에 넣으면 된다.
"타인발급 인증키"는 등기소가 공식 제공하는 **양도용 기능**(다른 사람이 내 선불수단으로 결제하게
인증키를 넘기는 것)이라 그 자체는 불법이 아니다 — 우리는 **본인(서비스 운영 계정) 발급**을 쓰면
되므로 필요 없음. 단, 서비스가 이용자 대신 자동 열람하는 것 자체는 등기소 약관 검토 대상(기존 기록 참고).

**대행 API 조사 결과 (2026-09-15)** — 실제 도입 시 후보:
- **CODEF (코드에프)**: [부동산등기부등본 열람/발급 API](https://developer.codef.io/products/public/each/ck/real-estate-register)
  — 인터넷등기소를 대신 접속해 열람 결과를 데이터/PDF로 반환. 프롭테크 표준 경로.
- **Tilko (틸코)**: [등기부등본 PDF 발급 API](https://tilko.net/Help/Api/POST-api-apiVersion-Iros-GetPdfFile)
  — 도입비 없음, 건당 결제(포인트 선충전).
- 공통 비용 구조: 등기소 열람 수수료 **건당 700원 그대로 발생** + 업체 API 이용료 건당 추가
  → 케이스당 분기 약 1천 원 안팎 변동비. 결제는 선불 포인트.
- 구현 스케치: @nestjs/schedule 크론(3개월) → 대행 API 조회(주소/부동산 고유번호) → PDF를 기존
  업로드·diff 파이프라인에 투입 → 변경 시 알림. 크론·diff는 이미 있으므로 **연동 지점은 API 호출부 하나**.
- 법원 [등기정보광장 Open API](https://data.iros.go.kr/rp/oa/openOapiIntro.do)는 등기 현황·통계용 — 등본 열람 불가.

**현재 구현 (가능한 것)**: `/registry-watch` 메뉴 — 마지막 확인일 + 3개월 = 다음 확인 예정일,
기한 도래 시 알림, **재업로드 시 이전 분석과 diff**. 자동 열람은 위 경로 확정 후.

## 2. BullMQ 검토 결과 — 지금은 불채택

**요청**: "bullmq worker 시키면 가능할라나".

**판단**: BullMQ는 **Redis가 필수**. 현재 스택(단일 인스턴스 + SQLite→Postgres 예정)에
Redis를 추가하는 건 3개월 주기 리마인더 하나를 위해 인프라를 하나 늘리는 것 — 오버엔지니어링.
- 지금 규모의 주기 작업(등기 재확인 리마인더, 기한 알림 스캔)은 **@nestjs/schedule 크론**으로 충분 (인프라 0).
- BullMQ가 맞아지는 시점: 다중 인스턴스 배포, 재시도·격리 보장이 필요한 대량 작업
  (OCR 파이프라인, 대량 임베딩)이 생길 때. 그때 Redis와 함께 도입.

## 3. Web Push (브라우저 닫혀도 오는 알림) — 후속

현재 알림은 **페이지가 열려 있는 동안** 서버 SSE(`/notifications/stream`)로 수신
(끊기면 자동 재접속, API 미기동 시 로컬 계산 폴백).
브라우저를 닫아도 오는 알림은 Web Push(VAPID 키 + Service Worker + 구독 저장) 필요 —
백엔드 `POST /push/subscribe` 자리는 있음. iOS Safari는 홈 화면 추가(PWA)에서만 동작하는 제약도 있음.

## 4. 중개보수 요율 — 지자체 편차

계산기는 2021.10 개정 **상한 요율표(서울 기준)** 사용. 상한 요율은 시·도 조례로 달라질 수
있어 UI에 "상한·협의·조례 편차" 고지 문구 포함. 정확한 지역별 요율은 추후 지역 선택 연동.

## 5. Vercel CLI 배포 (Windows)

`vercel deploy`가 Windows 심볼릭 링크 권한(EPERM)으로 로컬 빌드 실패 → **Vercel Git 연동**으로
배포 중 (main 푸시 = 자동 배포). CLI가 필요하면 Windows 개발자 모드 활성화 필요.

## 6. 프론트 케이스 동적화 — 백엔드는 준비됨, 프론트가 정적

백엔드에 케이스 CRUD(`POST/PATCH/DELETE /cases`)가 구현됐다 (생성 시 서류 상태·유형별 기본
할 일 자동 준비). 그러나 **프론트는 12개 파일에서 `D.CASES`(데모 3건)를 정적으로 참조**하고,
케이스 생성 화면도 "샘플로 이동" 데모 동작이다. 새 케이스를 실제로 쓰려면 프론트가
bootstrap의 `cases`를 상태로 들고 전 화면을 동적 참조로 바꿔야 한다 — 별도 작업 (판정
ANALYSIS·문서 본문이 없는 새 케이스의 빈 상태 UI 포함).

## 7. 멀티유저 데이터 스코핑 — ✅ 해결 (2026-09-17)

JWT sub 기준으로 전 데이터(케이스·서류·할일·상담·알림·job) 스코핑 완료 — AsyncLocalStorage
컨텍스트 + store 레벨 소유권 검증(남의 리소스는 404로 존재도 미노출). 토큰 없으면 데모
사용자(김민지) 폴백이라 심사 데모 흐름은 그대로. **알림 SSE는 `?token=` 쿼리 필요** —
프론트 NotificationHost 한 줄 수정 (api-spec §11). 남은 것: 프론트 빈 상태 UI(신규 가입자는
케이스 0개에서 시작 — #6 케이스 동적화와 함께).

## 8. 아직 목(mock)인 인증 부가 기능

- 아이디 찾기(`/auth/find-id`), 비밀번호 재설정(`/auth/password-reset/*`) — 고정 응답
- 소셜 로그인(카카오/구글) — 데모 토큰 발급. **사용자 결정(2026-09-17): 실 OAuth는 구현하지
  않는다 — 심사 단계에서는 데모 로그인(아무 이메일/비밀번호)으로 진행.** `AUTH_ENFORCE`도 꺼둔다.

## 9. Kafka / Redpanda 검토 결과 — 지금은 불채택 (2026-09-17)

**요청**: "실시간에 kafka나 Redpanda 쓰면 어떨까".

**판단**: 현재 실시간 요구(알림 푸시, 채팅 스트리밍)는 **SSE + 단일 인스턴스**로 이미 충족.
Kafka/Redpanda는 "여러 컨슈머가 같은 이벤트 스트림을 독립 소비"할 때 가치가 있는데,
지금은 프로듀서도 컨슈머도 하나뿐이라 브로커 운영(모니터링·파티션·오프셋 관리)만 늘어난다.
BullMQ 때와 같은 결론(#2) — 인프라 추가 없이 해결되는 규모.

**도입이 맞아지는 시점**: ① 다중 인스턴스에서 이벤트 팬아웃 필요(알림·웹훅·분석 적재 동시 소비)
② 대량 비동기 파이프라인(OCR·임베딩 스트림) ③ 이벤트 소싱/감사 로그. 그때는 자체 운영보다
관리형(AWS MSK, Redpanda Cloud) 권장. 중복 호출 문제는 브로커가 아니라 **멱등성으로 해결**했다
(`Idempotency-Key` — api-spec §11).

## 10. Prisma --force-reset 가드

Prisma 6가 AI 에이전트의 `db push --force-reset`을 차단함 → 테스트 DB는
파일 삭제 + `db push` 방식으로 우회(`test/setup-e2e.mjs`). `npm run db:reset`(dev.db)은
사용자가 직접 실행해야 함.

## 11. QA 감사 — 버튼↔API 연결 매트릭스 (2026-09-17)

**A. 정상 연결·검증됨**: bootstrap 하이드레이션 / 할일 토글·추가 / 서류 업로드(+S3)·job 폴링 /
AI 상담 SSE(+법령 출처 칩) / 세션 CRUD / 가입·로그인·코드 재전송 / 알림 SSE(?token=)·지우기 / 알림설정 PATCH

**B. 프론트 화면은 있는데 백엔드 미연결 (실데이터가 화면에 안 나옴)** — 심사 임팩트 순:
1. 🔴 **분석 화면 + 문서 뷰어가 로컬 D.ANALYSIS/DOCTEXT 사용** — `GET /cases/:id/analysis`(source:live
   실판정)와 `GET /cases/:id/documents/:docKey`(실 하이라이트)를 안 씀 → **백엔드가 만든 실판정·빨간
   하이라이트가 사용자에게 안 보인다**. 프론트 최우선 작업.
2. 필수 특약 화면: `GET /clauses` 미사용 (로컬)
3. 법 근거 모달: `GET /laws/:key/original`(실 조문) 미사용 — "법제처에서 확인" 문구만
4. 케이스 생성: `POST /cases` 미사용 (샘플 이동 데모) — #6과 동일
5. 회원 탈퇴: 확인문구 UI까지 있으나 `DELETE /me` 미호출 (로컬 데모)
6. 홈 판정 타일 counts: bootstrap의 cases.counts 대신 로컬 D 계산
7. 아이디/비번 찾기: API 미호출 (양쪽 다 목 — 의도된 데모라 낮음)

**C. 백엔드만 있고 프론트가 안 쓰는 API (기능 손실)**:
- 🔴 `GET /cases/:id/risk` (깡통 위험률 실계산) — 홈 타일로 노출 가치 최상
- `GET /market/rents·estimate`, `GET /gongsi/search`(HUG 한도), `GET /building/title`
- `POST /registry/search·issue` (등기부 자동발급 — registry-watch에 버튼 없음)
- `GET /demo/documents` (샘플 서류 받기 버튼 없음 — 심사 시연에 유용)
- 운영용이라 미연결이 정상: admin/errors·costs, reanalyze, laws-search, geo/resolve(서버 내부용), health

**D. 현재 의미 없는 것**:
- `POST /push/subscribe` — 자리만 (Web Push 후속 전까지 무의미)
- auth find-id / password-reset 3종 — 백엔드 목 응답 + 프론트 미호출 (심사엔 영향 없음)

## 12. 적대적 QA 2차 (2026-09-18) — 코드 전수 + 계약 대조

**🔴 실버그 (사용자 기대와 다르게 동작)**
1. MY 로그아웃이 토큰을 안 지움 (`me/page.js:316`) — 다음 요청에 이전 사용자 Bearer가 그대로 나감
2. 업로드 job 상태가 **벽시계 시뮬레이션** (`store.service getJob`) — 실분석 끝나기 전에 done → 프론트가 /analysis로 이동해 1회 fetch → 목 표시. 실판정 도착 시 재조회 없음
3. live 판정 항목에 `task/term/law/quote` 필드 없음 (`getAnalysis` live 매핑) → 실서류 분석 결과에서 "할 일에 추가"·용어·법령 행이 안 뜸
4. 액세스 토큰 30분 만료 → api.js가 토큰 지우고 **데모 사용자로 조용히 재시도** → 실가입자가 남의 데이터를 봄. refreshToken은 프론트가 버림(/auth/refresh 미사용). 알림 SSE는 만료 토큰으로 무한 재접속
5. risk `metricsAvailable=false`(등기부 미분석)일 때 선순위 0으로 "양호" 표시 — 근거 부족 표기 없음
6. 소셜 로그인·이메일 로그인 catch가 어떤 실패에도 `pass(null)` → 서버가 거절해도 로그인됨 (API-off 폴백 의도가 과함)
7. 뷰어: apiOn이고 live 아니고 DOCTEXT 없는 서류(c1 건축물대장 등) → "불러오는 중…" 무한
8. 챗 SSE `done.error` 프론트 미처리 (에러 시 빈 답변으로 종료)

**🟡 죽은/의미 없는 버튼 (프론트)**
- MY: 이름 「수정」·케이스 「보관」·「삭제」 = toast만 (`me/page.js:103,257,272`)
- 아이디 찾기 「찾기」: 입력 무시, 하드코딩 결과 / 비번 찾기 전체 플로우 로컬(두번째 입력 uncontrolled, 존재하지 않는 /reset-password 표기)
- 약관 동의: 체크값 어디에도 안 보냄 (`/auth/consent` 미호출)
- 케이스 생성: POST 응답 버리고 샘플로 이동 (#6)
- 이용약관/개인정보처리방침에 `[입력 필요]` 플레이스홀더 13곳 노출
- registry-watch 「켜짐」 배지 정적, 이사 체크리스트 체크 미영속, `NAV` 데드 데이터

**🟡 백엔드 스텁/미사용**
- 스텁: find-id·password-reset×2·push/subscribe·consent(검증만, 미영속)·social(데모 토큰)
- `/clauses`는 유형별 정적 (프론트 주석 "재판정 반영"은 거짓)
- 프론트가 안 쓰는 라우트 31개 — 내부용(risk가 estimate/gongsi/geo 사용, 자동발급이 registry 사용) 제외하면 진짜 고아: `/building/title`, `/market/rents`, `/laws/:key`, `/terms/:key`, `/auth/refresh`, `/cases/:id` GET/PATCH/DELETE, `/chat/sessions` GET, `/notifications` GET
- bootstrap `cases` 프론트가 버림 (#6 근본 원인), POST /cases에 id 없어 더블클릭=중복

**계약 정합**: 프론트가 부르는 경로는 전부 존재 ✓, SSE 이벤트명(meta/delta/refs/done, due) 일치 ✓, 법령 칩 렌더 ✓

## 13. QA #12 조치 결과 (2026-09-18)

**🔴 8건 전부 수정** — ①로그아웃 토큰 정리 ②job을 실파이프라인(파싱→판정)과 동기화, 텍스트 없으면 failed
③live 항목 task/law/term/quote 복원 ④refreshToken 저장·/auth/refresh 갱신, 실패 시 `auth:expired`로 로그아웃(데모 전환 금지),
알림 SSE 재연결 ⑤위험률 카드 "참고치"+등기부 미분석 경고 ⑥서버 거절 시 로그인 통과 금지(네트워크 미기동만 폴백)
⑦뷰어 무한 로딩 제거 ⑧챗 done.error 안내 렌더

**🟡 죽은 버튼 전부 실동작** — 이름 수정(prompt→PATCH /me), 케이스 보관/삭제(DELETE /cases/:id[?hard=1], store.cases 갱신),
아이디 찾기(실조회·마스킹), 비번 찾기(코드 메일→새 비번 저장), 약관 동의(POST /auth/consent 영속),
registry-watch 「켜짐」= 서류 최신본 알림 토글, 이사 체크리스트 localStorage 영속, `[입력 필요]` 13곳 → 실제 문구
(⚠️ 약관·개인정보처리방침 문구는 **법무 최종 검토 필요** — 사업자 정보는 비영리 시범 서비스로 기재)

**백엔드 스텁 → 실구현**: find-id·password-reset·consent. `/clauses`는 계약서 실판정 시 present/missing/weak 실값(source:live).
push/subscribe 스텁 제거. 고아 라우트 중 `/building/title`은 등기부 판정 교차검증에 내부 연결, `/auth/refresh`·`/cases/:id DELETE`는 프론트 연결.
잔여 고아(REST 완결성용, 무해): `/market/rents`, `/laws/:key`, `/terms/:key`, `/cases/:id` GET/PATCH, 세션 GET, `/notifications` GET

**남은 구조적 과제**: #6 프론트 케이스 동적화 (신규 케이스가 화면에 안 뜸 — bootstrap cases 중 데모 id만 렌더)
