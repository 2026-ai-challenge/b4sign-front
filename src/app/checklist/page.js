"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { D } from "@/lib/derive";

const CLST = {
  present: { ...D.ST.safe, label: "있음" },
  missing: { ...D.ST.danger, label: "없음" },
  weak: { ...D.ST.warn, label: "불충분" },
};

export default function Checklist() {
  const router = useRouter();
  const { caseId, toast } = useApp();
  const [filter, setFilter] = useState("all"); // all | missing | present

  const cur = D.CASES.find((c) => c.id === caseId);
  const typ = D.TYPES[cur.type];
  const list = D.CLAUSES[cur.type] || [];
  const filtered = list.filter(
    (c) =>
      filter === "all" || (filter === "missing" ? c.st !== "present" : c.st === "present")
  );

  const copy = (text, msg) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {}
    toast(msg);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 52,
          padding: "0 12px",
          flex: "none",
        }}
      >
        <button
          onClick={() => router.push("/tasks")}
          style={{ background: "none", border: "none", fontSize: 22, color: "#0F2A20", padding: "6px 10px" }}
        >
          ‹
        </button>
        <span style={{ fontSize: 17, fontWeight: 800 }}>{typ.label} 필수 특약</span>
      </div>

      <div style={{ padding: "4px 20px 0", display: "flex", gap: 6, flex: "none" }}>
        {[
          ["all", "전체"],
          ["missing", "누락·불충분"],
          ["present", "있음"],
        ].map(([k, label]) => {
          const on = filter === k;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${on ? "#0F2A20" : "#DDE3DF"}`,
                background: on ? "#0F2A20" : "#fff",
                color: on ? "#fff" : "#0F2A20",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: "14px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              padding: "32px 20px",
              borderRadius: 20,
              background: "#fff",
              border: "1px solid #E3E8E3",
              textAlign: "center",
              fontSize: 14,
              color: "#4B6157",
            }}
          >
            이 조건에 해당하는 특약이 없어요.
          </div>
        )}
        {filtered.map((c) => {
          const st = CLST[c.st];
          return (
            <div
              key={c.id}
              style={{
                padding: 16,
                borderRadius: 18,
                background: "#fff",
                border: "1px solid #E3E8E3",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{c.title}</div>
                <span
                  style={{
                    flex: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 9px",
                    borderRadius: 999,
                    background: st.bg,
                    color: st.fg,
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  {st.glyph} {st.label}
                </span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "#4B6157" }}>
                {c.why}
              </p>
              {c.note && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: "#7A4E00", lineHeight: 1.5 }}>
                  {c.note}
                </div>
              )}
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: "#F4F6F4",
                  border: "1px dashed #CFD6D2",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6E827A" }}>조항 예시</span>
                  <button
                    onClick={() => copy(c.example, "조항 문구를 복사했어요")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: 12,
                      color: "#1B7F5C",
                      fontWeight: 700,
                    }}
                  >
                    복사
                  </button>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: "#0F2A20" }}>
                  {c.example}
                </p>
              </div>
              {c.st !== "present" && c.request && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 12,
                    background: "#EEF6F1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#14613F" }}>
                      중개인·상대방에게 요청하기
                    </span>
                    <button
                      onClick={() => copy(c.request, "요청 문구를 복사했어요")}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontSize: 12,
                        color: "#1B7F5C",
                        fontWeight: 700,
                      }}
                    >
                      복사
                    </button>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: "#0F2A20" }}>
                    {c.request}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
