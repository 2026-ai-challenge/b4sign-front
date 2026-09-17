"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useApp } from "@/lib/store";
import { D, kstTodayStr, dday } from "@/lib/derive";
import { TypeBadge } from "@/components/ui";
import { Button, Card } from "@/design-system";

/** YYYY-MM-DD + n개월 */
function addMonths(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, d));
  return dt.toISOString().slice(0, 10);
}

/**
 * 등기 변동 모니터링 — 3개월 주기 재확인 리마인더 + 재업로드 비교(diff).
 * 등기부 "자동 열람"은 인터넷등기소 공식 API 부재로 준비 중 (docs/ISSUES.md #1).
 * 현재 동작: 마지막 확인일 기준 다음 확인 예정일 계산 → 기한 도래 시 알림(D-day 규칙),
 * 재업로드하면 이전 분석과 비교해 변경점을 보여준다.
 */
export default function RegistryWatch() {
  const router = useRouter();
  const { caseId, docs, me, patchMe, toast } = useApp();
  const watchOn = !!(me.notif?.master && me.notif?.stale);
  const cur = D.CASES.find((c) => c.id === caseId);
  const reg = (docs[caseId] || {}).registry || { status: "missing" };
  const lastChecked = reg.issued || null;
  const nextCheck = lastChecked ? addMonths(lastChecked, 3) : null;
  const nextDd = nextCheck ? dday(nextCheck) : null;
  const overdue = nextDd !== null && nextDd <= 0;

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
          onClick={() => router.push("/documents")}
          style={{ background: "none", border: "none", color: "#17211E", padding: "6px 10px", display: "flex" }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800 }}>등기 변동 모니터링</span>
        <button
          onClick={() => {
            // 서류 최신본 경고(stale) 알림 설정과 연동 — MY의 같은 토글과 동기화
            patchMe({ notif: { ...me.notif, stale: !me.notif?.stale, master: true } });
            toast(watchOn ? "모니터링 알림을 꺼요" : "모니터링 알림을 켰어요");
          }}
          aria-pressed={watchOn}
          style={{
            marginLeft: "auto",
            marginRight: 8,
            padding: "3px 9px",
            borderRadius: 999,
            border: "none",
            background: watchOn ? "#E3F3E9" : "#ECEEEC",
            color: watchOn ? "#14613F" : "#5A6660",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {watchOn ? "켜짐" : "꺼짐"}
        </button>
      </div>

      <div style={{ padding: "4px 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 상태 카드 */}
        <Card radius={18} style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TypeBadge type={cur.type} size="sm" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>{cur.short}</span>
          </div>
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "8px 14px",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "#6E827A", fontWeight: 600 }}>마지막 확인</span>
            <span>{lastChecked ?? "등기부등본 미업로드"}</span>
            <span style={{ color: "#6E827A", fontWeight: 600 }}>다음 확인</span>
            <span>
              {nextCheck ? (
                <>
                  {nextCheck}{" "}
                  <b style={{ color: overdue ? "#B4231A" : "#14613F" }}>
                    ({overdue ? `지남, 지금 확인하세요` : `D-${nextDd}`})
                  </b>
                </>
              ) : (
                "—"
              )}
            </span>
            <span style={{ color: "#6E827A", fontWeight: 600 }}>주기</span>
            <span>3개월 (거주 중 담보 설정·소유자 변경 감시)</span>
          </div>
          <Button
            onClick={() => router.push("/documents?upload=registry")}
            size="md"
            style={{ marginTop: 14, fontSize: 14, ...(overdue ? { background: "#B4231A" } : {}) }}
          >
            최신 등기부 올리고 비교하기
          </Button>
        </Card>

        {/* 최근 변동 (재업로드 비교) */}
        <Card radius={18} style={{ padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>최근 변동 내역</div>
          {cur.diff ? (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
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
                    height: "fit-content",
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
                    height: "fit-content",
                  }}
                >
                  해소됨
                </span>
                <span style={{ color: "#4B6157", textDecoration: "line-through" }}>
                  임대인 주민번호 마스킹 누락: 계약서 v2에서 수정
                </span>
              </div>
            </div>
          ) : (
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#4B6157", lineHeight: 1.55 }}>
              아직 비교할 변동이 없어요. 등기부를 다시 올리면 이전 분석과 자동으로 비교해
              새 근저당·가압류·소유자 변경을 짚어드려요.
            </p>
          )}
        </Card>

        {/* 자동 열람 안내 */}
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            background: "#F4F6F4",
            fontSize: 13,
            lineHeight: 1.6,
            color: "#4B6157",
          }}
        >
          <b>자동 열람은 준비 중이에요.</b> 인터넷등기소는 공식 개방 API가 없어(열람 유료·본인
          결제) 지금은 3개월 주기 <b>리마인더 + 재업로드 비교</b>로 동작해요. 기한이 지나면 홈과
          알림으로 알려드립니다.
        </div>
      </div>
    </>
  );
}
