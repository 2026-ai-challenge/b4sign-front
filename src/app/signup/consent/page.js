"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { D } from "@/lib/derive";

export default function Consent() {
  const router = useRouter();
  const { setLoggedIn, setConsented } = useApp();
  const [checks, setChecks] = useState({
    tos: false,
    privacy: false,
    age: false,
    notify: false,
    marketing: false,
  });
  const [modal, setModal] = useState(null); // CONSENT_ITEMS key

  const all = Object.values(checks).every(Boolean);
  const missing = ["tos", "privacy", "age"].filter((k) => !checks[k]).length;
  const blocked = missing > 0;
  const cm = D.CONSENT_ITEMS.find((c) => c.key === modal);

  const checkbox = (on) => ({
    flex: "none",
    width: 24,
    height: 24,
    borderRadius: 8,
    border: `2px solid ${on ? "#1B7F5C" : "#C9D2CC"}`,
    background: on ? "#1B7F5C" : "#fff",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 900,
    padding: 0,
  });

  return (
    <>
      <div
        style={{
          padding: "20px 20px calc(32px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1B7F5C" }}>마지막 단계</div>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-.02em",
            lineHeight: 1.3,
          }}
        >
          서비스 이용에
          <br />
          동의해 주세요
        </h1>

        <button
          onClick={() =>
            setChecks(Object.fromEntries(Object.keys(checks).map((k) => [k, !all])))
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 24,
            padding: 14,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #E3E8E3",
            textAlign: "left",
            width: "100%",
          }}
        >
          <span style={checkbox(all)}>{all ? "✓" : ""}</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>전체 동의</span>
        </button>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
          {D.CONSENT_ITEMS.map((c) => (
            <div
              key={c.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 14,
                borderBottom: "1px solid #EEF1EE",
              }}
            >
              <button
                onClick={() => setChecks((s) => ({ ...s, [c.key]: !s[c.key] }))}
                style={checkbox(checks[c.key])}
              >
                {checks[c.key] ? "✓" : ""}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    <span
                      style={{
                        color: c.req === "[필수]" ? "#1B7F5C" : "#8A968F",
                        fontWeight: 700,
                      }}
                    >
                      {c.req}
                    </span>{" "}
                    {c.label}
                  </span>
                  <button
                    onClick={() => setModal(c.key)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 12,
                      color: "#6E827A",
                      textDecoration: "underline",
                      padding: 0,
                      flex: "none",
                    }}
                  >
                    보기
                  </button>
                </div>
                {c.note && (
                  <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.55, color: "#4B6157" }}>
                    {c.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        {blocked && (
          <div style={{ marginTop: 16, fontSize: 12.5, color: "#7A4E00", textAlign: "center" }}>
            필수 항목 {missing}개에 동의해야 시작할 수 있어요
          </div>
        )}
        <button
          onClick={() => {
            if (blocked) return;
            setConsented(true);
            setLoggedIn(true);
            router.push("/cases/new");
          }}
          disabled={blocked}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            height: 52,
            marginTop: 10,
            background: blocked ? "#B9C2BC" : "#1B7F5C",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 16,
            cursor: blocked ? "default" : "pointer",
          }}
        >
          동의하고 시작하기
        </button>
      </div>

      {/* 약관 전문 바텀시트 */}
      {cm && (
        <div
          onClick={() => setModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,42,32,.45)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 40,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 430,
              maxHeight: "70%",
              overflow: "auto",
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              padding: "20px 20px 32px",
              animation: "sheetUp .22s ease",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: "#DDE3DF",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ fontSize: 17, fontWeight: 800 }}>{cm.title}</div>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 13.5,
                lineHeight: 1.7,
                color: "#2E463C",
                whiteSpace: "pre-line",
              }}
            >
              {cm.body}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
