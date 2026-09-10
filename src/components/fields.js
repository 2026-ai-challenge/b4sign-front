"use client";

import { useEffect, useRef, useState } from "react";
import { kstTodayStr } from "@/lib/derive";

// ─── 다음(카카오) 우편번호 스크립트 로더 ───
let postcodePromise = null;
function loadPostcode() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.daum && window.daum.Postcode) return Promise.resolve();
  if (!postcodePromise) {
    postcodePromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      s.onload = resolve;
      s.onerror = () => {
        postcodePromise = null;
        reject();
      };
      document.head.appendChild(s);
    });
  }
  return postcodePromise;
}

const inputStyle = {
  height: 48,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid #DDE3DF",
  background: "#fff",
  fontSize: 15,
  outline: "none",
  width: "100%",
};

const sheetBackdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,42,32,.45)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 50,
};

const sheetBox = {
  width: "100%",
  maxWidth: 430,
  background: "#fff",
  borderRadius: "24px 24px 0 0",
  padding: "16px 16px calc(20px + env(safe-area-inset-bottom))",
  animation: "sheetUp .22s ease",
};

// ─── 주소 검색 필드 ───
// 검색 시트에서 도로명 주소를 고르면 기본 주소가 채워지고, 동·호수를 이어서 입력한다.
export function AddressField({ base, detail, onBase, onDetail }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef(null);
  const detailRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFailed(false);
    loadPostcode()
      .then(() => {
        if (cancelled || !boxRef.current) return;
        boxRef.current.innerHTML = "";
        new window.daum.Postcode({
          oncomplete: (data) => {
            const road = data.roadAddress || data.jibunAddress || "";
            const building = data.buildingName ? ` (${data.buildingName})` : "";
            onBase(road + building);
            setOpen(false);
            // 동·호수 입력으로 포커스 이동
            setTimeout(() => detailRef.current && detailRef.current.focus(), 250);
          },
          width: "100%",
          height: "100%",
        }).embed(boxRef.current);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, onBase]);

  return (
    <>
      {base ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              height: "auto",
              minHeight: 48,
              padding: "12px 14px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 14.5, lineHeight: 1.4, color: "#0F2A20" }}>{base}</span>
            <span style={{ flex: "none", fontSize: 12, color: "#1B7F5C", fontWeight: 700 }}>
              재검색
            </span>
          </button>
          <input
            ref={detailRef}
            value={detail}
            onChange={(e) => onDetail(e.target.value)}
            placeholder="동·호수 (예: 301동 1204호)"
            style={inputStyle}
          />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            ...inputStyle,
            display: "flex",
            alignItems: "center",
            gap: 8,
            textAlign: "left",
            cursor: "pointer",
            color: "#9AA8A1",
          }}
        >
          <span style={{ fontSize: 15 }}>⌕</span>
          주소 검색 (도로명·건물명)
        </button>
      )}

      {open && (
        <div style={sheetBackdrop} onClick={() => setOpen(false)}>
          <div style={{ ...sheetBox, padding: "16px 0 0" }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 20px 12px",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 800 }}>주소 검색</span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "#F1F3F1",
                  fontSize: 16,
                  color: "#4B6157",
                }}
              >
                ×
              </button>
            </div>
            {failed ? (
              <div style={{ padding: "24px 20px 32px" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  주소 검색을 불러오지 못했어요
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#4B6157", lineHeight: 1.55 }}>
                  네트워크 상태를 확인해 주세요. 아래에 주소를 직접 입력할 수도 있어요.
                </p>
                <input
                  autoFocus
                  placeholder="주소 직접 입력"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      onBase(e.target.value.trim());
                      setOpen(false);
                    }
                  }}
                  style={{ ...inputStyle, marginTop: 14 }}
                />
              </div>
            ) : (
              <div ref={boxRef} style={{ height: "62vh", borderTop: "1px solid #EEF1EE" }} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── 날짜 필드: 직접 입력 + 달력 시트 ───
const pad2 = (n) => String(n).padStart(2, "0");
const fmt = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const parseDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d) ? null : d;
};

// 숫자만 입력해도 YYYY-MM-DD로 자동 포맷
function formatTyping(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return digits.slice(0, 4) + "-" + digits.slice(4);
  return digits.slice(0, 4) + "-" + digits.slice(4, 6) + "-" + digits.slice(6);
}

export function DateField({ value, onChange, placeholder, marks = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={(e) => onChange(formatTyping(e.target.value))}
          placeholder={placeholder}
          inputMode="numeric"
          style={{ ...inputStyle, fontSize: 14, paddingRight: 44 }}
        />
        <button
          onClick={() => setOpen(true)}
          aria-label="달력 열기"
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "#EEF6F1",
            color: "#1B7F5C",
            fontSize: 16,
          }}
        >
          📅
        </button>
      </div>
      {open && (
        <CalendarSheet
          title={placeholder}
          value={value}
          marks={marks}
          onClose={() => setOpen(false)}
          onSelect={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function CalendarSheet({ title, value, marks, onClose, onSelect }) {
  const selected = parseDate(value);
  const today = parseDate(kstTodayStr()); // "오늘"도 항상 한국시간 기준
  const init = selected || parseDate(marks[0]?.date) || today;
  const [ym, setYm] = useState([init.getFullYear(), init.getMonth()]); // [year, 0-based month]
  const [y, m] = ym;

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const markFor = (d) => marks.find((mk) => mk.date === fmt(y, m + 1, d));
  const isSelected = (d) =>
    selected &&
    selected.getFullYear() === y &&
    selected.getMonth() === m &&
    selected.getDate() === d;
  const isToday = (d) =>
    today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  return (
    <div style={sheetBackdrop} onClick={onClose}>
      <div style={sheetBox} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "#DDE3DF",
            margin: "0 auto 12px",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 8px",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800 }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setYm(m === 0 ? [y - 1, 11] : [y, m - 1])}
              style={navBtn}
            >
              ‹
            </button>
            <span style={{ fontSize: 14.5, fontWeight: 700, minWidth: 92, textAlign: "center" }}>
              {y}년 {m + 1}월
            </span>
            <button
              onClick={() => setYm(m === 11 ? [y + 1, 0] : [y, m + 1])}
              style={navBtn}
            >
              ›
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            marginTop: 12,
            padding: "0 4px",
          }}
        >
          {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
            <div
              key={w}
              style={{
                textAlign: "center",
                fontSize: 11.5,
                fontWeight: 700,
                color: i === 0 ? "#C25A50" : i === 6 ? "#4A6FA5" : "#8A968F",
                padding: "6px 0",
              }}
            >
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={"e" + i} />;
            const mk = markFor(d);
            const sel = isSelected(d);
            return (
              <button
                key={d}
                onClick={() => onSelect(fmt(y, m + 1, d))}
                style={{
                  height: 44,
                  border: "none",
                  background: "none",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14.5,
                    fontWeight: sel || mk ? 800 : 500,
                    background: sel ? "#1B7F5C" : "transparent",
                    color: sel ? "#fff" : mk ? mk.color : isToday(d) ? "#1B7F5C" : "#0F2A20",
                    border: sel
                      ? "none"
                      : mk
                        ? `2px solid ${mk.color}`
                        : isToday(d)
                          ? "1.5px dashed #9BD3B9"
                          : "none",
                    position: "relative",
                  }}
                >
                  {d}
                </span>
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        {(marks.length > 0 || true) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 14px",
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#F4F6F4",
              fontSize: 12,
              color: "#4B6157",
            }}
          >
            {marks.map((mk) => (
              <span key={mk.date} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    border: `2.5px solid ${mk.color}`,
                    display: "inline-block",
                  }}
                />
                {mk.label} {mk.date}
              </span>
            ))}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "1.5px dashed #9BD3B9",
                  display: "inline-block",
                }}
              />
              오늘
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const navBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid #E3E8E3",
  background: "#fff",
  fontSize: 16,
  color: "#0F2A20",
};

// ─── 부드러운 접기/펼치기 (grid-rows 트랜지션) ───
export function Collapse({ open, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows .45s cubic-bezier(.22,1,.36,1)",
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
    </div>
  );
}
