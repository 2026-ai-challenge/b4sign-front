"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { D, caseCounts, ddInfo } from "@/lib/derive";
import { TypeBadge, LawRow, TermButton } from "@/components/ui";

export default function AnalysisPage() {
  return (
    <Suspense>
      <Analysis />
    </Suspense>
  );
}

const ST_LABEL = {
  danger: ["▲ 위험", "#FDE8E4", "#B4231A"],
  warn: ["! 주의", "#FFF1D6", "#7A4E00"],
  safe: ["✓ 좋음", "#E3F3E9", "#14613F"],
  unknown: ["? 확인 불가", "#ECEEEC", "#5A6660"],
};

function Analysis() {
  const router = useRouter();
  const params = useSearchParams();
  const st = params.get("st"); // danger | warn | safe | unknown | null
  const { caseId, tasks, addTaskFromItem, showDiff, setShowDiff } = useApp();

  const cur = D.CASES.find((c) => c.id === caseId);
  const typ = D.TYPES[cur.type];
  const items = D.ANALYSIS[caseId] || [];
  const { counts, overall } = caseCounts(caseId);
  const caseTasks = tasks[caseId] || [];

  const [openSec, setOpenSec] = useState(() =>
    Object.fromEntries(Object.keys(D.SECTION_META).map((k) => [k, true]))
  );

  const sections = typ.sections
    .map((key) => {
      const meta = {
        ...D.SECTION_META[key],
        ...((D.SECTION_OVERRIDE[cur.type] || {})[key] || {}),
      };
      // st 필터가 있으면 해당 판정만, 기한 항목은 전체 보기에서만
      const its = items.filter(
        (i) => i.sec === key && (!st || (!i.deadline && i.st === st))
      );
      const judged = its.filter((i) => !i.deadline);
      const worst = judged.reduce(
        (w, i) => (D.ST[i.st].rank > w.rank ? D.ST[i.st] : w),
        D.ST.safe
      );
      return {
        key,
        ...meta,
        items: its,
        worst: judged.length ? worst : { ...D.ST.unknown, label: "기한", glyph: "◷" },
      };
    })
    .filter((s) => s.items.length);
  const filteredCount = sections.reduce((n, s) => n + s.items.length, 0);

  const isAdded = (id) => caseTasks.some((t) => t.id === "a" + id);
  const hasDocText = (docKey) => docKey && D.DOCTEXT[caseId] && D.DOCTEXT[caseId][docKey];

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 52,
          padding: "0 12px",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#0F2A20",
            padding: "6px 10px",
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: 17, fontWeight: 800 }}>분석 결과</span>
        <span
          style={{ marginLeft: "auto", fontSize: 12, color: "#6E827A", paddingRight: 8 }}
        >
          {cur.analysisDate} 분석
        </span>
      </div>

      <div style={{ padding: "4px 20px 0" }}>
        {/* 종합 카드 */}
        <div
          style={{
            padding: 18,
            borderRadius: 20,
            background: "#fff",
            border: "1px solid #E3E8E3",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                background: overall.bg,
                color: overall.fg,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {overall.glyph} 종합 {overall.label}
            </span>
            <TypeBadge type={cur.type} />
            <span style={{ fontSize: 12, color: "#6E827A" }}>{cur.short}</span>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.55, fontWeight: 600 }}>
            {D.SUMMARY[caseId]}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            {Object.entries(ST_LABEL).map(([k, [label, bg, fg]]) => {
              const on = st === k;
              return (
                <button
                  key={k}
                  onClick={() => router.replace(on ? "/analysis" : `/analysis?st=${k}`)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: bg,
                    color: fg,
                    fontSize: 12,
                    fontWeight: 700,
                    border: on ? `1.5px solid ${fg}` : "1.5px solid transparent",
                    opacity: st && !on ? 0.45 : 1,
                    cursor: "pointer",
                  }}
                >
                  {label} {counts[k]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 필터 배너 */}
        {st && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              padding: "11px 14px",
              borderRadius: 14,
              background: ST_LABEL[st][1],
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: ST_LABEL[st][2] }}>
              {ST_LABEL[st][0]} 항목만 보는 중 · {filteredCount}개
            </span>
            <button
              onClick={() => router.replace("/analysis")}
              style={{
                background: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 700,
                color: ST_LABEL[st][2],
              }}
            >
              전체 보기
            </button>
          </div>
        )}

        {/* 재업로드 diff (전세 케이스, 전체 보기에서만) */}
        {cur.diff && !st && (
          <>
            <button
              onClick={() => setShowDiff(!showDiff)}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 10,
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid #CFE3D8",
                background: "#EEF6F1",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#14613F" }}>
                재업로드 후 변경점 · 새 위험 1 · 해소 1
              </span>
              <span style={{ fontSize: 12, color: "#1B7F5C" }}>
                {showDiff ? "접기" : "보기"}
              </span>
            </button>
            {showDiff && (
              <div
                style={{
                  marginTop: 8,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid #E3E8E3",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <span
                    style={{
                      flex: "none",
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "#FFF1D6",
                      color: "#7A4E00",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  >
                    새로 생김
                  </span>
                  <span>면적 불일치 84.9㎡ ↔ 84.5㎡ (계약서 v2에서 면적 표기 변경)</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span
                    style={{
                      flex: "none",
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "#E3F3E9",
                      color: "#14613F",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  >
                    해소됨
                  </span>
                  <span style={{ color: "#4B6157", textDecoration: "line-through" }}>
                    임대인 주민번호 마스킹 누락 — 계약서 v2에서 수정
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 섹션 아코디언 */}
      <div
        style={{
          padding: "16px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {sections.map((sec) => (
          <div
            key={sec.key}
            style={{
              borderRadius: 20,
              background: "#fff",
              border: "1px solid #E3E8E3",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpenSec((s) => ({ ...s, [sec.key]: !s[sec.key] }))}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                border: "none",
                background: "none",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F2A20" }}>{sec.title}</div>
                <div style={{ marginTop: 2, fontSize: 12, color: "#6E827A" }}>{sec.source}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 9px",
                    borderRadius: 999,
                    background: sec.worst.bg,
                    color: sec.worst.fg,
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  {sec.worst.glyph} {sec.worst.label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#6E827A",
                    transform: openSec[sec.key] ? "rotate(180deg)" : "none",
                    display: "inline-block",
                  }}
                >
                  ▼
                </span>
              </div>
            </button>
            {openSec[sec.key] && (
              <div style={{ borderTop: "1px solid #EEF1EE" }}>
                {sec.items.map((it) => {
                  const st = it.st ? D.ST[it.st] : D.ST.unknown;
                  const dd = it.due ? ddInfo(it.due) : null;
                  return (
                    <div key={it.id} style={{ padding: 16, borderBottom: "1px solid #EEF1EE" }}>
                      {it.deadline ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              flex: "none",
                              padding: "6px 10px",
                              borderRadius: 10,
                              background: dd.bg,
                              color: dd.fg,
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {dd.label}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
                              {it.title}
                            </div>
                            <div style={{ fontSize: 12, color: "#6E827A", marginTop: 2 }}>
                              {it.evidence} · 기한 {it.due}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span
                              style={{
                                flex: "none",
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: st.bg,
                                color: st.fg,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                                fontWeight: 900,
                              }}
                            >
                              {st.glyph}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: st.fg }}>
                                {st.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 700,
                                  lineHeight: 1.35,
                                  color: "#0F2A20",
                                }}
                              >
                                {it.title}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: 12,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              fontSize: 13,
                              lineHeight: 1.5,
                              color: "#4B6157",
                            }}
                          >
                            <Row label="근거" bg="#EEF6F1" fg="#1B7F5C">
                              {it.evidence}
                            </Row>
                            {it.compare && (
                              <Row label="비교" bg="#EEF6F1" fg="#1B7F5C">
                                {it.compare}
                              </Row>
                            )}
                            {it.reason && (
                              <Row label="못 본 이유" bg="#ECEEEC" fg="#5A6660">
                                {it.reason}
                              </Row>
                            )}
                          </div>
                          <p
                            style={{
                              margin: "12px 0 0",
                              fontSize: 14,
                              lineHeight: 1.6,
                              color: "#2E463C",
                            }}
                          >
                            {it.why}
                            {it.term && (
                              <>
                                {" "}
                                <TermButton termKey={it.term}>
                                  {D.TERMS[it.term].word}
                                </TermButton>
                                {it.whyTail}
                              </>
                            )}
                          </p>
                          {it.howTo && (
                            <div
                              style={{
                                marginTop: 10,
                                padding: "10px 12px",
                                borderRadius: 10,
                                background: "#F4F6F4",
                                fontSize: 13,
                                lineHeight: 1.5,
                                color: "#2E463C",
                              }}
                            >
                              <b>직접 확인하는 법</b> · {it.howTo}
                            </div>
                          )}
                          {it.law && <LawRow lawKey={it.law} />}
                        </>
                      )}
                      {it.deadline && it.law && <LawRow lawKey={it.law} />}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 14,
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {hasDocText(it.doc) && (
                            <button
                              onClick={() =>
                                router.push(`/documents/${it.doc}?pin=${it.id}`)
                              }
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#4B6157",
                              }}
                            >
                              서류에서 보기 →
                            </button>
                          )}
                        </div>
                        {it.task &&
                          (isAdded(it.id) ? (
                            <span
                              style={{
                                flex: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                height: 38,
                                padding: "0 14px",
                                borderRadius: 999,
                                background: "#E3F3E9",
                                color: "#14613F",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              ✓ 할 일에 있음
                            </span>
                          ) : (
                            <button
                              onClick={() => addTaskFromItem(caseId, it)}
                              style={{
                                flex: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                height: 38,
                                padding: "0 14px",
                                borderRadius: 999,
                                border: "none",
                                background: "#1B7F5C",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              + 할 일에 추가
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          padding: "10px 20px",
          background: "rgba(250,250,247,.92)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #E3E8E3",
          fontSize: 11.5,
          lineHeight: 1.5,
          color: "#6E827A",
          textAlign: "center",
        }}
      >
        법률 자문이 아니며, 최종 판단은 법무사·변호사 등 전문가와 상의하세요.
      </div>
    </>
  );
}

function Row({ label, bg, fg, children }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span
        style={{
          flex: "none",
          padding: "2px 8px",
          borderRadius: 6,
          background: bg,
          color: fg,
          fontWeight: 700,
          fontSize: 11,
          height: "fit-content",
        }}
      >
        {label}
      </span>
      <span>{children}</span>
    </div>
  );
}
