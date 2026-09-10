"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { D } from "@/lib/derive";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";

// B4SIGN의 4 Checks — 사인하기 전 반드시 확인할 4가지
const CHECKS = [
  { n: "①", en: "WHO", q: "계약 상대가 맞는가", desc: "등기부 소유자 ↔ 계약서 임대인 확인" },
  { n: "②", en: "DEBT", q: "먼저 가져갈 돈이 있는가", desc: "근저당·가압류·선순위 권리 확인" },
  { n: "③", en: "HOME", q: "계약하려는 집이 맞는가", desc: "주소·면적·용도·위반건축물 대조" },
  {
    n: "④",
    en: "CONTRACT",
    q: "계약 내용이 안전한가",
    desc: "불리한 조항·필수 특약·보증금 보호 조건 확인",
  },
];

const sectionTitle = { fontSize: 13, fontWeight: 800, color: "#0F2A20" };
const card = {
  borderRadius: 16,
  background: "#fff",
  border: "1px solid #E3E8E3",
};

export default function Landing() {
  const router = useRouter();
  const { loggedIn } = useApp();
  const start = () => router.push(loggedIn ? "/dashboard" : "/login");

  return (
    <>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 52,
          padding: "0 20px",
          flex: "none",
        }}
      >
        <Logo />
        <button
          onClick={start}
          style={{
            background: "none",
            border: "none",
            fontSize: 13,
            color: "#4B6157",
            fontWeight: 600,
          }}
        >
          {loggedIn ? "대시보드로" : "로그인"}
        </button>
      </div>

      {/* 히어로 */}
      <div style={{ padding: "18px 20px 16px", background: "linear-gradient(#EEF6F1,#FAFAF7)" }}>
        <Reveal>
          <div
            style={{
              display: "inline-flex",
              padding: "5px 10px",
              borderRadius: 999,
              background: "#fff",
              border: "1px solid #CFE3D8",
              fontSize: 12,
              fontWeight: 600,
              color: "#1B7F5C",
            }}
          >
            비포사인 · 전세 · 월세 · 매매
          </div>
        </Reveal>
        <Reveal delay={90}>
          <h1
            style={{
              margin: "14px 0 0",
              fontSize: 34,
              lineHeight: 1.15,
              fontWeight: 900,
              letterSpacing: "-.02em",
              color: "#0F2A20",
            }}
          >
            4 CHECKS
            <br />
            <span style={{ color: "#1B7F5C" }}>BEFORE YOU SIGN.</span>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.6, color: "#4B6157" }}>
            사인하기 전, 놓치면 안 되는 계약 위험을 확인하세요.
            <br />
            등기부등본·계약서·건축물대장을 올리면 3분 안에 위험한 줄을 문서 위에 표시해 드려요.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <button
            onClick={start}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              marginTop: 24,
              background: "#1B7F5C",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            무료로 4가지 체크 시작하기
          </button>
        </Reveal>
        {/* 스크롤 힌트 (reduced-motion에서는 CSS로 정지) */}
        <div
          className="scroll-hint"
          style={{
            marginTop: 14,
            textAlign: "center",
            fontSize: 16,
            color: "#1B7F5C",
            animation: "floatDown 1.6s ease-in-out infinite",
          }}
        >
          ⌄
        </div>
      </div>

      {/* 4 Checks */}
      <div style={{ padding: "8px 20px 0" }}>
        <Reveal>
          <div style={sectionTitle}>
            B4SIGN의 <span style={{ color: "#1B7F5C" }}>4 Checks</span>
          </div>
        </Reveal>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {CHECKS.map((c, i) => (
            <Reveal key={c.en} delay={i * 80}>
              <div style={{ ...card, display: "flex", gap: 12, padding: 14, alignItems: "flex-start" }}>
                <span
                  style={{
                    flex: "none",
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#EEF6F1",
                    color: "#1B7F5C",
                    fontSize: 11,
                    fontWeight: 900,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    letterSpacing: "-.02em",
                  }}
                >
                  {c.en}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                    {c.n} {c.q}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.5, color: "#4B6157" }}>
                    {c.desc}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ─── 이용 가이드: 앱 화면을 닮은 미니 목업 3장 ─── */}
      <div style={{ padding: "28px 20px 0" }}>
        <Reveal>
          <div style={sectionTitle}>이렇게 쓰면 돼요</div>
        </Reveal>

        {/* STEP 1 — 찍어서 올리면 교차검증 */}
        <Reveal delay={60}>
          <div style={{ ...card, marginTop: 10, padding: 16 }}>
            <GuideHead
              step="STEP 1"
              title="찍어서 올리기만 하면"
              desc="계약서·등기부등본을 사진으로 찍어 올리면, 등기부등본과 교차검증까지 자동으로 해줘요."
            />
            <div style={mock.frame}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={mock.iconBox}>📷</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>등기부등본_촬영.jpg</div>
                  <div style={{ height: 5, borderRadius: 3, background: "#E6EBE7", marginTop: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "100%", background: "#1B7F5C", borderRadius: 3 }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#14613F", flex: "none" }}>
                  분석 완료
                </span>
              </div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={mock.okRow}>✓ 등기부 소유자 = 계약서 임대인 일치</div>
                <div style={mock.okRow}>✓ 국토부 건축물대장 교차검증 완료</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* STEP 2 — 위험 특약 감지 + 수정 방향 */}
        <Reveal delay={60}>
          <div style={{ ...card, marginTop: 10, padding: 16 }}>
            <GuideHead
              step="STEP 2"
              title="위험한 특약을 짚어줘요"
              desc="특약사항 중 불리한 것·위험한 것을 감지해 문서 위에 표시하고, 어떻게 고쳐야 하는지 수정 방향까지 알려줘요."
            />
            <div style={{ ...mock.frame, fontFamily: "'Noto Serif KR',serif" }}>
              <div style={{ fontSize: 11, color: "#555", lineHeight: 1.8 }}>
                3. 특약사항
                <br />① 임차인은{" "}
                <span
                  style={{
                    background: "rgba(240,110,95,.32)",
                    padding: "1px 3px",
                    borderRadius: 3,
                    color: "#111",
                  }}
                >
                  퇴거 시 도배·장판을 전액 부담하여
                </span>{" "}
                반환한다{" "}
                <span
                  style={{
                    display: "inline-flex",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid #B4231A",
                    background: "#FDE8E4",
                    color: "#B4231A",
                    fontSize: 10,
                    fontWeight: 900,
                    alignItems: "center",
                    justifyContent: "center",
                    verticalAlign: "middle",
                  }}
                >
                  ▲
                </span>
              </div>
              <div
                style={{
                  marginTop: 10,
                  padding: "9px 11px",
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid #F5C8C1",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: "#FDE8E4",
                      color: "#B4231A",
                      fontSize: 10,
                      fontWeight: 800,
                      fontFamily: "Pretendard, sans-serif",
                    }}
                  >
                    ▲ 위험
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: "Pretendard, sans-serif" }}>
                    임차인에게 일방적으로 불리한 조항
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    lineHeight: 1.55,
                    color: "#2E463C",
                    fontFamily: "Pretendard, sans-serif",
                  }}
                >
                  <b style={{ color: "#1B7F5C" }}>수정 방향</b> · "통상 마모 제외"로 바꾸도록 요청
                  문구를 만들어 드려요
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* STEP 3 — 챗 질문 */}
        <Reveal delay={60}>
          <div style={{ ...card, marginTop: 10, padding: 16 }}>
            <GuideHead
              step="STEP 3"
              title="모르는 건 챗에서 질문하세요"
              desc="궁금한 조항은 AI 상담에 물어보세요. 내 서류와 법령 근거를 바탕으로 쉽게 답해줘요."
            />
            <div style={mock.frame}>
              <div
                style={{
                  alignSelf: "flex-end",
                  marginLeft: "auto",
                  maxWidth: "80%",
                  width: "fit-content",
                  padding: "7px 10px",
                  borderRadius: "12px 12px 3px 12px",
                  background: "#1B7F5C",
                  color: "#fff",
                  fontSize: 11.5,
                }}
              >
                이 특약, 나한테 불리한 거야?
              </div>
              <div
                style={{
                  marginTop: 6,
                  maxWidth: "88%",
                  padding: "8px 10px",
                  borderRadius: "12px 12px 12px 3px",
                  background: "#fff",
                  border: "1px solid #E3E8E3",
                  fontSize: 11.5,
                  lineHeight: 1.55,
                }}
              >
                네, 통상 마모까지 부담하게 되어 불리해요. 특약에 "통상 마모 제외"를 넣자고
                요청하세요.
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <span style={mock.chip}>계약서 특약 ①</span>
                <span style={mock.chip}>§ 민법 제615조</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* 유형 카드 */}
      <div style={{ padding: "28px 20px 0" }}>
        <Reveal>
          <div style={sectionTitle}>계약 유형별로 다르게 봐요</div>
        </Reveal>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.values(D.TYPES).map((t, i) => (
            <Reveal key={t.key} delay={i * 80}>
              <div style={{ ...card, display: "flex", gap: 12, padding: 14 }}>
                <span
                  style={{
                    flex: "none",
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: t.bg,
                    color: t.color,
                    fontSize: 15,
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {t.label}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{t.risk}</div>
                  <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.5, color: "#4B6157" }}>
                    {t.focus.join(" · ")}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* 검증 범위 */}
      <Reveal>
        <div style={{ ...card, margin: "28px 20px 0", padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>무엇을 어떻게 검증하나요</div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {[
              ["✓", "#E3F3E9", "#14613F", <span key="1"><b>등기부등본</b> — 소유자·근저당·가압류·면적 등 등기 항목을 검증하고 계약서와 대조</span>],
              ["✓", "#E3F3E9", "#14613F", <span key="2"><b>건축물대장</b> — 국토부 API로 위반건축물·용도 교차 검증</span>],
              ["✓", "#E3F3E9", "#14613F", <span key="3"><b>계약서</b> — 필수 특약 누락·불리한 조항을 줄 단위로 표시</span>],
              ["–", "#ECEEEC", "#5A6660", <span key="4" style={{ color: "#4B6157" }}>문서 원본의 <b style={{ color: "#0F2A20" }}>위·변조 여부</b>는 확인하지 않아요. 계약 당일 인터넷등기소에서 직접 재열람하세요</span>],
            ].map(([glyph, bg, fg, content], i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <span
                  style={{
                    flex: "none",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: bg,
                    color: fg,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {glyph}
                </span>
                {content}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 마지막 CTA */}
      <Reveal>
        <div style={{ padding: "24px 20px 0" }}>
          <button
            onClick={start}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              background: "#0F2A20",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            지금 4가지 체크 시작하기 →
          </button>
        </div>
      </Reveal>

      {/* 푸터 */}
      <div style={{ marginTop: "auto", paddingTop: 28 }}>
        <div
          style={{
            padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
            borderTop: "1px solid #E3E8E3",
            fontSize: 12,
            lineHeight: 1.7,
            color: "#6E827A",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size="sm" />
            <span style={{ fontWeight: 700 }}>비포사인</span>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            <span>개인정보처리방침</span>
            <span>이용약관</span>
          </div>
          <div style={{ marginTop: 6 }}>
            B4SIGN(비포사인)은 법률 자문이 아닙니다. 최종 판단은 법무사·변호사 등 전문가와
            상의하세요.
          </div>
        </div>
      </div>
    </>
  );
}

function GuideHead({ step, title, desc }) {
  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#1B7F5C", letterSpacing: ".06em" }}>
        {step}
      </div>
      <div style={{ marginTop: 4, fontSize: 15.5, fontWeight: 800 }}>{title}</div>
      <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: "#4B6157" }}>{desc}</p>
    </>
  );
}

// 가이드용 미니 목업 스타일
const mock = {
  frame: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "#F4F6F4",
    border: "1px solid #E3E8E3",
  },
  iconBox: {
    flex: "none",
    width: 30,
    height: 30,
    borderRadius: 9,
    background: "#EEF6F1",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  },
  okRow: {
    padding: "6px 9px",
    borderRadius: 8,
    background: "#E3F3E9",
    color: "#14613F",
    fontSize: 11,
    fontWeight: 700,
  },
  chip: {
    padding: "3px 7px",
    borderRadius: 5,
    background: "#EEF6F1",
    color: "#1B7F5C",
    fontSize: 10,
    fontWeight: 700,
  },
};
