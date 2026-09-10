# 집살피 API 명세 v0.1

백엔드 연동 기준 문서. 프론트(`src/`)는 현재 `src/data/zipsalpi.js`의 목 데이터로 동작하며,
이 명세의 응답 형태는 그 데이터 구조와 1:1로 맞춰져 있다 (필드명 동일).

- Base URL: `/api/v1`
- 인증: `Authorization: Bearer <JWT>` (액세스 30분 + 리프레시 14일 권장)
- 모든 날짜는 `YYYY-MM-DD`, 시각은 ISO 8601
- 판정 상태 enum `st`: `danger`(위험) | `warn`(주의) | `safe`(안전) | `unknown`(확인 불가)
- 케이스 유형 enum `type`: `jeonse` | `wolse` | `maemae`
- 서류 키 enum `docKey`: `registry` | `contract` | `building` | `fixdate` | `land` | `regdone`

## 공통 에러 형식

```json
{ "error": { "code": "CASE_NOT_FOUND", "message": "케이스를 찾을 수 없어요." } }
```

| HTTP | 대표 코드 |
|---|---|
| 400 | `VALIDATION_FAILED` |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED` |
| 403 | `FORBIDDEN` |
| 404 | `CASE_NOT_FOUND`, `DOCUMENT_NOT_FOUND` |
| 409 | `EMAIL_EXISTS`, `SOCIAL_ACCOUNT` (이메일 로그인 시도했지만 소셜 가입 계정) |
| 422 | `ANALYSIS_FAILED` (`reason`: `scan` \| `unsupported` \| `extract`) |
| 429 | `LOGIN_LOCKED` (5회 실패, 15분 잠금 — `retryAfter` 초 포함) |

---

## 0. 부트스트랩 (프론트 편의)

`GET /bootstrap` → 프론트 초기 로딩 1회 호출:

```json
{ "me": {...}, "cases": [...], "docs": { "c1": {...} }, "tasks": { "c1": [...] },
  "chat": { "sessions": { "c1": [...] }, "active": { "c1": "c1-s1" } } }
```

## 1. 인증 (Auth)

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/auth/signup` | `{ email, password, name? }` → 6자리 코드 발급(DB, 10분 유효) + 메일 발송. 메일은 MailerService — `RESEND_API_KEY` 설정 시 Resend 실발송, 미설정(dev) 시 콘솔 발송 + 응답에 `devCode` 포함 |
| POST | `/auth/signup/verify` | `{ email, code }` → 검증 후 `{ accessToken, refreshToken }`. 오류: 400 `CODE_INVALID`, 410 `CODE_EXPIRED` |
| POST | `/auth/signup/resend` | `{ email }` 재전송. 60초 내 재요청 시 429 `RESEND_TOO_SOON` |
| POST | `/auth/login` | `{ email, password }` → 토큰. 소셜 가입 계정이면 409 `SOCIAL_ACCOUNT` + `provider` |
| POST | `/auth/social/{provider}` | provider: `kakao` \| `google`. `{ authCode }` → 토큰 (신규면 계정 생성) |
| POST | `/auth/refresh` | `{ refreshToken }` → 새 토큰 |
| POST | `/auth/find-id` | `{ name, emailPrefix }` → `{ maskedEmail, provider }` (예: `dl***@gmail.com`, `kakao`) |
| POST | `/auth/password-reset/request` | `{ email }` → 재설정 링크 메일 (30분 유효) |
| POST | `/auth/password-reset/confirm` | `{ token, newPassword }`. 만료 시 410 `TOKEN_EXPIRED` |
| POST | `/auth/consent` | `{ tos, privacy, age, notify, marketing }` — 필수 3종 true 필요 |

## 2. 내 정보 (Me)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/me` | `{ id, name, email, provider, notif: { master, due, stale, done } }` |
| PATCH | `/me` | `{ name? , notif? }` 부분 수정 |
| DELETE | `/me` | 회원 탈퇴. body `{ confirmText: "탈퇴합니다" }` 필수 |

> 프론트 참고: AI 상담 첫 인사말("안녕하세요, {name}님")은 **프론트에서 렌더링**한다.
> 별도 greeting API 없음. `GET /me`의 `name`을 사용한다.

## 3. 케이스 (Cases)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/cases` | 내 케이스 목록 |
| POST | `/cases` | 생성 (아래 body) |
| GET | `/cases/{caseId}` | 단건 |
| PATCH | `/cases/{caseId}` | 날짜·금액 등 수정 |
| POST | `/cases/{caseId}/archive` | 보관 |
| DELETE | `/cases/{caseId}` | 삭제 (서류·분석·할 일 연쇄 삭제) |

POST body / 응답 공통 형태:

```json
{
  "id": "c1",
  "type": "jeonse",
  "addr": "경기 성남시 분당구 판교역로 166 (카카오 판교 아지트)",
  "addrDetail": "301동 1204호",
  "housing": "아파트",
  "amount": "보증금 2억",
  "contractDate": "2026-09-14",
  "balanceDate": "2026-10-05",
  "midDate": null,
  "phase": 0,
  "overall": "danger",
  "counts": { "danger": 2, "warn": 3, "safe": 2, "unknown": 2 }
}
```

- `phase` 인덱스는 유형별 단계 배열 기준 (전세 4단계, 월세 4단계, 매매 5단계)
- 주소는 프론트에서 카카오 우편번호 서비스로 검색해 도로명 주소 문자열로 전송

## 4. 서류 (Documents)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/cases/{caseId}/documents` | 서류 목록 + 상태 |
| POST | `/cases/{caseId}/documents` | 업로드. multipart `file` + `docKey` → 202 `{ jobId }`. 허용 타입: **PDF, JPG, PNG, WebP, HEIC/HEIF** (모바일 촬영 사진 포함) ≤20MB. 타입 위반 시 400 `UNSUPPORTED_FILE_TYPE`. 파일은 StorageService(dev: 로컬 `uploads/`, `STORAGE_DRIVER=s3` 시 S3)에 저장 |
| GET | `/jobs/{jobId}` | 분석 작업 폴링 → `{ status: "uploading"\|"analyzing"\|"done"\|"failed", progress, eta, reason? }` |
| GET | `/documents/{documentId}` | 메타 + 추출 본문(lines) |
| DELETE | `/cases/{caseId}/documents` | 케이스 서류 전부 삭제 (분석 결과는 유지) |

서류 상태: `ok`(업로드됨) | `missing`(미업로드) | `stale`(발급 30일 경과).
업로드 시 서버는 주민번호 뒷자리 마스킹 후 저장, 원본 미보관.

분석 실패: job이 `{ "status": "failed", "reason": "scan" | "unsupported" | "extract" }`를 반환
(스캔 품질 / 미지원 서류 / 텍스트 추출 불가 — 실 파이프라인의 Document Parse·텍스트 추출
단계가 같은 코드를 낸다). 개발 편의: 업로드 body에 `demoFail: <reason>`을 넣으면 해당 실패를
재현한다 (프론트는 `/documents?upload=<docKey>&fail=<reason>`).

문서 본문 라인 형태 (뷰어 하이라이트용, `DOCTEXT`와 동일):

```json
{ "lines": [
  { "kind": "heading", "text": "【을구】 (소유권 이외의 권리에 관한 사항)" },
  { "kind": "plain",   "text": "1 근저당권설정 ..." },
  { "kind": "mark",    "pre": "3 근저당권설정 2024년 1월 15일 ", "mark": "채권최고액 금 120,000,000원 ...", "post": "", "itemId": 3 }
] }
```

## 5. 분석 결과 (Analysis)

`GET /cases/{caseId}/analysis` → 프론트 `ANALYSIS[caseId]` + 섹션 메타와 동일:

```json
{
  "overall": "danger",
  "summary": "근저당이 보증금 대비 과다하고, 계약서에 필수 특약 2개가 빠져 있어요.",
  "counts": { "danger": 2, "warn": 3, "safe": 2, "unknown": 2 },
  "analyzedAt": "2026-09-10T09:12:00+09:00",
  "diff": { "added": [{ "itemId": 8, "title": "면적 불일치 ..." }], "resolved": [{ "title": "임대인 주민번호 마스킹 누락" }] },
  "sections": [
    {
      "key": "lien", "title": "담보·권리", "source": "등기부 을구 · 등기 항목 검증",
      "items": [
        {
          "id": 3, "st": "danger", "deadline": false,
          "title": "선순위 근저당 1억 2,000만 원",
          "evidence": "등기부 을구 3번 · ○○은행 채권최고액",
          "compare": "보증금 2억 · 시세 3.1억 → 103%",
          "reason": null,
          "why": "경매가 나면 은행이 먼저 1.2억을 받아요. ...",
          "term": "kkangtong", "whyTail": " 상태예요. ...",
          "howTo": null, "law": null,
          "doc": "registry",
          "task": { "title": "근저당 감액·말소 특약 요구", "where": "...", "items": "...", "due": "2026-09-14" }
        }
      ]
    }
  ]
}
```

- 기한 항목(매매): `"deadline": true`, `st` 없음, `due` 필수 — 판정이 아닌 D-day 카드
- `st` 쿼리 파라미터로 필터 가능: `GET /cases/{id}/analysis?st=danger`

## 6. 할 일 (Tasks)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/cases/{caseId}/tasks` | 목록 |
| POST | `/cases/{caseId}/tasks` | 추가 (분석 항목·AI 상담에서 생성) |
| PATCH | `/tasks/{taskId}` | `{ done?, remind? }` |
| DELETE | `/tasks/{taskId}` | 삭제 (auto 항목만) |

```json
{
  "id": "a3", "phase": 0, "source": "auto",
  "title": "근저당 감액·말소 특약 요구",
  "why": "...", "where": "부동산 (계약 자리)", "items": "필수 특약 문구, 등기부등본 최신본",
  "due": "2026-09-14", "doc": "registry", "done": false, "remind": true
}
```

`source`: `default`(유형별 기본 항목, 케이스 생성 시 서버가 시드) | `auto`(분석·상담에서 생성).
위험 판정 첫 항목은 분석 완료 시 서버가 자동으로 할 일에 등록한다.

기한 없는 준비성 할 일은 `dueRule`로 **권장 기한**을 내려줄 수 있다 — 케이스 날짜 기준 상대 규칙:

```json
{ "dueRule": { "base": "contract", "offset": -3, "label": "계약 3일 전까지" } }
```

`base`: `contract` | `balance` | `mid`. 프론트가 케이스 날짜에 offset을 더해
"권장 D-n · MM/DD까지"로 표시한다 (명시 `due`가 있으면 그것이 우선).

## 7. 필수 특약 (Clauses)

`GET /cases/{caseId}/clauses` → 유형별 필수 특약 + 계약서 대조 판정:

```json
{ "clauses": [
  { "id": "j1", "title": "근저당 말소·감액", "st": "missing",
    "why": "...", "note": null,
    "example": "임대인은 잔금일까지 ...",
    "request": "특약에 \"...\" 문구를 넣어주실 수 있을까요?" }
] }
```

`st`: `present`(있음) | `missing`(없음) | `weak`(불충분). 계약서 재업로드 시 재판정.

## 8. AI 상담 (Chat)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/cases/{caseId}/chat/sessions` | 세션 목록 `{ id, title, messageCount }` |
| POST | `/cases/{caseId}/chat/sessions` | 새 세션 → `{ id }`. body `{ id? }` — 프론트 낙관적 생성과 정합을 위해 클라이언트 id 허용(멱등) |
| PATCH | `/cases/{caseId}/chat/sessions/{sessionId}` | 세션 이름 변경. `{ title }` (최대 40자) |
| DELETE | `/cases/{caseId}/chat/sessions/{sessionId}` | 세션 삭제 (메시지 cascade). 활성 세션이었다면 최신 세션으로 자동 교체 |
| GET | `/chat/sessions/{sessionId}/messages` | 메시지 목록 |
| POST | `/chat/sessions/{sessionId}/messages` | 질문 전송 → **SSE 스트리밍** 응답 |

### 스트리밍 (SSE)

`POST .../messages` body `{ "text": "이 특약이 나한테 불리해?" }`
→ `Content-Type: text/event-stream`

```
event: meta
data: { "messageId": "m42", "refused": false }

event: delta
data: { "text": "계약서 제7조 " }

event: delta
data: { "text": "\"원상복구하여 반환\"은..." }

event: refs
data: { "sources": ["계약서 제7조", "필수 특약 6번"], "laws": ["civil615"] }

event: done
data: { "canAdd": true, "taskTitle": "원상복구 범위 특약 추가 요청 (AI 상담)" }
```

- 범위 밖 질문(시세·소송 등): `meta.refused = true`, 거절 문구 delta로 스트리밍,
  `refs`/`canAdd` 없음. 첫 세션 제목은 첫 질문 앞 18자로 서버가 설정.
- 스트리밍 중 재전송 불가(프론트 입력 잠금), 연결 끊기면 프론트가 "다시 시도" 노출.
- 답변 컨텍스트: 해당 케이스의 업로드 서류 + 분석 결과 (범위 칩에 서류명 노출).

### 첫 인사말 (greeting)

**API 없음 — 프론트 렌더링.** 빈 세션(메시지 0개)일 때 프론트가
"안녕하세요, {me.name}님 👋 ..." 인사 말풍선과 추천 질문 칩(`SUGGEST[type]`)을 보여준다.
서버는 greeting을 메시지로 저장하지 않는다 (`messageCount`에 미포함).

## 9. 법령·용어 사전 (정적)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/laws/{key}` | `{ title, text(요약), note }` — key 예: `jl8`, `civil615`, `build79` |
| GET | `/terms/{key}` | `{ word, def }` — key 예: `kkangtong`, `daehang`, `soaek` |

버전 관리: 법령 개정 시 `note`에 개정일 표기. 프론트는 번들에 캐시해도 무방.

## 10. 알림 (Notifications)

- 채널: 이메일, 브라우저 푸시 (Web Push)
- 종류: `due`(할 일 기한 하루 전), `stale`(서류 발급 30일 경과), `done`(분석 완료)
- `POST /push/subscribe` `{ subscription }` (Web Push 구독 객체)
- 개별 on/off는 `PATCH /me`의 `notif`로

---

## 프론트 연동 메모

- 목 데이터 → API 전환 지점: `src/lib/store.js` (docs/tasks/chat 상태), `src/lib/derive.js` (D 참조)
- 업로드 진행 UI는 이미 `progress → analyzing → done/fail` 3단계로 구현됨 → `jobId` 폴링으로 치환
- 채팅 스트리밍 시뮬레이션(`chatSend`)은 SSE `delta` 이벤트 소비로 치환
- 사용자 이름(`김민지`) 하드코딩 위치: `src/app/chat/page.js`의 `USER_NAME`, `src/app/me/page.js`
