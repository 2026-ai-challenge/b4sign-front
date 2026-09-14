# B4SIGN 프론트 디자인 시스템 구축 — 설계 문서

- 작성일: 2026-09-14
- 배경: 창호님이 2026-09-10 푸시한 프론트 초기 구현(`b4sign-front`) 위에, 2026-09-11 확정된 B4SIGN 브랜드킷을 반영해 전체 디자인 시스템(토큰+공용 컴포넌트+아이콘)을 새로 구축한다.
- 제약: 원티드 AI Championship 2026 제출 마감 2026-09-20. 기존 코드(전 화면 인라인 `style={{}}`)를 그대로 살리는 저위험 접근을 우선한다.

## A. 디자인 토큰

브랜드킷 공식 값(`#176B57` Primary, `#17211E` Ink)을 소스로 삼고, 기존 코드에 흩어진 60여 개 hex 값 중 대소문자만 다른 중복(`#1B7F5C`/`#1b7f5c` 등)을 제거하며, 역할이 같은 회색·보더 값을 3~4단계로 통합한다.

```js
// src/design-system/tokens.js
export const color = {
  primary: '#176B57',
  primaryMid: '#3B9C7A',
  primaryTint: '#E8F4F0',
  primarySoft: '#BFE5D8',
  ink: '#17211E',

  textSecondary: '#4B6157',
  textTertiary: '#5A6660',   // WCAG AA 미달이던 #8A968F 대신 채택 (아래 접근성 참고)
  border: '#DDE3DF',
  borderSoft: '#E3E8E3',
  bgMuted: '#F4F6F4',
  bgShell: '#E9EAE4',
  white: '#FFFFFF',

  safeBg: '#E3F3E9', safeFg: '#14613F',
  warnBg: '#FFF1D6', warnFg: '#7A4E00',
  dangerBg: '#FDE8E4', dangerFg: '#B4231A',
  unknownBg: '#ECEEEC', unknownFg: '#5A6660',

  jeonse: '#3B5BDB', jeonseBg: '#EDF2FF',
  wolse: '#0B7285', wolseBg: '#E3FAFC',
  maemae: '#6741D9', maemaeBg: '#F3F0FF', // ASAP 스코프에서 매매 축소 결정 시 함께 정리
};

export const font = {
  family: '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif',
  size: { xs: 11, sm: 12.5, body: 15, title: 17, h1: 34 },
  weight: { regular: 500, semibold: 700, bold: 800, black: 900 },
};

export const space = [0, 4, 8, 12, 16, 20, 24, 28, 32];
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
```

### 접근성(WCAG AA) 검토 결과

| 조합 | 대비율 | 판정 |
|---|---|---|
| Primary `#176B57` on White | 6.41:1 | 통과 |
| Ink `#17211E` on White | 16.50:1 | 통과 |
| textSecondary `#4B6157` on White | 6.67:1 | 통과 |
| ~~textTertiary `#8A968F` on White~~ | 3.07:1 | **미달** → `#5A6660`(기존 unknown 상태색 재사용, 5.99:1)로 교체 |
| safe `#14613F` on `#E3F3E9` | 6.50:1 | 통과 |
| warn `#7A4E00` on `#FFF1D6` | 6.45:1 | 통과 |
| danger `#B4231A` on `#FDE8E4` | 5.58:1 | 통과 |
| unknown `#5A6660` on `#ECEEEC` | 5.99:1 | 통과 |

나머지 접근성 항목(키보드 포커스, 터치 타겟, 화면별 로딩/빈 상태/에러/권한거부/극단 데이터)은 토큰 단계 대상이 아니라 D 롤아웃 단계에서 화면별로 점검한다.

## B. 공용 컴포넌트

`src/design-system/`에 신규 폴더를 만든다. 기존 `src/components/`(레이아웃 전용: `ui.js`, `logo.js`, `fields.js`)는 유지하되 새 컴포넌트를 가져다 쓰도록 리팩터한다.

| 컴포넌트 | Variant | State | Token | 사용 조건 |
|---|---|---|---|---|
| Button | primary / secondary / ghost | default / pressed / disabled | radius pill(999), height 52(lg)/44(md) | CTA=primary, 보조 액션=secondary |
| Card | default / interactive | default / hover(interactive만) | radius lg(16), borderSoft, white | 리스트 아이템·섹션 컨테이너 |
| Badge | type(전세/월세/매매) / status(safe/warn/danger/unknown) | — | 각 컬러 그룹 bg+fg | 기존 `TypeBadge`+`StatusChip` 통합 |
| Input | text / date / address | default / focus / error | border, radius md(12), height 48 | 폼 전체 |
| Sheet | bottom-sheet | open / closed | radius "24 24 0 0", backdrop rgba(ink,.45) | `fields.js`+`ui.js`에 중복 구현된 시트 스타일 통합 |
| Icon | — | active/inactive(strokeWidth·outline/solid로 구분) | `currentColor` 상속 | 아래 C 참고 |

폴더 구조:
```
src/design-system/
  tokens.js
  Button.js  Card.js  Badge.js  Input.js  Sheet.js  Icon.js
  index.js
```

## C. 아이콘 세트

**Heroicons**(`@heroicons/react`) 채택 — 팀의 다른 프로젝트(SeedLab)와 통일, outline/solid 두 세트로 탭 활성 상태 표현 가능.

| 위치 | 기존 | 교체 |
|---|---|---|
| 탭바 홈 | 색칠 사각형 | `HomeIcon` |
| 탭바 서류 | 〃 | `DocumentTextIcon` |
| 탭바 할 일 | 〃 | `ClipboardDocumentCheckIcon` |
| 탭바 상담 | 〃 | `ChatBubbleLeftRightIcon` |
| 탭바 MY | 〃 | `UserCircleIcon` |
| 날짜 입력 버튼 | 📅 이모지 | `CalendarDaysIcon` |
| 주소 검색 placeholder | `⌕` 글리프 | `MagnifyingGlassIcon` |
| 랜딩 STEP1 목업 | 📷 이모지 | `CameraIcon` |
| 캘린더 월 이동 | `‹ ›` 문자 | `ChevronLeftIcon`/`ChevronRightIcon` |
| 상태 배지 | `✓ ? ! ▲` 문자 | `CheckCircleIcon`/`QuestionMarkCircleIcon`/`ExclamationTriangleIcon`/`ExclamationCircleIcon` |
| 법 근거 아이콘 | `§` 문자 | `ScaleIcon` |
| 시트 닫기 | `×` 문자 | `XMarkIcon` |

## D. 롤아웃 순서

| 순서 | 화면/영역 | 이유 |
|---|---|---|
| 0 | `design-system/` 기반 | 모든 화면이 공유 |
| 1 | `Shell`/`TabBar` | 기반 완성 즉시 전 화면에 반영 |
| 2 | 대시보드 | 데모 시작점 |
| 3 | 서류함(`documents`, `documents/[id]`) | Hero 기능(하이라이트) |
| 4 | 분석 결과(`analysis`) | 판정 근거 화면 |
| 5 | 할 일/체크리스트(`tasks`, `checklist`) | 행동 제안 마무리 |
| 6 | 상담(`chat`) | AI 상담 세션 |
| 7 | 랜딩(`page.js`) | 이미 비교적 정돈됨, 토큰만 교체 |
| 8 | 로그인/회원가입/아이디·비번 찾기 | 표준 폼 위주 |
| 9 | 이사/등기감시/케이스 추가 | 보조 기능, 여력 시 |

## 범위 밖 (이번 스펙에서 다루지 않음)

- Tailwind 전환 — 제출 후 P2 (A 섹션에서 JS 토큰 객체로 결정)
- 매매 유형 축소/삭제 — 별도 스코프 결정 필요 ([[b4sign-front-v1-status]] 참고)
- 화면별 로딩/빈 상태/에러/권한거부 등 예외 케이스 — D 롤아웃 단계에서 화면마다 점검
