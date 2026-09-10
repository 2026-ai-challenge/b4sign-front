"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { D, ddInfo, balanceWord, resolveTaskDue, phaseAnchor } from "@/lib/derive";
import { TypeBadge } from "@/components/ui";
import { Collapse } from "@/components/fields";

export default function Tasks() {
  const router = useRouter();
  const { caseId, tasks, toggleTask, toggleRemind } = useApp();

  const cur = D.CASES.find((c) => c.id === caseId);
  const typ = D.TYPES[cur.type];
  const caseTasks = tasks[caseId] || [];
  const doneCount = caseTasks.filter((t) => t.done).length;
  const pct = Math.round((doneCount / Math.max(1, caseTasks.length)) * 100);

  const [openPhase, setOpenPhase] = useState({ [cur.phase]: true });
  const [detailId, setDetailId] = useState(null);
  const detail = caseTasks.find((t) => t.id === detailId);

  // 한 단계의 할 일이 모두 끝나면 다음 단계를 부드럽게 연다
  const prevDoneRef = useRef(null);
  useEffect(() => {
    const doneByPhase = typ.phases.map((_, i) => {
      const ts = caseTasks.filter((t) => t.phase === i);
      return ts.length > 0 && ts.every((t) => t.done);
    });
    const prev = prevDoneRef.current;
    prevDoneRef.current = doneByPhase;
    if (!prev) return;
    doneByPhase.forEach((done, i) => {
      if (done && !prev[i] && i + 1 < typ.phases.length) {
        setTimeout(() => setOpenPhase((s) => ({ ...s, [i + 1]: true })), 350);
      }
    });
  }, [caseTasks, typ.phases]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 52,
          padding: "0 20px",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800 }}>해야 할 일</span>
        <button
          onClick={() => router.push("/checklist")}
          style={{
            background: "none",
            border: "1px solid #CFE3D8",
            borderRadius: 999,
            padding: "6px 12px",
            fontSize: 12.5,
            color: "#1B7F5C",
            fontWeight: 700,
          }}
        >
          필수 특약
        </button>
      </div>

      <div style={{ padding: "4px 20px 32px" }}>
        {/* 진행률 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #E3E8E3",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#4B6157",
            }}
          >
            <TypeBadge type={cur.type} size="sm" />
            전체 진행률
          </span>
          <span style={{ fontSize: 14, fontWeight: 800 }}>
            {doneCount} / {caseTasks.length}
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: "#E6EBE7",
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: "#1B7F5C",
              borderRadius: 3,
              transition: "width .3s",
            }}
          />
        </div>

        {/* 단계 스텝퍼 */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column" }}>
          {typ.phases.map((label, i) => {
            const ts = caseTasks.filter((t) => t.phase === i);
            const dn = ts.filter((t) => t.done).length;
            const isCur = i === cur.phase;
            const past = i < cur.phase;
            const allDone = ts.length > 0 && dn === ts.length;
            const active = isCur || past || allDone;
            const open = !!openPhase[i];
            return (
              <div key={label} style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: "none",
                    width: 24,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: active ? "#1B7F5C" : "#fff",
                      color: active ? "#fff" : "#8A968F",
                      border: `2px solid ${active ? "#1B7F5C" : "#C9D2CC"}`,
                      fontSize: 11,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background .35s, border-color .35s, color .35s",
                    }}
                  >
                    {past || allDone ? "✓" : i + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      width: 2,
                      background: past || allDone ? "#1B7F5C" : "#E3E8E3",
                      margin: "4px 0",
                      transition: "background .35s",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: 20 }}>
                  <button
                    onClick={() => setOpenPhase((s) => ({ ...s, [i]: !s[i] }))}
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      padding: "2px 0",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: 16,
                          fontWeight: 800,
                          color: isCur ? "#0F2A20" : "#6E827A",
                        }}
                      >
                        {label}
                      </span>
                      {(() => {
                        const anchor = phaseAnchor(cur.type, i, cur);
                        if (!anchor) return null;
                        const dd = ddInfo(anchor.date);
                        return (
                          <span
                            style={{
                              display: "block",
                              marginTop: 2,
                              fontSize: 11.5,
                              color: allDone ? "#8A968F" : dd && dd.fg === "#B4231A" ? "#B4231A" : "#6E827A",
                              fontWeight: 600,
                            }}
                          >
                            늦어도 {anchor.date.slice(5).replace("-", "/")}까지 ({anchor.word} 기준
                            {dd ? ` · ${dd.label}` : ""})
                          </span>
                        );
                      })()}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: allDone ? "#14613F" : "#6E827A",
                        fontWeight: allDone ? 700 : 400,
                      }}
                    >
                      {dn}/{ts.length}
                      {allDone ? " · 완료 ✓" : isCur ? " · 진행 중" : ""}
                    </span>
                  </button>
                  <Collapse open={open}>
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {ts.map((t) => {
                        const resolved = resolveTaskDue(t, cur);
                        const dd = resolved.due ? ddInfo(resolved.due) : null;
                        return (
                          <div
                            key={t.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "12px 14px",
                              borderRadius: 14,
                              background: "#fff",
                              border: "1px solid #E3E8E3",
                            }}
                          >
                            <button
                              onClick={() => toggleTask(caseId, t.id)}
                              style={{
                                flex: "none",
                                width: 22,
                                height: 22,
                                borderRadius: 7,
                                border: `2px solid ${t.done ? "#1B7F5C" : "#C9D2CC"}`,
                                background: t.done ? "#1B7F5C" : "#fff",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 900,
                                padding: 0,
                                marginTop: 1,
                              }}
                            >
                              {t.done ? "✓" : ""}
                            </button>
                            <button
                              onClick={() => setDetailId(t.id)}
                              style={{
                                flex: 1,
                                minWidth: 0,
                                background: "none",
                                border: "none",
                                padding: 0,
                                textAlign: "left",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  lineHeight: 1.4,
                                  color: t.done ? "#8A968F" : "#0F2A20",
                                  textDecoration: t.done ? "line-through" : "none",
                                }}
                              >
                                {t.title}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  flexWrap: "wrap",
                                  marginTop: 6,
                                  alignItems: "center",
                                }}
                              >
                                <span
                                  style={{
                                    padding: "2px 7px",
                                    borderRadius: 5,
                                    background: t.source === "auto" ? "#EEF6F1" : "#F1F3F1",
                                    color: t.source === "auto" ? "#14613F" : "#5A6660",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {t.source === "auto" ? "분석에서 생성" : "기본 항목"}
                                </span>
                                {dd && (
                                  <span
                                    style={{
                                      padding: "2px 7px",
                                      borderRadius: 5,
                                      background: resolved.recommended ? "#FFF6E3" : dd.bg,
                                      color: resolved.recommended ? "#8A6100" : dd.fg,
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {resolved.recommended ? "권장 " : ""}
                                    {dd.label} · {resolved.due.slice(5).replace("-", "/")}까지
                                  </span>
                                )}
                                {t.remind && (
                                  <span style={{ fontSize: 11, color: "#6E827A" }}>알림 켬</span>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </Collapse>
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            background: "#F4F6F4",
            fontSize: 12.5,
            lineHeight: 1.55,
            color: "#4B6157",
          }}
        >
          D-day 기준: 계약일 {cur.contractDate} · {balanceWord(cur.type)} {cur.balanceDate}
        </div>
      </div>

      {/* 할 일 상세 바텀시트 */}
      {detail && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailId(null);
          }}
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
            style={{
              width: "100%",
              maxWidth: 430,
              maxHeight: "85%",
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
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 5,
                  background: detail.source === "auto" ? "#EEF6F1" : "#F1F3F1",
                  color: detail.source === "auto" ? "#14613F" : "#5A6660",
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                {detail.source === "auto" ? "분석에서 생성" : "기본 항목"}
              </span>
              {(() => {
                const r = resolveTaskDue(detail, cur);
                if (!r.due) return null;
                const dd = ddInfo(r.due);
                return (
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 5,
                      background: r.recommended ? "#FFF6E3" : dd.bg,
                      color: r.recommended ? "#8A6100" : dd.fg,
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    {r.recommended ? `권장 · ${r.label} · ` : `${dd.label} · `}
                    {r.due}
                  </span>
                );
              })()}
            </div>
            <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>
              {detail.title}
            </div>
            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "10px 14px",
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              <span style={{ color: "#6E827A", fontWeight: 600 }}>왜</span>
              <span>{detail.why}</span>
              <span style={{ color: "#6E827A", fontWeight: 600 }}>어디서</span>
              <span>{detail.where}</span>
              <span style={{ color: "#6E827A", fontWeight: 600 }}>준비물</span>
              <span>{detail.items}</span>
              {detail.doc && D.DOCS[detail.doc] && (
                <>
                  <span style={{ color: "#6E827A", fontWeight: 600 }}>관련 서류</span>
                  <button
                    onClick={() => router.push(`/documents/${detail.doc}`)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                      textAlign: "left",
                      color: "#1B7F5C",
                      fontWeight: 700,
                    }}
                  >
                    {D.DOCS[detail.doc].name} 보기 →
                  </button>
                </>
              )}
            </div>
            {/* 공식 사이트 바로가기 (새 탭) */}
            {(D.TASK_LINKS?.[detail.id] || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6E827A" }}>바로가기</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {D.TASK_LINKS[detail.id].map((l) => (
                    <a
                      key={l.url + l.label}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 38,
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid #CFE3D8",
                        background: "#EEF6F1",
                        color: "#14613F",
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {l.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
            {detail.due && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 18,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#F4F6F4",
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>기한 하루 전 알림</span>
                <button
                  onClick={() => toggleRemind(caseId, detail.id)}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    border: "none",
                    background: detail.remind ? "#1B7F5C" : "#C9D2CC",
                    position: "relative",
                    padding: 0,
                    transition: "background .2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: detail.remind ? 23 : 3,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      transition: "left .2s",
                    }}
                  />
                </button>
              </div>
            )}
            <button
              onClick={() => toggleTask(caseId, detail.id)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 50,
                marginTop: 16,
                background: detail.done ? "#fff" : "#1B7F5C",
                color: detail.done ? "#0F2A20" : "#fff",
                border: `1px solid ${detail.done ? "#DDE3DF" : "#1B7F5C"}`,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {detail.done ? "완료 취소" : "완료했어요"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
