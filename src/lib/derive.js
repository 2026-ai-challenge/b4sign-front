import { ZIPSALPI_DATA as D } from "@/data/zipsalpi";

// ─── 날짜는 항상 한국시간(KST, UTC+9 고정 — 서머타임 없음) 기준 ───
export function kstTodayStr() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// D-day: KST 오늘 기준 남은 일수 (양수 = 미래)
export const dday = (dateStr) => {
  const p = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(dateStr) - p(kstTodayStr())) / 864e5);
};

// D-day 라벨/색: 3일 이내는 위험 톤
export function ddInfo(due) {
  if (!due) return null;
  const d = dday(due);
  const label = d === 0 ? "D-day" : d > 0 ? "D-" + d : "D+" + -d;
  return {
    label,
    bg: d <= 3 ? "#FDE8E4" : "#EEF6F1",
    fg: d <= 3 ? "#B4231A" : "#14613F",
  };
}

export function lawShort(k) {
  if (!k) return "";
  return D.LAWS[k].title
    .split(" (")[0]
    .replace("주택임대차보호법", "주임법")
    .replace("부동산 거래신고 등에 관한 법률", "거래신고법");
}

export function maskAddr(addr) {
  return addr
    .replace(/(\d+)동 (\d+)호/, "***동 ****호")
    .replace(/(\d+)층 (\d+)호/, "*층 ***호");
}

export function caseCounts(caseId) {
  const judged = (D.ANALYSIS[caseId] || []).filter((i) => !i.deadline);
  const counts = { safe: 0, warn: 0, danger: 0, unknown: 0 };
  judged.forEach((i) => counts[i.st]++);
  const overall = counts.danger
    ? D.ST.danger
    : counts.warn
      ? D.ST.warn
      : judged.length
        ? D.ST.safe
        : D.ST.unknown;
  return { counts, overall, judged };
}

export function balanceWord(type) {
  return type === "maemae" ? "잔금" : type === "wolse" ? "입주" : "잔금·입주";
}

// 케이스 기준일 조회: contract | balance | mid
function baseDate(cur, base) {
  return base === "contract"
    ? cur.contractDate
    : base === "mid"
      ? cur.midDate
      : cur.balanceDate;
}

// 날짜 문자열에 일수 더하기
function addDays(dateStr, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3] + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 할 일의 실제 기한 해석: 명시된 due > dueRule(케이스 날짜 기준 권장 기한) > 없음
// recommended=true면 "권장" 기한 (예: 계약 3일 전까지 서류 발급)
export function resolveTaskDue(task, cur) {
  if (task.due) return { due: task.due, recommended: false, label: null };
  if (task.dueRule) {
    const b = baseDate(cur, task.dueRule.base);
    const due = b ? addDays(b, task.dueRule.offset) : null;
    if (due) return { due, recommended: true, label: task.dueRule.label };
  }
  return { due: null, recommended: false, label: null };
}

// 단계별 기준일: "이 단계 할 일은 늦어도 이 날짜까지"
const PHASE_ANCHORS = {
  jeonse: ["contract", "contract", "balance", null],
  wolse: ["contract", "contract", "balance", null],
  maemae: ["contract", "contract", "mid", "balance", null],
};

export function phaseAnchor(type, phaseIndex, cur) {
  const base = (PHASE_ANCHORS[type] || [])[phaseIndex];
  if (!base) return null;
  const date = baseDate(cur, base);
  if (!date) return null;
  const word =
    base === "contract" ? "계약일" : base === "mid" ? "중도금일" : balanceWord(type) + "일";
  return { date, word };
}

// 유형별 서류 목록 + 현재 업로드 상태/하이라이트 개수
export function buildDocList(caseId, docs) {
  const cur = D.CASES.find((c) => c.id === caseId);
  const typ = D.TYPES[cur.type];
  const items = D.ANALYSIS[caseId] || [];
  return typ.docs.map(([key, req]) => {
    const doc = D.DOCS[key];
    const dd = (docs && docs[key]) || { status: "missing" };
    const has = dd.status !== "missing";
    const days = dd.issued ? -dday(dd.issued) : 0;
    const marks = items.filter(
      (i) => i.doc === key && D.DOCTEXT[caseId] && D.DOCTEXT[caseId][key]
    );
    const byst = {};
    marks.forEach((i) => (byst[i.st] = (byst[i.st] || 0) + 1));
    return {
      ...doc,
      req,
      status: dd.status,
      issued: dd.issued,
      st: D.DOCST[dd.status],
      has,
      missing: !has,
      stale: dd.status === "stale",
      days,
      meta: has ? "발급일 " + dd.issued + " · 텍스트 추출 완료" : doc.where,
      border: dd.status === "stale" ? "#F1D9A6" : "#E3E8E3",
      marks: has ? marks.length : 0,
      markChips: ["danger", "warn", "safe", "unknown"]
        .filter((k) => byst[k])
        .map((k) => ({
          glyph: D.ST[k].glyph,
          n: byst[k],
          bg: D.ST[k].bg,
          fg: D.ST[k].fg,
        })),
    };
  });
}

export { D };
