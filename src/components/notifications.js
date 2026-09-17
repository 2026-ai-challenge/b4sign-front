"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/solid";
import { useApp } from "@/lib/store";
import { apiAvailable } from "@/lib/api";
import { D, resolveTaskDue, dday } from "@/lib/derive";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/**
 * 기한 임박 알림 목록 — 서버 SSE(/notifications/stream)를 구독해 "임대인 미납
 * 국세·지방세 확인 D-1" 같은 알림을 계산한다. API 미기동 시에는 로컬 할 일에서
 * 같은 규칙(D-1·D-day·D+7 이내 지남)으로 계산. 헤더 알림 배지·상단 배너·알림함
 * 화면이 모두 이 훅 하나를 공유해 "새로고침하면 떴던 알림"을 한곳에서 모아본다.
 */
export function useDueNotifications() {
  const { tasks, apiOn, me } = useApp();
  const [items, setItems] = useState([]);

  // 로컬 계산 폴백 (SSE와 동일 규칙)
  const computeLocal = () => {
    const out = [];
    for (const c of D.CASES) {
      for (const t of tasks[c.id] || []) {
        if (t.done) continue;
        const r = resolveTaskDue(t, c);
        if (!r.due) continue;
        const n = dday(r.due);
        if (n <= 1 && n >= -7)
          out.push({
            id: t.id,
            caseShort: c.short,
            title: t.title,
            due: r.due,
            dday: n,
            label: n === 0 ? "D-day" : n > 0 ? `D-${n}` : `D+${-n} 지남`,
          });
      }
    }
    return out.sort((a, b) => a.dday - b.dday);
  };

  useEffect(() => {
    if (!me.notif?.master || !me.notif?.due) {
      setItems([]);
      return;
    }

    if (apiOn && apiAvailable()) {
      const es = new EventSource(BASE + "/notifications/stream");
      es.addEventListener("due", (e) => {
        try {
          setItems(JSON.parse(e.data));
        } catch {}
      });
      es.onerror = () => {}; // EventSource가 자동 재접속
      return () => es.close();
    }
    // 로컬 폴백: 즉시 + 60초 주기
    setItems(computeLocal());
    const t = setInterval(() => setItems(computeLocal()), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOn, me.notif?.master, me.notif?.due]);

  return items;
}

// 여러 건이 한꺼번에 발생해도 배너 하나로 요약 — 개별 토스트를 쌓으면 "긴급 알림"이
// "지금 해야 할 일"과 같은 무게로 보여서 정작 봐야 할 메인 콘텐츠가 묻힌다.
export function NotificationHost() {
  const router = useRouter();
  const items = useDueNotifications();
  if (!items.length) return null;
  const worst = items[0]; // dday 오름차순 정렬 — 가장 오래 지난 것

  return (
    <div style={{ flex: "none", position: "sticky", top: 0, zIndex: 20, padding: "8px 12px 0" }}>
      <button
        onClick={() => router.push("/notifications")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "12px 14px",
          borderRadius: 14,
          border: "none",
          background: "#17211E",
          color: "#fff",
          textAlign: "left",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(15,42,32,.35)",
          animation: "sheetUp .25s ease",
        }}
      >
        <BellIcon style={{ width: 16, height: 16, flex: "none" }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700 }}>
            놓친 할 일이 {items.length}개 있어요
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "#9BD3B9",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            가장 오래 지난 할 일 {worst.label} · {worst.title}
          </span>
        </span>
        <span style={{ flex: "none", fontSize: 12, fontWeight: 700, color: "#9BD3B9" }}>
          모두 보기 →
        </span>
      </button>
    </div>
  );
}
