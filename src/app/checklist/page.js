"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { D } from "@/lib/derive";
import { Card } from "@/design-system";

const CLST = {
  present: { ...D.ST.safe, label: "있음" },
  missing: { ...D.ST.danger, label: "없음" },
  weak: { ...D.ST.warn, label: "불충분" },
};

export default function Checklist() {
  const router = useRouter();
  const { caseId, toast, apiOn } = useApp();
  const [filter, setFilter] = useState("all"); // all | missing | present

  const cur = D.CASES.find((c) => c.id === caseId);
  const typ = D.TYPES[cur.type];

  // 백엔드 특약 목록 — 계약서 실판정이 있으면 source:"live"로 present/missing/weak가 실제 판정값
  const [serverList, setServerList] = useState(null);
  const [clauseSource, setClauseSource] = useState(null);
  useEffect(() => {
    setServerList(null);
    if (!apiOn) return;
    let off = false;
    api(`/cases/${caseId}/clauses`)
      .then((d) => {
        if (off || !Array.isArray(d?.clauses)) return;
        setServerList(d.clauses);
        setClauseSource(d.source || null);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [apiOn, caseId]);

  const list = serverList ?? D.CLAUSES[cur.type] ?? [];
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
          style={{ background: "none", border: "none", color: "#17211E", padding: "6px 10px", display: "flex" }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800 }}>{typ.label} 필수 특약</span>
        {clauseSource === "live" && (
          <span
            style={{
              marginLeft: "auto",
              marginRight: 8,
              padding: "2px 8px",
              borderRadius: 6,
              background: "#E3F3E9",
              color: "#14613F",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            계약서 실판정
          </span>
        )}
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
                border: `1px solid ${on ? "#17211E" : "#DDE3DF"}`,
                background: on ? "#17211E" : "#fff",
                color: on ? "#fff" : "#17211E",
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
          <Card radius={20} style={{ padding: "32px 20px", textAlign: "center", fontSize: 14, color: "#4B6157" }}>
            이 조건에 해당하는 특약이 없어요.
          </Card>
        )}
        {filtered.map((c) => {
          const st = CLST[c.st];
          return (
            <Card key={c.id} radius={18} style={{ padding: 16 }}>
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
                    padding: "4px 9px",
                    borderRadius: 999,
                    background: st.bg,
                    color: st.fg,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {st.label}
                </span>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "#4B6157" }}>
                {c.why}
              </p>
              {c.note && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#7A4E00", lineHeight: 1.5 }}>
                  {c.note}
                </div>
              )}
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #EEF1EE",
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
                      color: "#16A36A",
                      fontWeight: 700,
                    }}
                  >
                    복사
                  </button>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: "#17211E" }}>
                  {c.example}
                </p>
              </div>
              {c.st !== "present" && c.request && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid #EEF1EE",
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
                        color: "#16A36A",
                        fontWeight: 700,
                      }}
                    >
                      복사
                    </button>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.6, color: "#17211E" }}>
                    {c.request}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
