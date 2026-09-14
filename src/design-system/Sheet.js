"use client";

import { color } from "./tokens";

export const sheetBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(23,33,30,.45)", // color.ink 45%
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 50,
};

export const sheetBox = {
  width: "100%",
  maxWidth: 430,
  background: color.white,
  borderRadius: "24px 24px 0 0",
  padding: "16px 16px calc(20px + env(safe-area-inset-bottom))",
  animation: "sheetUp .22s ease",
};

// 바텀시트 — fields.js/ui.js에 중복 구현돼 있던 걸 통합
export function Sheet({ open, onClose, zIndex, style, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ ...sheetBackdrop, ...(zIndex ? { zIndex } : {}) }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ ...sheetBox, ...style }}>
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: color.border,
            margin: "0 auto 14px",
          }}
        />
        {children}
      </div>
    </div>
  );
}
