"use client";

import { color, radius, font } from "./tokens";

const VARIANT = {
  primary: { background: color.primary, color: color.white, border: "none" },
  secondary: { background: color.white, color: color.primary, border: `1px solid ${color.primarySoft}` },
  ghost: { background: "none", color: color.textSecondary, border: "none" },
  tint: { background: color.primaryTint, color: color.safeFg, border: "none" },
  neutral: { background: color.white, color: color.ink, border: `1px solid ${color.border}` },
  dark: { background: color.ink, color: color.white, border: "none" },
  // 어두운 카드(예: 진행 상태 패널) 위에 얹는 버튼
  inverse: { background: color.white, color: color.ink, border: "none" },
  inverseGhost: { background: "none", color: color.white, border: "1px solid rgba(255,255,255,.3)" },
};

const SIZE = {
  // 반경은 입력창·소셜 로그인 버튼(12)과 맞춘다 — 알약형(pill)은 칩·배지 전용
  lg: { height: 52, fontSize: font.size.md, borderRadius: radius.md },
  md: { height: 44, fontSize: font.size.body, borderRadius: radius.md },
  sm: { height: 34, fontSize: font.size.caption, borderRadius: radius.sm },
};

export function Button({ variant = "primary", size = "lg", disabled, style, className, children, ...rest }) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  return (
    <button
      disabled={disabled}
      className={["ds-btn", className].filter(Boolean).join(" ")}
      data-variant={variant}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: s.height,
        fontSize: s.fontSize,
        borderRadius: s.borderRadius,
        fontWeight: 700,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...v,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * 텍스트 링크형 버튼("전체 보기 →" 등). 글자 위치는 그대로 두고(padding + 음수 margin 상쇄)
 * 눌리는 영역만 넓혀 hover/pressed 배경을 줄 수 있게 한다. 상태 스타일은 globals.css의 .ds-link.
 */
export function LinkButton({ style, className, children, ...rest }) {
  return (
    <button
      className={["ds-link", className].filter(Boolean).join(" ")}
      style={{
        background: "none",
        border: "none",
        padding: "4px 8px",
        margin: "-4px -8px",
        borderRadius: 8,
        fontSize: font.size.sm,
        fontWeight: 600,
        color: color.primary,
        cursor: "pointer",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
