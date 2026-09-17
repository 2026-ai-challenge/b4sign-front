"use client";

import {
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";
import { color, radius } from "./tokens";

const TYPE_STYLE = {
  jeonse: { bg: color.jeonseBg, fg: color.jeonse, label: "전세" },
  wolse: { bg: color.wolseBg, fg: color.wolse, label: "월세" },
  maemae: { bg: color.maemaeBg, fg: color.maemae, label: "매매" },
};

// 기존 TypeBadge — 계약 유형(전세/월세/매매) 표시
export function TypeBadge({ type, size = "md" }) {
  const t = TYPE_STYLE[type];
  const pad = size === "sm" ? "1px 6px" : "3px 8px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span
      style={{
        padding: pad,
        borderRadius: size === "sm" ? 4 : 6,
        background: t.bg,
        color: t.fg,
        fontSize: fs,
        fontWeight: 800,
        flex: "none",
      }}
    >
      {t.label}
    </span>
  );
}

const STATUS_STYLE = {
  safe: { bg: color.safeBg, fg: color.safeFg, Icon: CheckCircleIcon },
  warn: { bg: color.warnBg, fg: color.warnFg, Icon: ExclamationTriangleIcon },
  danger: { bg: color.dangerBg, fg: color.dangerFg, Icon: ExclamationCircleIcon },
  unknown: { bg: color.unknownBg, fg: color.unknownFg, Icon: QuestionMarkCircleIcon },
};

// 기존 StatusChip — safe/warn/danger/unknown 판정 표시. glyph 문자 대신 Heroicons 아이콘 사용.
export function StatusBadge({ status, children, showIcon = false, label }) {
  const s = STATUS_STYLE[status];
  if (!s) return null;
  const Icon = s.Icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        borderRadius: radius.pill,
        background: s.bg,
        color: s.fg,
        fontSize: 11.5,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {showIcon && <Icon style={{ width: 13, height: 13, flex: "none" }} />}
      {children ?? label}
    </span>
  );
}

export { STATUS_STYLE };
