"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { D, buildDocList, lawShort } from "@/lib/derive";
import { TypeBadge, LawButton } from "@/components/ui";

export default function Chat() {
  const {
    caseId,
    setCaseId,
    docs,
    chat,
    me,
    chatSend,
    chatMarkAdded,
    chatSetActive,
    chatNewSession,
    chatRenameSession,
    chatDeleteSession,
    addTaskRaw,
  } = useApp();
  const [input, setInput] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [caseMenu, setCaseMenu] = useState(false);
  // 드로어 내 세션 편집 상태: { mode: 'rename'|'delete', id } / rename 입력값
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const scrollRef = useRef(null);

  const cur = D.CASES.find((c) => c.id === caseId);
  const typ = D.TYPES[cur.type];
  const docList = buildDocList(caseId, docs[caseId]);
  const scope = docList.filter((d) => d.has).map((d) => d.name).join("·") || "서류 없음";
  const sessions = chat.sessions[caseId] || [];
  const sess = sessions.find((x) => x.id === chat.active[caseId]) || { id: null, msgs: [] };
  const busy = chat.streaming;

  // 새 메시지가 오면 아래로 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sess.msgs.length, sess.msgs[sess.msgs.length - 1]?.text]);

  const send = (text) => {
    if (busy || !text.trim()) return;
    chatSend(caseId, text);
    setInput("");
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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
        <span style={{ fontSize: 18, fontWeight: 800 }}>AI 상담</span>
        {/* 햄버거: 대화 목록·세션 관리 드로어 */}
        <button
          onClick={() => {
            setEditing(null);
            setDrawer(true);
          }}
          aria-label="대화 목록"
          style={{
            background: "none",
            border: "none",
            padding: "8px 10px",
            display: "inline-flex",
          }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
            {[2, 8, 14].map((y) => (
              <path
                key={y}
                d={`M1 ${y}H19`}
                stroke="#0F2A20"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </button>
      </div>

      {/* 범위 칩 */}
      <div
        style={{
          padding: "0 20px 10px",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          flex: "none",
        }}
      >
        <button
          onClick={() => setCaseMenu((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #CFE3D8",
            background: "#EEF6F1",
            fontSize: 12,
            fontWeight: 600,
            color: "#14613F",
            maxWidth: "100%",
          }}
        >
          <TypeBadge type={cur.type} size="sm" />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {scope}
          </span>
          ▾
        </button>
      </div>
      {caseMenu && (
        <div
          style={{
            margin: "0 20px 10px",
            padding: 6,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #E3E8E3",
            boxShadow: "0 8px 24px rgba(15,42,32,.12)",
            flex: "none",
          }}
        >
          {D.CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCaseId(c.id);
                setCaseMenu(false);
              }}
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: c.id === caseId ? "#EEF6F1" : "#fff",
                fontSize: 13.5,
                fontWeight: 600,
                color: "#0F2A20",
              }}
            >
              <span>{c.short}</span>
              <span style={{ fontSize: 12, color: "#6E827A" }}>{c.amount}</span>
            </button>
          ))}
        </div>
      )}

      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "4px 20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {sess.msgs.map((m, k) =>
          m.role === "user" ? (
            <div
              key={k}
              style={{
                alignSelf: "flex-end",
                maxWidth: "82%",
                padding: "11px 14px",
                borderRadius: "18px 18px 4px 18px",
                background: "#1B7F5C",
                color: "#fff",
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              {m.text}
            </div>
          ) : (
            <div
              key={k}
              style={{
                alignSelf: "flex-start",
                maxWidth: "92%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "18px 18px 18px 4px",
                  background: m.refused ? "#F4F6F4" : "#fff",
                  border: `1px solid ${m.refused ? "#DDE3DF" : "#E3E8E3"}`,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#0F2A20",
                  whiteSpace: "pre-line",
                }}
              >
                {m.text}
                {m.streaming && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 14,
                      background: "#1B7F5C",
                      marginLeft: 2,
                      verticalAlign: "text-bottom",
                      animation: "sk .8s infinite",
                    }}
                  />
                )}
              </div>
              {!m.streaming &&
                ((m.sources && m.sources.length > 0) || (m.laws && m.laws.length > 0)) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(m.sources || []).map((s) => (
                      <span
                        key={s}
                        style={{
                          padding: "4px 9px",
                          borderRadius: 6,
                          background: "#EEF6F1",
                          color: "#1B7F5C",
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {(m.laws || []).map((l) => (
                      <LawButton key={l} lawKey={l} short={lawShort(l)} />
                    ))}
                  </div>
                )}
              {m.canAdd &&
                !m.streaming &&
                (m.added ? (
                  <span
                    style={{
                      alignSelf: "flex-start",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#14613F",
                    }}
                  >
                    ✓ 할 일에 추가됨
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      chatMarkAdded(caseId, sess.id, k);
                      addTaskRaw(caseId, {
                        id: "chat" + k + Date.now(),
                        phase: 0,
                        source: "auto",
                        title: m.taskTitle || "상담 내용 확인 (AI 상담)",
                        why: m.text.slice(0, 90),
                        where: "중개인",
                        items: "특약 문구",
                      });
                    }}
                    style={{
                      alignSelf: "flex-start",
                      height: 34,
                      padding: "0 12px",
                      borderRadius: 999,
                      border: "1px solid #CFE3D8",
                      background: "#fff",
                      color: "#1B7F5C",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    + 이 내용을 할 일에 추가
                  </button>
                ))}
            </div>
          )
        )}

        {sess.msgs.length === 0 && !busy && (
          <>
            {/* 첫 인사 — 프론트에서 렌더링 (API 호출 아님, docs/api-spec.md 참고) */}
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "92%",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 2 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 8,
                    background: "#1B7F5C",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6E827A" }}>
                  B4SIGN AI 상담
                </span>
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "#fff",
                  border: "1px solid #E3E8E3",
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#0F2A20",
                }}
              >
                안녕하세요, <b>{me.name}님</b> 👋
                <br />
                지금 보고 계신 <b>{cur.short}({typ.label})</b> 케이스의 서류를 기준으로
                답해드려요. 계약서 특약이 나에게 불리한지, 판정 결과의 법 근거가 무엇인지,
                중개인에게 요구할 특약 문구까지 편하게 물어보세요.
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#F4F6F4",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: "#4B6157",
                  }}
                >
                  시세 예측·소송 판단은 범위 밖이라 답해드리기 어려워요. 법률 자문이 아닌 참고
                  자료예요.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              <div style={{ fontSize: 12, color: "#6E827A" }}>이런 걸 물어볼 수 있어요</div>
              {D.SUGGEST[cur.type].map((t) => (
                <button
                  key={t}
                  onClick={() => send(t)}
                  style={{
                    alignSelf: "flex-start",
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid #CFE3D8",
                    background: "#fff",
                    color: "#0F2A20",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 입력창 */}
      <div
        style={{
          flex: "none",
          padding: "8px 16px 12px",
          background: "#FAFAF7",
          borderTop: "1px solid #E3E8E3",
        }}
      >
        <div style={{ fontSize: 11.5, color: "#6E827A", marginBottom: 6, padding: "0 4px" }}>
          특약·계약서 조항에 대해서만 답해요. 시세 예측·소송 판단은 범위 밖이에요.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            disabled={busy}
            placeholder={busy ? "답변을 작성하는 중…" : "특약·조항에 대해 물어보세요"}
            style={{
              flex: 1,
              minWidth: 0,
              height: 44,
              padding: "0 14px",
              borderRadius: 999,
              border: "1px solid #DDE3DF",
              background: busy ? "#F1F3F1" : "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={busy}
            style={{
              flex: "none",
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: busy || !input ? "#B9C2BC" : "#1B7F5C",
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* 대화 목록 드로어 */}
      {drawer && (
        <div
          onClick={() => setDrawer(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,42,32,.45)",
            display: "flex",
            justifyContent: "center",
            zIndex: 40,
          }}
        >
          <div style={{ width: "100%", maxWidth: 430, display: "flex" }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "78%",
                height: "100%",
                background: "#fff",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>대화 목록</div>
              {sessions
                .filter((x) => x.msgs.length || x.id === chat.active[caseId])
                .map((x) => {
                  const isActive = x.id === chat.active[caseId];
                  // 이름 변경 중
                  if (editing?.mode === "rename" && editing.id === x.id)
                    return (
                      <div
                        key={x.id}
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                          padding: "8px 10px",
                          borderRadius: 12,
                          background: "#EEF6F1",
                        }}
                      >
                        <input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              chatRenameSession(caseId, x.id, editText);
                              setEditing(null);
                            }
                            if (e.key === "Escape") setEditing(null);
                          }}
                          maxLength={40}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: 34,
                            padding: "0 10px",
                            borderRadius: 9,
                            border: "1px solid #9BD3B9",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => {
                            chatRenameSession(caseId, x.id, editText);
                            setEditing(null);
                          }}
                          style={{
                            height: 34,
                            padding: "0 10px",
                            borderRadius: 999,
                            border: "none",
                            background: "#1B7F5C",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          style={{
                            height: 34,
                            padding: "0 8px",
                            borderRadius: 999,
                            border: "1px solid #DDE3DF",
                            background: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#4B6157",
                          }}
                        >
                          취소
                        </button>
                      </div>
                    );
                  // 삭제 확인 중
                  if (editing?.mode === "delete" && editing.id === x.id)
                    return (
                      <div
                        key={x.id}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 12,
                          background: "#FDE8E4",
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#B4231A" }}>
                          이 대화를 삭제할까요?
                        </span>
                        <span style={{ display: "flex", gap: 6, flex: "none" }}>
                          <button
                            onClick={() => {
                              chatDeleteSession(caseId, x.id);
                              setEditing(null);
                            }}
                            style={{
                              height: 32,
                              padding: "0 12px",
                              borderRadius: 999,
                              border: "none",
                              background: "#B4231A",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            삭제
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            style={{
                              height: 32,
                              padding: "0 10px",
                              borderRadius: 999,
                              border: "1px solid #DDE3DF",
                              background: "#fff",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#4B6157",
                            }}
                          >
                            취소
                          </button>
                        </span>
                      </div>
                    );
                  // 기본 행: 탭=전환, ✎=이름 변경, 🗑=삭제
                  return (
                    <div
                      key={x.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        borderRadius: 12,
                        background: isActive ? "#EEF6F1" : "#fff",
                      }}
                    >
                      <button
                        onClick={() => {
                          chatSetActive(caseId, x.id);
                          setDrawer(false);
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                          textAlign: "left",
                          padding: 12,
                          border: "none",
                          background: "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0F2A20",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "100%",
                          }}
                        >
                          {x.title}
                        </span>
                        <span style={{ fontSize: 12, color: "#6E827A" }}>
                          {x.msgs.length}개 메시지
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setEditing({ mode: "rename", id: x.id });
                          setEditText(x.title);
                        }}
                        aria-label="이름 변경"
                        style={{
                          flex: "none",
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          border: "none",
                          background: "none",
                          fontSize: 13,
                          color: "#6E827A",
                        }}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => setEditing({ mode: "delete", id: x.id })}
                        aria-label="삭제"
                        style={{
                          flex: "none",
                          width: 32,
                          height: 32,
                          marginRight: 4,
                          borderRadius: 9,
                          border: "none",
                          background: "none",
                          fontSize: 13,
                          color: "#B4231A",
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  );
                })}
              <button
                onClick={() => {
                  chatNewSession(caseId);
                  setDrawer(false);
                }}
                style={{
                  marginTop: 8,
                  height: 42,
                  borderRadius: 999,
                  border: "1px solid #CFE3D8",
                  background: "#fff",
                  color: "#1B7F5C",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                + 새 대화
              </button>
              <div style={{ marginTop: "auto", fontSize: 11.5, color: "#6E827A" }}>
                빈 대화는 목록에 보이지 않아요.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
