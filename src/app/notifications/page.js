"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { BellIcon } from "@heroicons/react/24/solid";
import { useDueNotifications } from "@/components/notifications";
import { Card } from "@/design-system";
import { color } from "@/design-system/tokens";

/**
 * 알림함 — 헤더 종 아이콘에서 들어오는 화면. 새로고침 때마다 떴다 사라지던
 * 기한 임박 배너들을 한곳에 모아 다시 볼 수 있게 한다(같은 useDueNotifications
 * 데이터를 배너·배지·이 목록이 함께 공유).
 */
export default function Notifications() {
  const router = useRouter();
  const items = useDueNotifications();

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
          onClick={() => router.back()}
          aria-label="뒤로"
          style={{ background: "none", border: "none", color: color.ink, padding: "6px 10px", display: "flex" }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800 }}>알림</span>
      </div>

      <div style={{ padding: "4px 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <Card radius={20} style={{ padding: "32px 20px", textAlign: "center", fontSize: 14, color: color.textSecondary }}>
            아직 임박한 알림이 없어요. 기한이 다가오면 여기서 모아볼 수 있어요.
          </Card>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              onClick={() => router.push("/tasks")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "14px 16px",
                borderRadius: 16,
                border: `1px solid ${color.borderSoft}`,
                background: color.white,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: n.dday <= 0 ? color.dangerBg : color.warnBg,
                  color: n.dday <= 0 ? color.dangerFg : color.warnFg,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BellIcon style={{ width: 16, height: 16 }} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 700,
                    color: color.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.title}
                </span>
                <span style={{ display: "block", marginTop: 2, fontSize: 12, color: color.textSecondary }}>
                  {n.label} · {n.due} · {n.caseShort}
                </span>
              </span>
              <span style={{ flex: "none", fontSize: 15, color: color.textSecondary }}>›</span>
            </button>
          ))
        )}
      </div>
    </>
  );
}
