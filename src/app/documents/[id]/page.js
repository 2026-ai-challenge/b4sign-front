"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  XMarkIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { D, lawShort } from "@/lib/derive";
import { LawButton, TermButton } from "@/components/ui";
import { Button } from "@/design-system";

const STATUS_ICON = {
  safe: CheckCircleIcon,
  unknown: QuestionMarkCircleIcon,
  warn: ExclamationTriangleIcon,
  danger: ExclamationCircleIcon,
};

export default function ViewerPage({ params }) {
  const { id } = use(params);
  return (
    <Suspense>
      <Viewer docKey={id} />
    </Suspense>
  );
}

function Viewer({ docKey }) {
  const router = useRouter();
  const search = useSearchParams();
  const { caseId, docs, addTaskFromItem, tasks, apiOn } = useApp();

  const initialPin = search.get("pin") || null;
  const [pin, setPin] = useState(initialPin);
  const [filter, setFilter] = useState("all");

  const doc = D.DOCS[docKey];

  // 실서류 모드: 백엔드가 파싱 원문 + 판정 하이라이트(mark, itemId=실판정 id)를 준다.
  // 로컬 D 형식({h}/{pre,mark,post,item})으로 변환해 기존 렌더를 그대로 재사용한다.
  const [liveText, setLiveText] = useState(null);
  const [liveItems, setLiveItems] = useState(null);
  const [liveChecked, setLiveChecked] = useState(false); // API 응답을 받았는지 (무한 로딩 방지)
  useEffect(() => {
    setLiveText(null);
    setLiveItems(null);
    setLiveChecked(!apiOn);
    if (!apiOn) return;
    let off = false;
    Promise.all([
      api(`/cases/${caseId}/documents/${docKey}`).catch(() => null),
      api(`/cases/${caseId}/analysis`).catch(() => null),
    ]).then(([d, a]) => {
      if (off) return;
      setLiveChecked(true);
      if (d?.source !== "live") return;
      setLiveText(
        d.lines.map((l) =>
          l.kind === "heading"
            ? { h: l.text }
            : l.kind === "mark"
              ? { pre: l.pre, mark: l.mark, post: l.post, item: l.itemId }
              : l.text
        )
      );
      if (a?.source === "live") setLiveItems(a.sections.flatMap((s) => s.items));
    });
    return () => {
      off = true;
    };
  }, [apiOn, caseId, docKey]);

  const text = liveText ?? (D.DOCTEXT[caseId] && D.DOCTEXT[caseId][docKey]);
  // 필터 칩 개수는 이 서류의 판정만, 줄 하이라이트는 케이스 전체 판정에서 찾는다
  // (면적 불일치처럼 두 서류에 걸친 항목이 있어서)
  const allItems = liveItems ?? D.ANALYSIS[caseId] ?? [];
  const items = allItems.filter((i) => i.doc === docKey);
  const caseTasks = tasks[caseId] || [];

  if (doc && !text && apiOn && !liveChecked) {
    // 실서류 본문 로딩 중 (API 응답 대기)
    return (
      <div style={{ padding: 60, textAlign: "center", fontSize: 14, color: "#6E827A" }}>
        문서를 불러오는 중…
      </div>
    );
  }
  if (!doc || !text) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>표시할 문서가 없어요</div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/documents")}
          style={{ display: "inline-flex", width: "auto", padding: "0 20px", marginTop: 16 }}
        >
          서류 목록으로
        </Button>
      </div>
    );
  }

  const vCounts = {};
  items.forEach((i) => (vCounts[i.st] = (vCounts[i.st] || 0) + 1));
  const issued = (docs[caseId] && docs[caseId][docKey] && docs[caseId][docKey].issued) || "—";
  const verify =
    docKey === "building"
      ? "국토부 API 교차 검증"
      : docKey === "registry"
        ? "등기 항목 검증 · 진위 확인 제외"
        : "필수 특약 대조";

  const filters = [
    ["all", "전체", "", items.length],
    ...["danger", "warn", "safe", "unknown"]
      .filter((k) => vCounts[k])
      .map((k) => [k, D.ST[k].label, D.ST[k].glyph, vCounts[k]]),
  ];

  const pinItem = allItems.find((i) => String(i.id) === String(pin));
  const added = pinItem && caseTasks.some((t) => t.id === "a" + pinItem.id);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#1A2420",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        zIndex: 20,
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 52,
          padding: "0 12px 0 20px",
          flex: "none",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{doc.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>
            발급 {issued} · {verify}
          </div>
        </div>
        <button
          onClick={() => router.push("/documents")}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,.15)",
            color: "#fff",
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XMarkIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* 필터 칩 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "0 20px 10px",
          flex: "none",
          overflowX: "auto",
        }}
      >
        {filters.map(([k, label, , n]) => {
          const on = filter === k;
          const st = D.ST[k];
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              style={{
                flex: "none",
                display: "inline-flex",
                alignItems: "center",
                height: 30,
                padding: "0 11px",
                borderRadius: 999,
                border: `1px solid ${on ? "transparent" : "rgba(255,255,255,.2)"}`,
                background: on ? (st ? st.fg : "#fff") : "rgba(255,255,255,.08)",
                color: on ? (st ? "#fff" : "#17211E") : "rgba(255,255,255,.8)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {label} {n}
            </button>
          );
        })}
      </div>

      {/* 문서 본문 */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 14px 16px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 6,
            color: "#111",
            padding: "22px 16px 28px",
            fontSize: 12,
            lineHeight: 1.7,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontFamily: "'Noto Serif KR','Apple SD Gothic Neo',serif",
          }}
        >
          {text.map((l, idx) => {
            if (typeof l === "string")
              return (
                <div key={idx} style={{ color: "#333", paddingRight: 34 }}>
                  {l}
                </div>
              );
            if (l.h)
              return (
                <div
                  key={idx}
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#222",
                    borderBottom: "1px solid #DDD",
                    paddingBottom: 3,
                  }}
                >
                  {l.h}
                </div>
              );
            const it = allItems.find((i) => String(i.id) === String(l.item));
            const st = it ? D.ST[it.st] : D.ST.unknown;
            const LineIcon = STATUS_ICON[it ? it.st : "unknown"];
            const dim = filter !== "all" && it && it.st !== filter;
            const active = String(pin) === String(l.item);
            const open = () => setPin(active ? null : l.item);
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  opacity: dim ? 0.38 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, color: "#333" }}>
                  {l.pre}
                  <button
                    onClick={open}
                    style={{
                      background: dim ? "transparent" : st.mark,
                      border: "none",
                      padding: "1px 3px",
                      margin: 0,
                      font: "inherit",
                      color: "#111",
                      borderRadius: 3,
                      boxShadow: active ? `0 0 0 2px ${st.fg}` : "none",
                      textAlign: "left",
                      lineHeight: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {l.mark}
                  </button>
                  {l.post}
                </div>
                <button
                  onClick={open}
                  style={{
                    flex: "none",
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: `2px solid ${st.fg}`,
                    background: active ? st.fg : st.bg,
                    color: active ? "#fff" : st.fg,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    marginTop: 1,
                  }}
                >
                  <LineIcon style={{ width: 13, height: 13 }} />
                </button>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "rgba(255,255,255,.55)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {liveText
            ? "업로드한 실제 서류의 분석 원문입니다 · 하이라이트를 누르면 설명이 열려요"
            : "가상 샘플 문서입니다 · 하이라이트나 오른쪽 버튼을 누르면 설명이 열려요"}
        </div>
      </div>

      {/* 하단 판정 카드 */}
      {pinItem && (
        <div
          style={{
            flex: "none",
            background: "#fff",
            color: "#17211E",
            borderRadius: "20px 20px 0 0",
            padding: "14px 20px 22px",
            boxShadow: "0 -10px 30px rgba(0,0,0,.3)",
            animation: "sheetUp .22s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 9px",
                  borderRadius: 999,
                  background: D.ST[pinItem.st].bg,
                  color: D.ST[pinItem.st].fg,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {D.ST[pinItem.st].label}
              </span>
              <span style={{ fontSize: 12, color: "#6E827A" }}>{pinItem.evidence}</span>
            </div>
            <button
              onClick={() => setPin(null)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "#F1F3F1",
                color: "#4B6157",
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <XMarkIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
            {pinItem.title}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.55, color: "#2E463C" }}>
            {pinItem.why}
            {pinItem.term && (
              <>
                {" "}
                <TermButton termKey={pinItem.term}>{D.TERMS[pinItem.term].word}</TermButton>
                {pinItem.whyTail}
              </>
            )}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              gap: 8,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <Button
                variant="neutral"
                size="sm"
                onClick={() => router.push("/analysis")}
                style={{ display: "inline-flex", width: "auto", padding: "0 12px" }}
              >
                분석 결과에서
              </Button>
              {pinItem.law && <LawButton lawKey={pinItem.law} short={lawShort(pinItem.law)} />}
            </div>
            {pinItem.task &&
              (added ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#14613F",
                  }}
                >
                  <CheckCircleIcon style={{ width: 14, height: 14 }} />
                  할 일에 있음
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => addTaskFromItem(caseId, pinItem)}
                  style={{ display: "inline-flex", width: "auto", padding: "0 12px" }}
                >
                  + 할 일에 추가
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
