# 집살피 AI 스택 평가 (2026-09 기준, 최신 문서 리서치)

실데이터(법령·판례·계약서 샘플) 투입 전 기술 선택. 각 항목은 최신 공식 문서를 근거로
마케팅 문구가 아닌 실제 한계 중심으로 평가했다. LLM은 Anthropic Claude로 확정
(백엔드 `zipsalpi-api/src/llm/llm.service.ts`에 연동 완료 — `ANTHROPIC_API_KEY`만 설정).

## 권고 스택 요약

| 항목 | 권고 | 이유 한 줄 | 월 예상 비용 (초기) |
|---|---|---|---|
| 임베딩 | **Voyage voyage-4 채택** (실데이터로 BGE-M3·text-embedding-3-large와 실측 비교 후 확정) | 다국어 일반 모델 중 최신 세대 + 월 2억 토큰 무료. voyage-law-2는 영어 법률 특화라 **불채택** | $0 (무료 한도 내) |
| 벡터 스토어 | **pgvector 채택** | 수천~수만 청크는 pgvector 최적 구간, 추가 인프라 0. Prisma는 `Unsupported("vector")` + raw SQL | $0 (기존 Postgres) |
| 오케스트레이션 | **Anthropic SDK 직접 사용 채택**, LangChain/LangGraph 불채택 | RAG 1개 + SSE 챗 1개 수준에서 추상화가 벌어주는 게 없고 디버깅 비용만 추가 | LLM 비용에 포함 |
| Neo4j/GraphRAG | **불채택 (지금은)** | 문서 수천 건 규모에서 구축·유지 비용 대비 이득 근거 없음. Postgres 관계 테이블로 대체 | $0 |
| 법령 데이터/청킹 | **국가법령정보센터 Open API + 조문 단위 청킹 채택**, 하이브리드 검색은 **보류(2단계)** | 조문이 자연 청크 단위. BM25는 한국어 토크나이저 문제 — 검증 후 추가 | $0 (무료 API) |
| PDF/OCR | **Upstage Document Parse 채택**, AWS Textract **불채택** | 한국 문서(등기부 표 구조) 특화, $0.01/페이지. Textract는 한국어 구조화 추출 미지원 | ~$10 (1,000페이지) |

## 1. 임베딩

- Voyage는 2026-01-15에 **voyage-4 세대**(large/기본/lite/nano) 출시 — 다국어 일반 모델, 모델 간 임베딩 공간 호환. 가격 lite $0.02 / 기본 $0.06 / large $0.12 per 1M 토큰, **각 모델 월 2억 토큰 무료**.
  - https://blog.voyageai.com/2026/01/15/voyage-4/ · https://docs.voyageai.com/docs/pricing
- **voyage-law-2 함정**: 2024-04 모델, 미국·중국·독일·인도 법역 중심(사실상 영어 법률 특화). 한국어 법률은 학습 범위 밖 — 이름만 보고 채택 금지. 한국어에선 일반 다국어 모델보다 못할 가능성 높음. **불채택**.
  - https://blog.voyageai.com/2024/04/15/domain-specific-embeddings-and-retrieval-legal-edition-voyage-law-2/
- **MongoDB 인수 리스크**: 2025-02 인수 후 독립 API 유지 중이나 방향성은 Atlas 통합(2026-05 자동 임베딩 프리뷰). 단기 리스크 낮음. 단, 임베딩 교체 = 전체 재색인이므로 **임베딩 호출부를 인터페이스로 감싸 교체 가능하게** 설계.
  - https://investors.mongodb.com/news-releases/news-release-details/mongodb-announces-acquisition-voyage-ai-enable-organizations
- 경쟁: OpenAI text-embedding-3-large $0.13/M (MIRACL 54.9%), Cohere embed-v4 $0.12/M (100+ 언어·128K 입력), **BGE-M3**(오픈소스, 한국어 검증·dense+sparse·8K)는 GPU 자체 서빙 필요 → 초기 소규모 팀엔 운영비가 API비를 역전.
- **적대적 결론**: 한국어 *법률* 검색 공개 벤치마크는 사실상 없음 — 어떤 벤더 수치도 이 도메인을 보장하지 않는다. **voyage-4로 시작(무료 한도), 실데이터로 질의 20~30개 골든셋을 만들어 recall@k 실측 비교 후 확정.** 이 규모에서 임베딩 비용은 어느 쪽이든 월 $1 미만 — 비용은 의사결정 변수가 아니다.

## 2. 벡터 스토어 — pgvector 채택

- 수천~수만 청크는 pgvector의 압도적 우위 구간. "1천만 벡터 이하 + 이미 Postgres면 pgvector" 가 업계 컨센서스.
- 케이스·법령 메타데이터와 같은 DB → `WHERE case_id = ?` 조인 필터가 SQL 한 줄.
- **Prisma 현황(정직하게)**: 네이티브 vector 타입 없음. `Unsupported("vector(1024)")` 선언 + 인덱스/유사도 쿼리는 `$queryRaw` 직접 작성, Prisma Studio에서 해당 테이블 깨짐. 쿼리 2~3개를 raw SQL로 쓰는 비용 — 감내할 만함.
  - https://www.prisma.io/docs/postgres/database/postgres-extensions · https://github.com/prisma/prisma/issues/18442
- Qdrant: 별도 인프라 + Postgres와 데이터 이중화 부담 → **보류** (수백만 벡터·저지연 요구 시 재평가). Pinecone: Standard 최소 $50/월, 이 규모에서 얻는 것 없음 → **불채택**. Atlas Vector: DB 추가 → **불채택**.
- **이행 참고**: 현재 dev DB는 SQLite. RAG 착수 시점에 Postgres로 전환(스키마는 이미 호환 작성)하고 pgvector 확장 추가.

## 3. 오케스트레이션 — Anthropic SDK 직접 사용

- LangChain/LangGraph는 2025-10 Python·TS 동시 1.0 출시, 현재 v1 안정 — "TS 부실" 탈락이 아니다. 탈락 사유는 **앱의 형태**:
  - 집살피의 LLM 호출은 (a) 판정 설명 생성(단발), (b) RAG 챗(검색→조립→SSE), (c) 법령 요약 — 전부 **선형 파이프라인**. 다중 에이전트·조건 분기·체크포인트 재개(LangGraph의 실제 가치)가 필요 없다.
  - 추상화가 벌어주는 것 = 프로바이더 교체 용이성 → Claude로 이미 확정. 잃는 것 = NestJS DI와 이질적 계층, 버전 추적, 프레임워크 내부를 관통하는 스택트레이스, 프롬프트·캐싱 제어권.
  - 특히 **프롬프트 캐싱**(법령 컨텍스트·시스템 프롬프트 `cache_control` 고정 → 챗 비용 대폭 절감)과 SSE는 공식 `@anthropic-ai/sdk`의 `client.messages.stream()` 직접 제어가 확실.
- retrieval 함수는 직접 작성(임베딩 API + pgvector 쿼리 — 합쳐 100줄 이하). LangGraph JS는 "서류 검증 멀티스텝 에이전트"가 정말 필요해지면 **보류 후 재평가**.

## 4. Neo4j / GraphRAG — 불채택 (지금은)

- GraphRAG는 색인 시 문서 전체에 엔티티·관계 추출 LLM 호출 발생(구축 비용 큼) + 문서 갱신마다 재추출(상시 유지비). 스타트업 초기·문서 수천 건·DB 2개 운영 여력 없음 = 전형적 오버엔지니어링 조건.
- 결정적으로 집살피의 "관계"는 이미 구조화되어 있다: 조문 번호(주임법 제3조의2), 판례의 조문 인용, 계약 조항↔조문 매핑 — LLM으로 추출할 비정형 관계가 아니라 **파싱 가능한 명시적 참조**. Postgres 관계 테이블(`article_citations`, `clause_law_map`)이 더 정확하다.
- 다중 홉 질문("이 조문을 인용한 판례를 인용한 판례")이 실사용 로그에서 관찰되면 그때 재평가.

## 5. 한국어 법률 RAG 특수사항

- **데이터 소스**: 법제처 **국가법령정보 공동활용 Open API** — 법령 본문 + **조항호목 단위 조회 API** 별도 존재(조문 단위 수집이 API 레벨 지원), 판례·법령해석례·행정규칙도 제공. 무료·신청제.
  - https://open.law.go.kr/LSO/openApi/openApiManual.do
- **청킹**: 한국 법령은 조(條)-항-호 구조가 명확 → **조 단위 청킹 + "법령명 제N조(제목)" 메타데이터를 청크 텍스트에 포함**. 임의 슬라이딩 윈도우는 조문 경계를 깨서 인용 정확도를 망침. 긴 조문만 항 단위 분할.
- **하이브리드(BM25+벡터)**: 표준이지만 Postgres 기본 FTS엔 한국어 형태소 분석이 없어 ParadeDB(korean_lindera)나 별도 구성이 필요 — 관리형 Postgres에선 확장 설치 불가할 수 있음. **1차: 벡터 + 조문번호/법령명 정확 매칭(정규식)** → 골든셋 recall 부족 시 BM25 추가. "임차권등기명령" 같은 전문 용어는 정확 매칭이 벡터를 보완하므로 도입 가능성은 높은 편 — 단, 측정 후.

## 6. PDF 텍스트 추출 / OCR

| 서비스 | 한국어 | 가격 | 평가 |
|---|---|---|---|
| **Upstage Document Parse** | 한국 문서 특화 (표·레이아웃) | $0.01/페이지 (Enhanced $0.03), OCR 단독 $0.0015 | **채택** — 등기부 표 구조(갑구/을구) 파싱에 현실적 최적 |
| Google Document AI | OCR 200+ 언어 | $1.50/1,000페이지 | 대안 — 저렴하나 한국 서식 특화 아님 |
| AWS Textract | **한국어 구조화 추출(forms/tables) 미지원** | — | **불채택** |
| 오픈소스 (PaddleOCR 등) | 품질 편차 | 무료+서빙비 | 보류 |

주의: 인터넷등기소 발급 **디지털 PDF는 텍스트 레이어가 있어 OCR 불필요** — pdf 텍스트 추출 먼저 시도 → 실패(스캔본) 시에만 OCR 폴백하는 2단계 파이프라인으로 비용 최소화.

### ✅ 확정 (2026-09-11): PDF 파이프라인 역할 분담

- **구조 추출(룰 판정·줄 단위 하이라이트) → Upstage Document Parse** — 표를 HTML로 보존(등기부 갑구/을구 필수), 출력이 결정적이라 룰엔진 입력에 적합
- **챗·검토(이해·설명·상담) → Claude** — Solar LLM은 사용하지 않음
- 처리 순서 3단계: ① 텍스트 레이어 추출(무료) → ② 실패/표 필요 시 Document Parse ($0.01/p) → ③ 폴백·원문 참조용 Claude 네이티브 PDF (document 블록 + citations, 비결정적이라 룰엔진 입력으로는 사용 금지)

## 지금 하지 말 것 (오버엔지니어링 목록)

1. **Neo4j/GraphRAG** — 관계는 Postgres 테이블로. 다중 홉 질문이 관찰된 후 재평가.
2. **LangChain/LangGraph** — 선형 파이프라인에 프레임워크 계층 금지. SDK 직접 호출.
3. **Qdrant/Pinecone 등 별도 벡터 DB** — pgvector로 충분. 이중 동기화 만들지 말 것.
4. **임베딩 파인튜닝·자체 서빙(BGE-M3 GPU)** — API 실측 비교에서 오픈소스가 명확히 이길 때만.
5. **하이브리드 검색을 1차 출시 전 구축** — 한국어 토크나이저 인프라가 딸려온다. 측정 후 결정.
6. **판례 대량 수집** — 주임법·민법 임대차편·상임법 + 주요 판례부터. 질문 로그 보고 확장.
7. **Reranker** — 수만 청크에선 top-k를 넉넉히(10~15) Claude 컨텍스트에 넣는 게 더 싸고 단순.

## 단일 최우선 행동

실데이터가 오면 코드보다 먼저 **질의-정답 골든셋 20~30개**를 만들 것.
임베딩·하이브리드·reranker 결정은 전부 이 측정에 달려 있고, 측정 없는 선택은 다시 하게 된다.
