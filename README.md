# B4SIGN (비포사인) — Front

**4 checks before you sign.** 사인하기 전, 놓치면 안 되는 계약 위험을 확인하세요.

부동산 계약(전세·월세·매매) 서류를 올리면 위험한 줄을 문서 위에 표시하고,
근거·법령 요약·할 일로 이어주는 모바일 웹 앱. Next.js(App Router).

## B4SIGN의 4 Checks

| | Check | 확인 내용 |
|---|---|---|
| ① | **WHO** — 계약 상대가 맞는가 | 등기부 소유자 ↔ 계약서 임대인 확인 |
| ② | **DEBT** — 먼저 가져갈 돈이 있는가 | 근저당·가압류·선순위 권리 확인 |
| ③ | **HOME** — 계약하려는 집이 맞는가 | 주소·면적·용도·위반건축물 대조 |
| ④ | **CONTRACT** — 계약 내용이 안전한가 | 불리한 조항·필수 특약·보증금 보호 조건 확인 |

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

환경 변수 (`.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

백엔드([b4sign-backend](https://github.com/2026-ai-challenge/b4sign-backend))가 꺼져 있으면
자동으로 내장 목 데이터로 폴백해 데모가 끊기지 않는다.

## 배포 (Vercel)

1. Vercel에 이 저장소 Import (Framework: Next.js 자동 감지)
2. Environment Variables에 `NEXT_PUBLIC_API_URL` = 배포된 백엔드 주소(`https://<api-host>/api/v1`) 설정
3. main 푸시마다 자동 배포

## 문서

- [docs/api-spec.md](docs/api-spec.md) — 백엔드 API 명세 (프론트 데이터 구조와 1:1)
- [docs/ai-stack.md](docs/ai-stack.md) — AI/RAG 스택 결정 기록 (임베딩·벡터·OCR·파이프라인)
