"use client";

import { color, radius } from "./tokens";

export const inputStyle = {
  height: 48,
  padding: "0 12px",
  borderRadius: radius.md,
  border: `1px solid ${color.border}`,
  background: color.white,
  fontSize: 15,
  outline: "none",
  width: "100%",
};

export function Input({ style, ...rest }) {
  return <input style={{ ...inputStyle, ...style }} {...rest} />;
}
