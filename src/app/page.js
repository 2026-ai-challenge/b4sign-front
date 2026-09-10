"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { D } from "@/lib/derive";
import { Logo } from "@/components/logo";

// B4SIGN의 4 Checks — 사인하기 전 반드시 확인할 4가지
const CHECKS = [
  {
    n: "①",
    en: "WHO",
    q: "계약 상대가 맞는가",
    desc: "등기부 소유자 ↔ 계약서 임대인 확인",
  },
  {
    n: "②",
    en: "DEBT",
    q: "먼저 가져갈 돈이 있는가",
    desc: "근저당·가압류·선순위 권리 확인",
  },
  {
    n: "③",
    en: "HOME",
    q: "계약하려는 집이 맞는가",
    desc: "주소·면적·용도·위반건축물 대조",
  },
  {
    n: "④",
    en: "CONTRACT",
    q: "계약 내용이 안전한가",
    desc: "불리한 조항·필수 특약·보증금 보호 조건 확인",
  },
];

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
      <div style={{ padding: "18px 20px 28px", background: "linear-gradient(#EEF6F1,#FAFAF7)" }}>
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
        <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.6, color: "#4B6157" }}>
          사인하기 전, 놓치면 안 되는 계약 위험을 확인하세요.
          <br />
          등기부등본·계약서·건축물대장을 올리면 3분 안에 위험한 줄을 문서 위에 표시해 드려요.
        </p>
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
      </div>

      {/* 4 Checks */}
      <div style={{ padding: "8px 20px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F2A20" }}>
          B4SIGN의 <span style={{ color: "#1B7F5C" }}>4 Checks</span>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {CHECKS.map((c) => (
            <div
              key={c.en}
              style={{
                display: "flex",
                gap: 12,
                padding: 14,
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #E3E8E3",
                alignItems: "flex-start",
              }}
            >
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
          ))}
        </div>
      </div>

      {/* 유형 카드 */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0F2A20" }}>
          계약 유형별로 다르게 봐요
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.values(D.TYPES).map((t) => (
            <div
              key={t.key}
              style={{
                display: "flex",
                gap: 12,
                padding: 14,
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #E3E8E3",
              }}
            >
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
          ))}
        </div>
      </div>

      {/* 검증 범위 */}
      <div
        style={{
          margin: "20px 20px 0",
          padding: 16,
          borderRadius: 16,
          background: "#fff",
          border: "1px solid #E3E8E3",
        }}
      >
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
