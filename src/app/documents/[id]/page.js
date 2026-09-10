"use client";

import { Suspense, use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { D, lawShort } from "@/lib/derive";
import { LawButton, TermButton } from "@/components/ui";

export default function ViewerPage({ params }) {
  const { id } = use(params);
  return (
    <Suspense>
      <Viewer docKey={id} />
    </Suspense>
  );
}

function Viewer({ docKey }) {
  const router = useRouter();
  const search = useSearchParams();
  const { caseId, docs, addTaskFromItem, tasks } = useApp();

  const initialPin = search.get("pin") ? Number(search.get("pin")) : null;
  const [pin, setPin] = useState(initialPin);
  const [filter, setFilter] = useState("all");

  const doc = D.DOCS[docKey];
  const text = D.DOCTEXT[caseId] && D.DOCTEXT[caseId][docKey];
  // 필터 칩 개수는 이 서류의 판정만, 줄 하이라이트는 케이스 전체 판정에서 찾는다
  // (면적 불일치처럼 두 서류에 걸친 항목이 있어서)
  const allItems = D.ANALYSIS[caseId] || [];
  const items = allItems.filter((i) => i.doc === docKey);
  const caseTasks = tasks[caseId] || [];

  if (!doc || !text) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>표시할 문서가 없어요</div>
        <button
          onClick={() => router.push("/documents")}
          style={{
            marginTop: 16,
            height: 40,
            padding: "0 20px",
            borderRadius: 999,
            border: "1px solid #CFE3D8",
            background: "#fff",
            color: "#1B7F5C",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          서류 목록으로
        </button>
      </div>
    );
  }

  const vCounts = {};
  items.forEach((i) => (vCounts[i.st] = (vCounts[i.st] || 0) + 1));
  const issued = (docs[caseId] && docs[caseId][docKey] && docs[caseId][docKey].issued) || "—";
  const verify =
    docKey === "building"
      ? "국토부 API 교차 검증"
      : docKey === "registry"
        ? "등기 항목 검증 · 진위 확인 제외"
        : "필수 특약 대조";

  const filters = [
    ["all", "전체", "", items.length],
    ...["danger", "warn", "safe", "unknown"]
      .filter((k) => vCounts[k])
      .map((k) => [k, D.ST[k].label, D.ST[k].glyph, vCounts[k]]),
  ];

  const pinItem = allItems.find((i) => i.id === pin);
  const added = pinItem && caseTasks.some((t) => t.id === "a" + pinItem.id);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#1A2420",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        zIndex: 20,
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 52,
          padding: "0 12px 0 20px",
          flex: "none",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{doc.name}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)" }}>
            발급 {issued} · {verify}
          </div>
        </div>
        <button
          onClick={() => router.push("/documents")}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,.15)",
            color: "#fff",
            fontSize: 16,
            flex: "none",
          }}
        >
          ×
        </button>
      </div>

      {/* 필터 칩 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 20px 10px",
          flex: "none",
          overflowX: "auto",
        }}
      >
        {filters.map(([k, label, glyph, n]) => {
          const on = filter === k;
          const st = D.ST[k];
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                flex: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 30,
                padding: "0 11px",
                borderRadius: 999,
                border: `1px solid ${on ? "transparent" : "rgba(255,255,255,.2)"}`,
                background: on ? (st ? st.fg : "#fff") : "rgba(255,255,255,.08)",
                color: on ? (st ? "#fff" : "#0F2A20") : "rgba(255,255,255,.8)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {glyph} {label} {n}
            </button>
          );
        })}
      </div>

      {/* 문서 본문 */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 14px 16px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 6,
            color: "#111",
            padding: "22px 16px 28px",
            fontSize: 12,
            lineHeight: 1.7,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontFamily: "'Noto Serif KR','Apple SD Gothic Neo',serif",
          }}
        >
          {text.map((l, idx) => {
            if (typeof l === "string")
              return (
                <div key={idx} style={{ color: "#333", paddingRight: 34 }}>
                  {l}
                </div>
              );
            if (l.h)
              return (
                <div
                  key={idx}
                  style={{
                    marginTop: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: "#222",
                    borderBottom: "1px solid #DDD",
                    paddingBottom: 3,
                  }}
                >
                  {l.h}
                </div>
              );
            const it = allItems.find((i) => i.id === l.item);
            const st = it ? D.ST[it.st] : D.ST.unknown;
            const dim = filter !== "all" && it && it.st !== filter;
            const active = pin === l.item;
            const open = () => setPin(active ? null : l.item);
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  opacity: dim ? 0.38 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, color: "#333" }}>
                  {l.pre}
                  <button
                    onClick={open}
                    style={{
                      background: dim ? "transparent" : st.mark,
                      border: "none",
                      padding: "1px 3px",
                      margin: 0,
                      font: "inherit",
                      color: "#111",
                      borderRadius: 3,
                      boxShadow: active ? `0 0 0 2px ${st.fg}` : "none",
                      textAlign: "left",
                      lineHeight: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {l.mark}
                  </button>
                  {l.post}
                </div>
                <button
                  onClick={open}
                  style={{
                    flex: "none",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: `2px solid ${st.fg}`,
                    background: active ? st.fg : st.bg,
                    color: active ? "#fff" : st.fg,
                    fontSize: 12,
                    fontWeight: 900,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    marginTop: 1,
                  }}
                >
                  {st.glyph}
                </button>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 11.5,
            color: "rgba(255,255,255,.55)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          가상 샘플 문서입니다 · 하이라이트나 오른쪽 버튼을 누르면 설명이 열려요
        </div>
      </div>

      {/* 하단 판정 카드 */}
      {pinItem && (
        <div
          style={{
            flex: "none",
            background: "#fff",
            color: "#0F2A20",
            borderRadius: "20px 20px 0 0",
            padding: "14px 20px 22px",
            boxShadow: "0 -10px 30px rgba(0,0,0,.3)",
            animation: "sheetUp .22s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: D.ST[pinItem.st].bg,
                  color: D.ST[pinItem.st].fg,
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                {D.ST[pinItem.st].glyph} {D.ST[pinItem.st].label}
              </span>
              <span style={{ fontSize: 12, color: "#6E827A" }}>{pinItem.evidence}</span>
            </div>
            <button
              onClick={() => setPin(null)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "#F1F3F1",
                fontSize: 14,
                color: "#4B6157",
                flex: "none",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
            {pinItem.title}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#2E463C" }}>
            {pinItem.why}
            {pinItem.term && (
              <>
                {" "}
                <TermButton termKey={pinItem.term}>{D.TERMS[pinItem.term].word}</TermButton>
                {pinItem.whyTail}
              </>
            )}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              gap: 8,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => router.push("/analysis")}
                style={{
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 999,
                  border: "1px solid #DDE3DF",
                  background: "#fff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#4B6157",
                }}
              >
                분석 결과에서
              </button>
              {pinItem.law && <LawButton lawKey={pinItem.law} short={lawShort(pinItem.law)} />}
            </div>
            {pinItem.task &&
              (added ? (
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#14613F" }}>
                  ✓ 할 일에 있음
                </span>
              ) : (
                <button
                  onClick={() => addTaskFromItem(caseId, pinItem)}
                  style={{
                    height: 34,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "none",
                    background: "#1B7F5C",
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  + 할 일에 추가
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
