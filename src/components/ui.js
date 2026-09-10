"use client";

import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { D } from "@/lib/derive";
import { Logo } from "@/components/logo";

// 탭바 없이 풀스크린으로 쓰는 라우트: 문서 뷰어 + 인증 플로우
const NO_TAB_ROUTES = ["/", "/login", "/signup", "/signup/consent", "/find-id", "/find-password"];

// 모든 화면 상단에 항상 떠 있는 브랜드 밴드 — 로고 + 숨 쉴 여백
function BrandBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { loggedIn } = useApp();
  const isLanding = pathname === "/";
  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px 6px",
      }}
    >
      <button
        onClick={() => router.push("/")}
        aria-label="B4SIGN 홈"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <Logo size="sm" />
      </button>
      {isLanding && (
        <button
          onClick={() => router.push(loggedIn ? "/dashboard" : "/login")}
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
      )}
    </div>
  );
}

// ─── 앱 셸: 모바일 프레임(100dvh 고정) + 브랜드 밴드 + 내부 스크롤 + 탭바 ───
// iPhone 14~16(390~430px)에서 화면을 꽉 채우고, 가로 오버플로를 차단한다.
export function Shell({ children }) {
  const pathname = usePathname();
  const isViewer = /^\/documents\/[^/]+$/.test(pathname);
  const hideTabs = isViewer || NO_TAB_ROUTES.includes(pathname);
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: "#E9EAE4",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          height: "100dvh",
          background: "#FAFAF7",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 0 40px rgba(0,0,0,.08)",
          overflow: "hidden",
        }}
      >
        {!isViewer && <BrandBar />}
        {/* data-scroll-root: Reveal(스크롤 리빌)의 IntersectionObserver 기준 컨테이너 */}
        <div
          data-scroll-root=""
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            overflowX: "hidden",
            overscrollBehaviorX: "none",
          }}
        >
          {children}
        </div>
        {!hideTabs && <TabBar />}
        <GlobalSheets />
        <Toast />
      </div>
    </div>
  );
}

const TABS = [
  ["/dashboard", "홈", ["/dashboard", "/analysis"]],
  ["/documents", "서류", ["/documents"]],
  ["/tasks", "할 일", ["/tasks", "/checklist"]],
  ["/chat", "상담", ["/chat"]],
  ["/me", "MY", ["/me"]],
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div
      style={{
        flex: "none",
        padding: "8px 8px calc(14px + env(safe-area-inset-bottom))",
        background: "#fff",
        borderTop: "1px solid #E3E8E3",
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        zIndex: 10,
      }}
    >
      {TABS.map(([href, label, act]) => {
        const on = act.some((a) => pathname === a || pathname.startsWith(a + "/"));
        const color = on ? "#1B7F5C" : "#8A968F";
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              background: "none",
              border: "none",
              color,
              padding: 0,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                background: on ? "#1B7F5C" : "transparent",
                border: `2px solid ${color}`,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, fontWeight: on ? 800 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Toast() {
  const { toastMsg } = useApp();
  if (!toastMsg) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom: 100,
        padding: "12px 16px",
        borderRadius: 12,
        background: "#0F2A20",
        color: "#fff",
        fontSize: 13.5,
        fontWeight: 600,
        textAlign: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,.25)",
        zIndex: 50,
      }}
    >
      {toastMsg}
    </div>
  );
}

// 법 근거 시트 + 용어 툴팁 (앱 어디서든 열림)
function GlobalSheets() {
  const { law, setLaw, term, setTerm } = useApp();
  return (
    <>
      {law && (
        <div
          onClick={() => setLaw(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,42,32,.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 430,
              maxHeight: "82%",
              overflow: "auto",
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              padding: "20px 20px calc(28px + env(safe-area-inset-bottom))",
              animation: "sheetUp .22s ease",
            }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#DDE3DF", margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "#EEF6F1",
                  color: "#1B7F5C",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  fontWeight: 800,
                  flex: "none",
                }}
              >
                §
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6E827A" }}>법 근거</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "#FFF1D6",
                  color: "#7A4E00",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                요약
              </span>
            </div>
            <div style={{ marginTop: 12, fontSize: 19, fontWeight: 800, lineHeight: 1.4 }}>
              {D.LAWS[law].title}
            </div>
            <p
              style={{
                margin: "14px 0 0",
                padding: "16px 18px",
                borderRadius: 14,
                background: "#F4F6F4",
                fontSize: 15,
                lineHeight: 1.8,
                color: "#2E463C",
              }}
            >
              {D.LAWS[law].text}
            </p>
            <div style={{ marginTop: 12, fontSize: 12.5, color: "#6E827A", lineHeight: 1.6 }}>
              {D.LAWS[law].note} · 조문 원문은 법제처 국가법령정보센터(law.go.kr)에서 확인하세요.
              B4SIGN의 요약은 법률 자문이 아니에요.
            </div>
            <button
              onClick={() => setLaw(null)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                marginTop: 16,
                background: "#0F2A20",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
      {term && (
        <div
          onClick={() => setTerm(null)}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 16,
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 398,
              padding: "14px 16px",
              borderRadius: 16,
              background: "#0F2A20",
              color: "#fff",
              boxShadow: "0 12px 30px rgba(0,0,0,.3)",
              animation: "sheetUp .22s ease",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9BD3B9" }}>
              {D.TERMS[term].word}
            </div>
            <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.55 }}>
              {D.TERMS[term].def}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── 공용 소품 ───
export function TypeBadge({ type, size = "md" }) {
  const t = D.TYPES[type];
  const pad = size === "sm" ? "1px 6px" : "3px 8px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span
      style={{
        padding: pad,
        borderRadius: size === "sm" ? 4 : 6,
        background: t.bg,
        color: t.color,
        fontSize: fs,
        fontWeight: 800,
        flex: "none",
      }}
    >
      {t.label}
    </span>
  );
}

export function StatusChip({ st, children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 9px",
        borderRadius: 999,
        background: st.bg,
        color: st.fg,
        fontSize: 11.5,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {st.glyph} {children ?? st.label}
    </span>
  );
}

export function TermButton({ termKey, children }) {
  const { setTerm } = useApp();
  return (
    <button
      onClick={() => setTerm(termKey)}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        color: "#0F2A20",
        borderBottom: "1.5px dashed #1B7F5C",
        lineHeight: 1.2,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function LawButton({ lawKey, short }) {
  const { setLaw } = useApp();
  return (
    <button
      onClick={() => setLaw(lawKey)}
      style={{
        padding: "4px 9px",
        borderRadius: 6,
        border: "1px solid #DDE3DF",
        background: "#fff",
        fontSize: 11.5,
        fontWeight: 700,
        color: "#4B6157",
      }}
    >
      § {short}
    </button>
  );
}

// 법 근거를 한 줄 전체로 보여주는 행 버튼 — 누르는 것임이 분명하게
export function LawRow({ lawKey }) {
  const { setLaw } = useApp();
  const law = D.LAWS[lawKey];
  return (
    <button
      onClick={() => setLaw(lawKey)}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
        padding: "11px 12px",
        borderRadius: 12,
        border: "1px solid #DDE3DF",
        background: "#F9FAF9",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          flex: "none",
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "#EEF6F1",
          color: "#1B7F5C",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        §
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#8A968F" }}>
          법 근거 · 요약 보기
        </span>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            color: "#0F2A20",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {law.title}
        </span>
      </span>
      <span style={{ flex: "none", fontSize: 15, color: "#8A968F" }}>›</span>
    </button>
  );
}
