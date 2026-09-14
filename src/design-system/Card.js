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
      {...rest}
    >
      {children}
    </As>
  );
}
