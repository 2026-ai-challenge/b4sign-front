"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { apiAvailable } from "@/lib/api";
import { D, resolveTaskDue, dday } from "@/lib/derive";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/**
 * 기한 임박 알림 배너 — 페이지가 열려 있는 동안 서버 SSE(/notifications/stream)를
 * 구독해 "임대인 미납 국세·지방세 확인 D-1" 같은 알림을 상단에 띄운다.
 * API 미기동 시에는 로컬 할 일에서 같은 규칙(D-1·D-day·D+7 이내 지남)으로 계산.
 */
export function NotificationHost() {
  const router = useRouter();
  const { tasks, apiOn, me } = useApp();
  const [items, setItems] = useState([]);
  const dismissed = useRef(new Set()); // 세션 내 닫은 알림은 다시 안 띄움

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
    if (!me.notif?.master || !me.notif?.due) return; // 알림 설정 존중

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

  const visible = items.filter((i) => !dismissed.current.has(i.id)).slice(0, 3);
  if (!visible.length) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        left: 12,
        right: 12,
        zIndex: 45,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {visible.map((n) => (
        <div
          key={n.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 12px",
            borderRadius: 14,
            background: "#0F2A20",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(15,42,32,.35)",
            animation: "sheetUp .25s ease",
          }}
        >
          <span style={{ fontSize: 15, flex: "none" }}>🔔</span>
          <button
            onClick={() => router.push("/tasks")}
            style={{
              flex: 1,
              minWidth: 0,
              background: "none",
              border: "none",
              color: "#fff",
              textAlign: "left",
              padding: 0,
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {n.title}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "#9BD3B9", marginTop: 2 }}>
              {n.label} · {n.due} · {n.caseShort}
            </span>
          </button>
          <button
            onClick={() => {
              dismissed.current.add(n.id);
              setItems((s) => [...s]); // 리렌더
            }}
            aria-label="알림 닫기"
            style={{
              flex: "none",
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,.15)",
              color: "#fff",
              fontSize: 13,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
