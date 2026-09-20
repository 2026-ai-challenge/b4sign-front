"use client";

import { color, radius } from "./tokens";

export function Card({ interactive, radius: r = "lg", style, children, as: As = "div", ...rest }) {
  const borderRadius = typeof r === "number" ? r : radius[r] ?? radius.lg;
  return (
    <As
      style={{
        display: "block",
        width: "100%",
        borderRadius,
        background: color.white,
        border: `1px solid ${color.borderSoft}`,
        textAlign: "left",
        cursor: interactive ? "pointer" : "default",
        ...style,
      }}
      // 흰 카드가 #FAFAF7 배경 위에 놓여 테두리가 유일한 경계다 — anti-slop redundant-border 예외(의도)
      data-slop-allow="redundant-border"
      {...rest}
    >
      {children}
    </As>
  );
}
