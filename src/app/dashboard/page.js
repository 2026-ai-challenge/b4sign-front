"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import {
  D,
  maskAddr,
  caseCounts,
  balanceWord,
  buildDocList,
  ddInfo,
  taskProgress,
  resolveTaskDue,
  brokerageFee,
  parseKoreanAmount,
  fmtKrw,
} from "@/lib/derive";
import { TypeBadge, StatusChip } from "@/components/ui";
import { Collapse } from "@/components/fields";

export default function Dashboard() {
  const router = useRouter();
  const { caseId, setCaseId, docs, tasks, toggleTask, toast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const cur = D.CASES.find((c) => c.id === caseId);
  const typ = D.TYPES[cur.type];
  // 중개보수 계산기 (케이스 금액으로 프리필)
  const [feeOpen, setFeeOpen] = useState(false);
  const amountParts = (cur.amount || "").split("월");
  const [feeAmount, setFeeAmount] = useState(() => parseKoreanAmount(amountParts[0]));
  const [feeMonthly, setFeeMonthly] = useState(() =>
    cur.type === "wolse" ? parseKoreanAmount(amountParts[1] || "") : 0
  );
  const { counts, overall } = caseCounts(caseId);
  const caseDocs = docs[caseId] || {};
  const docList = buildDocList(caseId, caseDocs);
  const caseTasks = tasks[caseId] || [];
  const hasAnyDoc = Object.values(caseDocs).some((d) => d.status !== "missing");

  // 진행 단계는 할 일 완료 상황에서 파생 — 단계를 마치면 바가 채워지고 다음 단계로 넘어간다
  const progress = taskProgress(caseTasks, typ.phases.length);
  const next =
    caseTasks.filter((t) => !t.done && t.phase === progress.current)[0] ||
    caseTasks.filter((t) => !t.done)[0];
  const nextDd = next && next.due ? ddInfo(next.due) : null;

  return (
    <>
      {/* 헤더: 케이스 전환 메뉴 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 52,
          padding: "0 20px",
        }}
      >
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 16,
            fontWeight: 800,
            color: "#0F2A20",
            maxWidth: 280,
          }}
        >
          <TypeBadge type={cur.type} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cur.short}
          </span>
          <span style={{ fontSize: 11, color: "#6E827A" }}>▼</span>
        </button>
        <button
          onClick={() => router.push("/me")}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#1B7F5C",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          민
        </button>
      </div>

      {/* 케이스 전환 드롭다운 — 부드럽게 열리고 닫힘 */}
      <Collapse open={menuOpen}>
        <div
          style={{
            margin: "4px 20px 0",
            padding: 6,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #E3E8E3",
            boxShadow: "0 8px 24px rgba(15,42,32,.12)",
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "none" : "translateY(-6px)",
            transition: "opacity .3s ease, transform .3s ease",
          }}
        >
          {D.CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCaseId(c.id);
                setMenuOpen(false);
              }}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: c.id === caseId ? "#EEF6F1" : "#fff",
                fontSize: 13.5,
                fontWeight: 600,
                color: "#0F2A20",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TypeBadge type={c.type} size="sm" />
                {c.short}
              </span>
              <span style={{ fontSize: 12, color: "#6E827A" }}>{c.amount}</span>
            </button>
          ))}
          <button
            onClick={() => router.push("/cases/new")}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 8,
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              color: "#0F2A20",
            }}
          >
            + 새 케이스 만들기
          </button>
        </div>
      </Collapse>

      {!hasAnyDoc ? (
        // 빈 상태
        <div style={{ padding: "8px 20px 32px" }}>
          <div
            style={{
              padding: "24px 20px",
              borderRadius: 20,
              background: "linear-gradient(#EEF6F1,#fff)",
              border: "1px solid #DCE9E1",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#1B7F5C",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              +
            </div>
            <div style={{ marginTop: 14, fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>
              첫 서류를 올려주세요
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "#4B6157" }}>
              등기부등본부터 올리면 소유자·담보 위험을 먼저 볼 수 있어요.
            </p>
            <button
              onClick={() => router.push("/documents?upload=registry")}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 50,
                marginTop: 18,
                background: "#1B7F5C",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              등기부등본 올리기
            </button>
          </div>
          <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: "#6E827A" }}>
            {typ.label} 추천 순서
          </div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {docList.map((d, i) => (
              <div
                key={d.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid #E3E8E3",
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#EEF6F1",
                    color: "#1B7F5C",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: "#6E827A" }}>{d.where}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6E827A" }}>{d.req}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "8px 20px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* 케이스 카드 */}
          <div
            style={{
              padding: 18,
              borderRadius: 20,
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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
                  {maskAddr(cur.addr)}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#4B6157" }}>
                  {cur.housing} · {cur.amount} · {balanceWord(cur.type)} {cur.balanceDate}
                </div>
              </div>
              <span
                style={{
                  flex: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: overall.bg,
                  color: overall.fg,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {overall.glyph} {overall.label}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${typ.phases.length},1fr)`,
                gap: 4,
                marginTop: 16,
              }}
            >
              {typ.phases.map((label, i) => {
                const p = progress.perPhase[i];
                const isCur = !progress.allDone && i === progress.current;
                return (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* 단계 바: 해당 단계 할 일 완료율만큼 채워진다 */}
                    <span
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: "#E6EBE7",
                        overflow: "hidden",
                        display: "block",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          height: "100%",
                          width: `${p.pct}%`,
                          background: "#1B7F5C",
                          borderRadius: 2,
                          transition: "width .4s ease",
                        }}
                      />
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: isCur || (progress.allDone && i === typ.phases.length - 1) ? 800 : 500,
                        color:
                          p.pct === 100
                            ? "#14613F"
                            : isCur
                              ? "#0F2A20"
                              : "#8A968F",
                      }}
                    >
                      {p.pct === 100 ? "✓ " : ""}
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 지금 해야 할 일 / 전체 완료 축하 */}
          {progress.allDone ? (
            <div style={{ padding: 20, borderRadius: 20, background: "#0F2A20", color: "#fff" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9BD3B9" }}>
                모든 할 일 완료
              </span>
              <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, lineHeight: 1.35 }}>
                축하드려요, 전부 마쳤어요! 🎉
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,.75)",
                }}
              >
                입주는 잘 하셨나요? 거주 중에도 등기부등본은{" "}
                <b style={{ color: "#9BD3B9" }}>3개월 주기</b>로 계속 확인하는 게 안전해요.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button
                  onClick={() => router.push("/documents/registry")}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    border: "none",
                    background: "#fff",
                    color: "#0F2A20",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  등기부 확인하기
                </button>
                <button
                  onClick={() => router.push("/tasks")}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.3)",
                    background: "none",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  할 일 돌아보기
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, borderRadius: 20, background: "#0F2A20", color: "#fff" }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "#9BD3B9" }}>
                  지금 해야 할 일
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>
                  {next
                    ? next.due
                      ? `${nextDd.label} · ${next.due.slice(5).replace("-", "/")}`
                      : "기한 없음"
                    : ""}
                </span>
              </div>
              <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, lineHeight: 1.35 }}>
                {next ? next.title : "이 단계 할 일을 모두 마쳤어요"}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,.72)",
                }}
              >
                {next
                  ? `${next.where} · ${next.source === "auto" ? "분석 결과에서 생성" : "기본 항목"}`
                  : "다음 단계로 넘어가세요"}
              </div>
              {/* 이 단계에서 해야 할 것들 요약 — 다음 항목 외 나머지도 한눈에 */}
              {(() => {
                const phaseTasks = caseTasks.filter((t) => t.phase === progress.current);
                if (phaseTasks.length <= 1) return null;
                return (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid rgba(255,255,255,.12)",
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9BD3B9" }}>
                      이 단계({typ.phases[progress.current]})에서 할 일 ·{" "}
                      {phaseTasks.filter((t) => t.done).length}/{phaseTasks.length}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {phaseTasks.map((t) => {
                        const r = resolveTaskDue(t, cur);
                        const dd = r.due ? ddInfo(r.due) : null;
                        return (
                          <div
                            key={t.id}
                            style={{ display: "flex", alignItems: "center", gap: 8 }}
                          >
                            <span
                              style={{
                                flex: "none",
                                width: 15,
                                height: 15,
                                borderRadius: 5,
                                border: `1.5px solid ${t.done ? "#9BD3B9" : "rgba(255,255,255,.4)"}`,
                                background: t.done ? "#9BD3B9" : "transparent",
                                color: "#0F2A20",
                                fontSize: 10,
                                fontWeight: 900,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {t.done ? "✓" : ""}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                fontSize: 12.5,
                                lineHeight: 1.4,
                                color: t.done
                                  ? "rgba(255,255,255,.45)"
                                  : "rgba(255,255,255,.88)",
                                textDecoration: t.done ? "line-through" : "none",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t.title}
                            </span>
                            {!t.done && dd && (
                              <span
                                style={{
                                  flex: "none",
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: dd.fg === "#B4231A" ? "#FFB4AC" : "#9BD3B9",
                                }}
                              >
                                {dd.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button
                  onClick={() => {
                    if (next) {
                      toggleTask(caseId, next.id);
                      toast("완료! 다음 할 일로 넘어가요");
                    }
                  }}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    border: "none",
                    background: "#fff",
                    color: "#0F2A20",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  완료했어요
                </button>
                <button
                  onClick={() => router.push("/tasks")}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.3)",
                    background: "none",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  자세히
                </button>
              </div>
            </div>
          )}

          {/* 판정 개수 — 타일을 누르면 해당 판정만 모아 보기 */}
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 8,
              }}
            >
              {[
                ["danger", "▲ 위험", "#FDE8E4", "#B4231A"],
                ["warn", "! 주의", "#FFF1D6", "#7A4E00"],
                ["safe", "✓ 좋음", "#E3F3E9", "#14613F"],
                ["unknown", "? 미확인", "#ECEEEC", "#5A6660"],
              ].map(([k, label, bg, fg]) => (
                <button
                  key={k}
                  onClick={() => router.push(`/analysis?st=${k}`)}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 16,
                    background: bg,
                    border: "none",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 800, color: fg }}>{counts[k]}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: fg }}>{label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => router.push("/analysis")}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                marginTop: 8,
                borderRadius: 14,
                border: "1px solid #CFE3D8",
                background: "#fff",
                color: "#1B7F5C",
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              분석 결과 전체 보기 →
            </button>
          </div>

          {/* 서류 */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#6E827A" }}>서류</span>
              <button
                onClick={() => router.push("/documents")}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 12.5,
                  color: "#1B7F5C",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                전체 보기 →
              </button>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {docList.map((d) => (
                <button
                  key={d.key}
                  onClick={() =>
                    d.has
                      ? router.push(`/documents/${d.key}`)
                      : router.push(`/documents?upload=${d.key}`)
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "#fff",
                    border: "1px solid #E3E8E3",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0F2A20" }}>{d.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {d.marks > 0 && (
                      <span style={{ fontSize: 11.5, color: "#6E827A" }}>표시 {d.marks}</span>
                    )}
                    <StatusChip st={{ ...d.st, glyph: "" }}>{d.st.label}</StatusChip>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 도구: 중개보수 계산 · 이사 체크리스트 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => setFeeOpen(true)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                padding: "14px",
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #E3E8E3",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 17 }}>🧮</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A20" }}>
                중개보수 계산
              </span>
              <span style={{ fontSize: 11.5, color: "#6E827A" }}>법정 상한 요율로 미리 계산</span>
            </button>
            <button
              onClick={() => router.push("/moving")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                padding: "14px",
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #E3E8E3",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 17 }}>📦</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F2A20" }}>
                이사 체크리스트
              </span>
              <span style={{ fontSize: 11.5, color: "#6E827A" }}>
                입주 하자 체크 · 퇴거 시 주의
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 중개보수 계산 바텀시트 */}
      {feeOpen && (
        <div
          onClick={() => setFeeOpen(false)}
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
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              padding: "20px 20px calc(28px + env(safe-area-inset-bottom))",
              animation: "sheetUp .22s ease",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: "#DDE3DF",
                margin: "0 auto 14px",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🧮</span>
              <span style={{ fontSize: 17, fontWeight: 800 }}>중개보수 계산</span>
              <TypeBadge type={cur.type} size="sm" />
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6E827A" }}>
                  {cur.type === "maemae" ? "매매가" : "보증금"}
                </div>
                <input
                  value={feeAmount ? feeAmount.toLocaleString() : ""}
                  onChange={(e) => setFeeAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
                  inputMode="numeric"
                  placeholder="원 단위 입력 (예: 200,000,000)"
                  style={{
                    marginTop: 6,
                    height: 46,
                    padding: "0 14px",
                    borderRadius: 12,
                    border: "1px solid #DDE3DF",
                    background: "#fff",
                    fontSize: 15,
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
              {cur.type === "wolse" && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6E827A" }}>월세</div>
                  <input
                    value={feeMonthly ? feeMonthly.toLocaleString() : ""}
                    onChange={(e) =>
                      setFeeMonthly(Number(e.target.value.replace(/\D/g, "")) || 0)
                    }
                    inputMode="numeric"
                    placeholder="원 단위 입력 (예: 650,000)"
                    style={{
                      marginTop: 6,
                      height: 46,
                      padding: "0 14px",
                      borderRadius: 12,
                      border: "1px solid #DDE3DF",
                      background: "#fff",
                      fontSize: 15,
                      outline: "none",
                      width: "100%",
                    }}
                  />
                </div>
              )}
            </div>
            {feeAmount > 0 &&
              (() => {
                const r = brokerageFee(cur.type, feeAmount, feeMonthly);
                return (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "14px 16px",
                      borderRadius: 14,
                      background: "#EEF6F1",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#2E463C",
                      }}
                    >
                      <span>거래금액 {cur.type === "wolse" ? "(보증금+월세 환산)" : ""}</span>
                      <b>{fmtKrw(r.base)}</b>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#2E463C",
                        marginTop: 4,
                      }}
                    >
                      <span>상한 요율</span>
                      <b>
                        {(r.rate * 100).toFixed(1)}%{r.cap ? ` (한도 ${fmtKrw(r.cap)})` : ""}
                      </b>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: "1px solid #CFE3D8",
                      }}
                    >
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>중개보수 상한</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#14613F" }}>
                        {r.fee.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                );
              })()}
            <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.6, color: "#6E827A" }}>
              법정 <b>상한</b>이에요 (부가세 별도) — 실제 보수는 이 범위 안에서 중개인과{" "}
              <b>협의</b>해서 정합니다. 상한 요율은 지자체 조례에 따라 다를 수 있어요 (서울 기준표).
            </p>
          </div>
        </div>
      )}
    </>
  );
}
