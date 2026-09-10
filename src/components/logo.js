"use client";

/**
 * B4SIGN 로고 — B(efore) 4(Checks) SIGN(ature)
 * 체크 배지 + 워드마크. dark=true면 어두운 배경용(흰 글자).
 */
export function Logo({ size = "md", dark = false, badge = true }) {
  const scale = { sm: 0.78, md: 1, lg: 1.35 }[size] || 1;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7 * scale,
        lineHeight: 1,
      }}
    >
      {badge && (
        <span
          style={{
            width: 24 * scale,
            height: 24 * scale,
            borderRadius: 7 * scale,
            background: "#1B7F5C",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14 * scale,
            fontWeight: 900,
            flex: "none",
          }}
        >
          ✓
        </span>
      )}
      <span
        style={{
          fontSize: 20 * scale,
          fontWeight: 900,
          letterSpacing: "-.03em",
        }}
      >
        <span style={{ color: "#1B7F5C" }}>B4</span>
        <span style={{ color: dark ? "#fff" : "#0F2A20" }}>SIGN</span>
      </span>
    </span>
  );
}
