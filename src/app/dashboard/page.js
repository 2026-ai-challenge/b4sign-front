"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, CalculatorIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
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
import { TypeBadge, StatusChip, NoCase } from "@/components/ui";
import { Collapse } from "@/components/fields";
import { Button, Card, color } from "@/design-system";

export default function Dashboard() {
  const router = useRouter();
  const { caseId, setCaseId, docs, tasks, toggleTask, toast, apiOn, cases, currentCase, me } = useApp();
  // 공유 데모 계정의 시드 케이스(c1~c3)는 가상 계약이라 실거래 시세와 금액이 맞지 않는다 — 위험 등급 대신 중립 표기.
  // 데모 계정에서 새로 만든 실제 케이스는 해당하지 않는다.
  const isDemoRisk = !!me?.isDemo && D.CASES.some((c) => c.id === caseId);
  const [menuOpen, setMenuOpen] = useState(false);

  // 실데이터: 깡통 위험률(실거래 시세 기반) + 실판정 카운트 — 실패 시 조용히 로컬 유지
  const [risk, setRisk] = useState(null);
  const [liveCounts, setLiveCounts] = useState(null);
  useEffect(() => {
    setRisk(null);
    setLiveCounts(null);
    if (!apiOn) return;
    let off = false;
    api(`/cases/${caseId}/risk`)
      .then((d) => !off && d?.ratio != null && setRisk(d))
      .catch(() => {});
    api(`/cases/${caseId}/analysis`)
      .then((d) => !off && d?.source === "live" && setLiveCounts(d.counts))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [apiOn, caseId]);

  const cur = currentCase;
  const typ = D.TYPES[cur?.type ?? "jeonse"];
  // 중개보수 계산기 (케이스 금액으로 프리필)
  const [feeOpen, setFeeOpen] = useState(false);
  const amountParts = (cur?.amount || "").split("월");
  const [feeAmount, setFeeAmount] = useState(() => parseKoreanAmount(amountParts[0]));
  const [feeMonthly, setFeeMonthly] = useState(() =>
    cur?.type === "wolse" ? parseKoreanAmount(amountParts[1] || "") : 0
  );
  const localCounts = caseCounts(caseId);
  const counts = liveCounts ?? localCounts.counts;
  const overall = liveCounts
    ? liveCounts.danger
      ? D.ST.danger
      : liveCounts.warn
        ? D.ST.warn
        : D.ST.safe
    : localCounts.overall;
  const caseDocs = docs[caseId] || {};
  const docList = buildDocList(cur, caseDocs);
  const caseTasks = tasks[caseId] || [];
  const hasAnyDoc = Object.values(caseDocs).some((d) => d.status !== "missing");

  // 진행 단계는 할 일 완료 상황에서 파생 — 단계를 마치면 바가 채워지고 다음 단계로 넘어간다
  const progress = taskProgress(caseTasks, typ.phases.length);
  const next =
    caseTasks.filter((t) => !t.done && t.phase === progress.current)[0] ||
    caseTasks.filter((t) => !t.done)[0];
  const nextDd = next && next.due ? ddInfo(next.due) : null;

  if (!cur) return <NoCase />;

  return (
    <>
      {/* 헤더: 케이스 전환 메뉴 — 프로필은 하단 MY 탭에 있으므로 여기선 중복 노출하지 않음 */}
      <div
        style={{
          display: "flex",
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
            gap: 6,
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 16,
            fontWeight: 800,
            color: color.ink,
            maxWidth: 280,
          }}
        >
          {/* 컬러 배지 대신 텍스트 — 케이스 목록(드롭다운)에는 계속 TypeBadge로 구분 표시 */}
          <span style={{ fontSize: 13, fontWeight: 700, color: color.textSecondary, flex: "none" }}>
            {typ.label}
          </span>
          <span style={{ color: color.textTertiary, flex: "none" }}>·</span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cur.short}
          </span>
          <ChevronDownIcon style={{ width: 13, height: 13, color: color.textTertiary, flex: "none" }} />
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
          {cases.map((c) => (
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
                fontSize: 14,
                fontWeight: 600,
                color: "#17211E",
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
              fontSize: 14,
              fontWeight: 600,
              color: "#17211E",
            }}
          >
            + 새 케이스 만들기
          </button>
        </div>
      </Collapse>

      {!hasAnyDoc ? (
        // 빈 상태
        <div style={{ padding: "8px 20px 32px" }}>
          <Card
            radius={20}
            style={{
              padding: "24px 20px",
              background: "linear-gradient(#EEF6F1,#fff)",
              border: "1px solid #DCE9E1",
              boxShadow: "none",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#16A36A",
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
            <Button onClick={() => router.push("/documents?upload=registry")} style={{ marginTop: 18 }}>
              등기부등본 올리기
            </Button>
          </Card>
          <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: "#6E827A" }}>
            {typ.label} 추천 순서
          </div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {docList.map((d, i) => (
              <Card
                key={d.key}
                radius={14}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#EEF6F1",
                    color: "#16A36A",
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
              </Card>
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
          <Card radius={20} style={{ padding: 18 }}>
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
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: overall.bg,
                  color: overall.fg,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {overall.label}
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
                          width: "100%",
                          background: "#16A36A",
                          borderRadius: 2,
                          transform: `scaleX(${p.pct / 100})`,
                          transformOrigin: "left",
                          transition: "transform .4s ease",
                        }}
                      />
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: isCur || (progress.allDone && i === typ.phases.length - 1) ? 800 : 500,
                        color:
                          p.pct === 100
                            ? "#14613F"
                            : isCur
                              ? "#17211E"
                              : "#5A6660",
                      }}
                    >
                      {p.pct === 100 ? "✓ " : ""}
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 지금 해야 할 일 / 전체 완료 축하 — 흰 배경 유지, 그린은 액션·상태 포인트에만 */}
          {progress.allDone ? (
            <Card radius={20} style={{ padding: 20, border: `1px solid ${color.borderFaint}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: color.primary }}>
                모든 할 일 완료
              </span>
              <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, lineHeight: 1.35, color: color.ink }}>
                축하드려요, 전부 마쳤어요! 🎉
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: color.textSecondary,
                }}
              >
                입주는 잘 하셨나요? 거주 중에도 등기부등본은{" "}
                <b style={{ color: color.ink }}>3개월 주기</b>로 계속 확인하는 게 안전해요.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <Button
                  variant="tint"
                  size="md"
                  onClick={() => router.push("/documents/registry")}
                  style={{ flex: 1 }}
                >
                  등기부 확인하기
                </Button>
                <Button
                  variant="neutral"
                  size="md"
                  onClick={() => router.push("/tasks")}
                  style={{ flex: 1 }}
                >
                  할 일 돌아보기
                </Button>
              </div>
            </Card>
          ) : (
            <Card radius={20} style={{ padding: 20, border: `1px solid ${color.borderFaint}` }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: color.primary }}>
                  지금 해야 할 일
                </span>
                <span style={{ fontSize: 12, color: color.textTertiary }}>
                  {next
                    ? next.due
                      ? `${nextDd.label} · ${next.due.slice(5).replace("-", "/")}`
                      : "기한 없음"
                    : ""}
                </span>
              </div>
              <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, lineHeight: 1.35, color: color.ink }}>
                {next ? next.title : "이 단계 할 일을 모두 마쳤어요"}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: color.textSecondary,
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
                      borderTop: `1px solid ${color.borderSoft}`,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: color.primary }}>
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
                                border: `1.5px solid ${t.done ? color.primary : color.border}`,
                                background: t.done ? color.primary : "transparent",
                                color: "#fff",
                                fontSize: 11,
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
                                fontSize: 13,
                                lineHeight: 1.4,
                                color: t.done ? color.textTertiary : color.ink,
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
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: dd.fg === color.dangerFg ? color.dangerFg : color.textTertiary,
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
                <Button
                  variant="tint"
                  size="md"
                  onClick={() => {
                    if (next) {
                      toggleTask(caseId, next.id);
                      toast("완료! 다음 할 일로 넘어가요");
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  완료했어요
                </Button>
                <Button variant="neutral" size="md" onClick={() => router.push("/tasks")} style={{ flex: 1 }}>
                  자세히
                </Button>
              </div>
            </Card>
          )}

          {/* 판정 개수 — 카드 안에 카드를 쌓지 않도록 divider로만 4분할, 탭하면 해당 판정만 모아 보기 */}
          <div>
            <Card radius={16} style={{ padding: "14px 4px", display: "flex" }}>
              {[
                ["danger", "위험", "#B4231A"],
                ["warn", "주의", "#7A4E00"],
                ["safe", "좋음", "#14613F"],
                ["unknown", "미확인", "#5A6660"],
              ].map(([k, label, fg], i) => (
                <button
                  key={k}
                  onClick={() => router.push(`/analysis?st=${k}`)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "0 4px",
                    background: "none",
                    border: "none",
                    borderLeft: i === 0 ? "none" : `1px solid ${color.borderSoft}`,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 800, color: fg }}>{counts[k]}</span>
                  <div style={{ marginTop: 2, fontSize: 12, fontWeight: 600, color: color.textSecondary }}>
                    {label}
                  </div>
                </button>
              ))}
            </Card>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/analysis")}
              style={{ marginTop: 8, borderRadius: 14, fontSize: 14 }}
            >
              분석 결과 전체 보기 →
            </Button>
          </div>

          {/* 깡통 위험률 — 실거래 시세 기반 실계산 (백엔드 /risk, 실패 시 카드 미노출) */}
          {risk && (
            <Card radius={16} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: color.textSecondary }}>
                  깡통 위험률 <span style={{ fontWeight: 500 }}>· 실거래 시세 기준</span>
                </span>
                <span
                  style={{
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: risk.metricsAvailable && !isDemoRisk ? (D.ST[risk.grade]?.bg ?? D.ST.unknown.bg) : D.ST.unknown.bg,
                    color: risk.metricsAvailable && !isDemoRisk ? (D.ST[risk.grade]?.fg ?? D.ST.unknown.fg) : D.ST.unknown.fg,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {isDemoRisk
                    ? "샘플 참고치"
                    : !risk.metricsAvailable
                    ? "참고치"
                    : risk.grade === "danger"
                      ? "위험"
                      : risk.grade === "warn"
                        ? "주의"
                        : "양호"}
                </span>
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontSize: 34,
                    fontWeight: 800,
                    color: isDemoRisk ? color.ink : (D.ST[risk.grade]?.fg ?? color.ink),
                    lineHeight: 1,
                  }}
                >
                  {risk.ratio}%
                </span>
                <span style={{ fontSize: 12, color: color.textSecondary }}>
                  {/* risk 금액은 만원 단위 → 원으로 환산해 표기 */}
                  (보증금 {fmtKrw(risk.deposit * 1e4)} + 선순위 {fmtKrw(risk.seniorLien * 1e4)}) ÷ 시세{" "}
                  {fmtKrw(risk.marketValue * 1e4)}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: color.textSecondary, lineHeight: 1.5 }}>
                {isDemoRisk && (
                  <b style={{ color: "#7A4E00" }}>
                    샘플 계약이라 시세가 실제 매물과 맞지 않아요. 실제 서류를 올리면 그 주소의 실거래 시세로 계산돼요.{" "}
                  </b>
                )}
                {!isDemoRisk && !risk.metricsAvailable && (
                  <b style={{ color: "#7A4E00" }}>
                    등기부가 아직 분석되지 않아 선순위 근저당이 반영되지 않았어요 — 등기부를 올리면 정확해져요.{" "}
                  </b>
                )}
                {risk.valueSource === "gongsi"
                  ? "실거래가 없어 공시가격 ×140% 근사 시세를 사용했어요."
                  : `최근 12개월 실거래 ${risk.sampleCount}건 기반 추정 시세예요.`}{" "}
                70% 이상이면 주의, 90% 이상이면 위험으로 봐요.
              </div>
            </Card>
          )}

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
                  fontSize: 13,
                  color: "#16A36A",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                전체 보기 →
              </button>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {docList.map((d) => (
                <Card
                  key={d.key}
                  as="button"
                  interactive
                  radius={14}
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
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#17211E" }}>{d.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {d.marks > 0 && (
                      <span style={{ fontSize: 12, color: "#6E827A" }}>표시 {d.marks}</span>
                    )}
                    <StatusChip st={{ ...d.st, glyph: "" }}>{d.st.label}</StatusChip>
                  </span>
                </Card>
              ))}
            </div>
          </div>

          {/* 도구: 중개보수 계산 · 이사 체크리스트 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Card
              as="button"
              interactive
              onClick={() => setFeeOpen(true)}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "14px" }}
            >
              <CalculatorIcon style={{ width: 20, height: 20, color: "#16A36A" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#17211E" }}>
                중개보수 계산
              </span>
              <span style={{ fontSize: 12, color: "#6E827A" }}>법정 상한 요율로 미리 계산</span>
            </Card>
            <Card
              as="button"
              interactive
              onClick={() => router.push("/moving")}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "14px" }}
            >
              <ArchiveBoxIcon style={{ width: 20, height: 20, color: "#16A36A" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#17211E" }}>
                이사 체크리스트
              </span>
              <span style={{ fontSize: 12, color: "#6E827A" }}>
                입주 하자 체크 · 퇴거 시 주의
              </span>
            </Card>
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
              <CalculatorIcon style={{ width: 20, height: 20, color: "#16A36A" }} />
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
                      <span style={{ fontSize: 14, fontWeight: 700 }}>중개보수 상한</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#14613F" }}>
                        {r.fee.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                );
              })()}
            <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.6, color: "#6E827A" }}>
              법정 <b>상한</b>이에요 (부가세 별도). 실제 보수는 이 범위 안에서 중개인과{" "}
              <b>협의</b>해서 정합니다. 상한 요율은 지자체 조례에 따라 다를 수 있어요 (서울 기준표).
            </p>
          </div>
        </div>
      )}
    </>
  );
}
