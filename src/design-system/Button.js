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
  lg: { height: 52, fontSize: font.size.md, borderRadius: radius.pill },
  md: { height: 44, fontSize: font.size.body, borderRadius: radius.pill },
  sm: { height: 34, fontSize: font.size.caption, borderRadius: radius.pill },
};

export function Button({ variant = "primary", size = "lg", disabled, style, children, ...rest }) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  return (
    <button
      disabled={disabled}
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
