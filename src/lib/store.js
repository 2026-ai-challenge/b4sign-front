"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { D } from "@/lib/derive";
import { api, apiStream, apiAvailable, clearTokens } from "@/lib/api";

const AppContext = createContext(null);

function initTasks() {
  const tasks = {};
  D.CASES.forEach((c) => {
    // 위험 판정 첫 항목은 케이스 생성 시 자동으로 할 일에 등록
    const auto = D.ANALYSIS[c.id]
      .filter((i) => i.task && i.st === "danger")
      .slice(0, 1)
      .map((i) => ({
        id: "a" + i.id,
        phase: 0,
        source: "auto",
        why: i.why,
        ...i.task,
        doc: i.doc,
        remind: true,
      }));
    tasks[c.id] = [
      ...D.DEFAULT_TASKS[c.type].map((t) => ({ ...t, source: "default" })),
      ...auto,
    ];
  });
  return tasks;
}

function initChat() {
  const sessions = {};
  const active = {};
  D.CASES.forEach((c) => {
    sessions[c.id] = D.CHAT_SEED[c.id].length
      ? [
          {
            id: c.id + "-s1",
            title: D.CHAT_SEED[c.id][0].text.slice(0, 18),
            msgs: D.CHAT_SEED[c.id].map((m) => ({ ...m })),
          },
        ]
      : [];
    active[c.id] = sessions[c.id][0] ? sessions[c.id][0].id : null;
  });
  return { sessions, active, streaming: false };
}

export function AppProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [consented, setConsented] = useState(false);
  // 선택 케이스는 새로고침에도 유지 (localStorage) — 서버 목록에 없으면 첫 케이스로 보정
  // SSR과 첫 렌더를 일치시키기 위해 초기값은 고정(c1), 저장된 선택은 마운트 후 복원 (hydration 오류 방지)
  const [caseId, setCaseIdRaw] = useState("c1");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zipsalpi_case");
      if (saved) setCaseIdRaw(saved);
    } catch {}
  }, []);
  const setCaseId = (v) => {
    setCaseIdRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      try {
        localStorage.setItem("zipsalpi_case", next);
      } catch {}
      return next;
    });
  };
  const [me, setMe] = useState({
    name: "김민지",
    email: "dlminji@gmail.com",
    provider: "kakao",
    notif: { master: true, due: true, stale: true, done: false },
  });
  const [apiOn, setApiOn] = useState(false); // 백엔드 연결 여부 (실패 시 로컬 목으로 동작)
  // 케이스 목록: 서버 bootstrap 값 우선 (보관·삭제 반영), 없으면 데모 3건
  const [cases, setCases] = useState(() => D.CASES.map((c) => ({ ...c })));
  const [docs, setDocs] = useState(() =>
    JSON.parse(JSON.stringify(D.INITIAL_DOCS))
  );
  const [tasks, setTasksState] = useState(initTasks);
  const [chat, setChat] = useState(initChat);
  const [toastMsg, setToastMsg] = useState(null);
  const [law, setLaw] = useState(null); // LAWS key
  const [term, setTerm] = useState(null); // TERMS key
  const [showDiff, setShowDiff] = useState(false);
  const toastTimer = useRef(null);
  const chatTimer = useRef(null);
  // api는 한 번만 메모이즈되므로, 최신 상태는 ref로 읽는다
  const chatRef = useRef(null);
  chatRef.current = chat;
  const apiOnRef = useRef(false);
  apiOnRef.current = apiOn;
  const tasksRef = useRef(null);
  tasksRef.current = tasks;
  const casesRef = useRef(null);
  casesRef.current = cases;

  // 백엔드 부트스트랩 — API 미설정(배포 데모)이거나 실패하면 로컬 목 데이터 그대로 사용
  useEffect(() => {
    if (!apiAvailable()) return;
    let cancelled = false;
    api("/bootstrap")
      .then((b) => {
        if (cancelled) return;
        setMe(b.me);
        setDocs(b.docs);
        setTasksState(b.tasks);
        // 서버 케이스 목록이 진실 — 데모 3건이든 사용자가 만든 것이든 그대로 렌더 (보관된 건 서버가 제외)
        if (Array.isArray(b.cases)) {
          const list = b.cases.map((c) => ({ ...(D.CASES.find((d) => d.id === c.id) || {}), ...c }));
          setCases(list);
          // 저장된 선택 케이스가 목록에 없으면(삭제·다른 계정) 첫 케이스로
          setCaseIdRaw((cur) => {
            const ok = list.some((c) => c.id === cur) ? cur : list[0]?.id ?? cur;
            try {
              localStorage.setItem("zipsalpi_case", ok);
            } catch {}
            return ok;
          });
        }
        setChat((s) => ({ ...s, sessions: b.chat.sessions, active: b.chat.active }));
        setApiOn(true);
      })
      .catch(() => {
        // API 미기동: 로컬 목으로 데모 지속
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 세션 만료(리프레시 실패) → 로그아웃 처리. 데모 데이터로 조용히 전환하지 않는다.
  useEffect(() => {
    const onExpired = () => {
      setLoggedIn(false);
      setToastMsg("로그인이 만료됐어요. 다시 로그인해 주세요.");
      setTimeout(() => setToastMsg(null), 2500);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const store = useMemo(() => {
    const toast = (msg) => {
      clearTimeout(toastTimer.current);
      setToastMsg(msg);
      toastTimer.current = setTimeout(() => setToastMsg(null), 1800);
    };
    // 백엔드 동기화 (연결 시에만, 실패는 콘솔 경고만 — 로컬 상태가 UI 기준)
    const sync = (path, opts) => {
      if (!apiOnRef.current) return;
      api(path, opts).catch((e) => console.warn("[api sync]", path, e.message));
    };
    const setTasks = (cid, fn) =>
      setTasksState((s) => ({ ...s, [cid]: fn(s[cid] || []) }));

    const updateLastMsg = (cid, sessionId, fn) =>
      setChat((x) => ({
        ...x,
        sessions: {
          ...x.sessions,
          [cid]: x.sessions[cid].map((y) =>
            y.id !== sessionId
              ? y
              : { ...y, msgs: y.msgs.map((m, k) => (k === y.msgs.length - 1 ? fn(m) : m)) }
          ),
        },
      }));

    return {
      toast,
      setTasks,
      toggleTask: (cid, id) => {
        const cur = (tasksRef.current[cid] || []).find((t) => t.id === id);
        if (!cur) return;
        const next = !cur.done;
        setTasksState((s) => ({
          ...s,
          [cid]: (s[cid] || []).map((t) => (t.id === id ? { ...t, done: next } : t)),
        }));
        sync(`/tasks/${id}`, { method: "PATCH", body: { done: next } });
      },
      toggleRemind: (cid, id) => {
        const cur = (tasksRef.current[cid] || []).find((t) => t.id === id);
        if (!cur) return;
        const next = !cur.remind;
        setTasksState((s) => ({
          ...s,
          [cid]: (s[cid] || []).map((t) => (t.id === id ? { ...t, remind: next } : t)),
        }));
        sync(`/tasks/${id}`, { method: "PATCH", body: { remind: next } });
      },
      addTaskFromItem: (cid, it) => {
        const task = {
          id: "a" + it.id,
          phase: 0,
          source: "auto",
          why: it.why,
          ...it.task,
          doc: it.doc,
        };
        setTasksState((s) => {
          const cur = s[cid] || [];
          if (cur.some((t) => t.id === task.id)) return s;
          return { ...s, [cid]: [...cur, task] };
        });
        sync(`/cases/${cid}/tasks`, { method: "POST", body: task });
        toast("할 일에 추가했어요");
      },
      addTaskRaw: (cid, task) => {
        setTasksState((s) => ({ ...s, [cid]: [...(s[cid] || []), task] }));
        sync(`/cases/${cid}/tasks`, { method: "POST", body: task });
        toast("할 일에 추가했어요");
      },
      completeUpload: (cid, key) =>
        setDocs((s) => ({
          ...s,
          [cid]: { ...s[cid], [key]: { status: "ok", issued: "2026-09-10" } },
        })),
      refreshDocs: async (cid) => {
        if (!apiOnRef.current) return;
        try {
          const d = await api(`/cases/${cid}/documents`);
          setDocs((s) => ({ ...s, [cid]: d }));
        } catch {}
      },
      clearDocs: (cid) => {
        setDocs((s) => ({
          ...s,
          [cid]: Object.fromEntries(
            Object.keys(s[cid]).map((k) => [k, { status: "missing" }])
          ),
        }));
        sync(`/cases/${cid}/documents`, { method: "DELETE" });
      },
      patchMe: (patch) => {
        setMe((m) => ({ ...m, ...patch }));
        sync("/me", { method: "PATCH", body: patch });
      },
      logout: () => {
        clearTokens();
        setLoggedIn(false);
        setConsented(false);
      },
      // 케이스 생성 — 서버에 만들고 목록·서류·할 일 상태를 채운 뒤 선택. API 미기동이면 로컬 목록에만 추가.
      addCase: async (payload) => {
        let created = null;
        if (apiOnRef.current) {
          created = await api("/cases", { method: "POST", body: payload }); // 실패는 호출부에서 처리
          try {
            const [d, t] = await Promise.all([
              api(`/cases/${created.id}/documents`),
              api(`/cases/${created.id}/tasks`),
            ]);
            setDocs((s) => ({ ...s, [created.id]: d }));
            setTasksState((s) => ({ ...s, [created.id]: t }));
          } catch {}
        } else {
          const id = "local-" + Date.now();
          created = {
            id,
            ...payload,
            short: payload.short || String(payload.addr).split(" ").slice(-2).join(" "),
            phase: 0,
            overall: "unknown",
            counts: { safe: 0, warn: 0, danger: 0, unknown: 0 },
          };
          const typ = D.TYPES[payload.type];
          setDocs((s) => ({ ...s, [id]: Object.fromEntries(typ.docs.map(([k]) => [k, { status: "missing" }])) }));
          setTasksState((s) => ({ ...s, [id]: D.DEFAULT_TASKS[payload.type].map((t) => ({ ...t, source: "default" })) }));
        }
        setChat((s) => ({
          ...s,
          sessions: { ...s.sessions, [created.id]: s.sessions[created.id] || [] },
          active: { ...s.active, [created.id]: s.active[created.id] ?? null },
        }));
        setCases((list) => (list.some((c) => c.id === created.id) ? list : [...list, created]));
        setCaseId(created.id);
        return created;
      },
      // 케이스 보관/삭제 — 서버 반영 후 목록에서 제거, 현재 케이스면 남은 것으로 전환
      removeCase: async (cid, hard) => {
        if (apiOnRef.current) {
          try {
            await api(`/cases/${cid}${hard ? "?hard=1" : ""}`, { method: "DELETE" });
          } catch (e) {
            toast(e.message || "처리하지 못했어요");
            return false;
          }
        }
        setCases((list) => {
          const rest = list.filter((c) => c.id !== cid);
          if (rest.length) setCaseId((cur) => (cur === cid ? rest[0].id : cur));
          return rest.length ? rest : list; // 마지막 케이스는 화면 유지를 위해 남긴다
        });
        toast(hard ? "케이스를 삭제했어요" : "보관함으로 옮겼어요");
        return true;
      },

      // ─── AI 상담 ───
      chatSend: (cid, text) => {
        if (!text.trim()) return;
        const s = chatRef.current;
        if (s.streaming) return;

        let active = s.active[cid];
        let sessions = s.sessions[cid] || [];
        if (!active) {
          active = cid + "-s" + Date.now();
          sessions = [...sessions, { id: active, title: text.slice(0, 18), msgs: [] }];
        }
        const placeholder = { role: "ai", text: "", streaming: true, sources: [], laws: [] };
        sessions = sessions.map((x) =>
          x.id === active
            ? {
                ...x,
                title: x.msgs.length ? x.title : text.slice(0, 18),
                msgs: [...x.msgs, { role: "user", text }, placeholder],
              }
            : x
        );
        setChat((prev) => ({
          ...prev,
          streaming: true,
          sessions: { ...prev.sessions, [cid]: sessions },
          active: { ...prev.active, [cid]: active },
        }));

        const finish = () => setChat((x) => ({ ...x, streaming: false }));

        // 로컬 폴백 시뮬레이션 (API 미기동 시)
        const runLocalSim = () => {
          const cur = casesRef.current.find((c) => c.id === cid) || D.CASES[0];
          const out = /시세|오를|내릴|소송|고소|승소|판결/.test(text);
          const r = out ? D.REPLIES.refuse : D.REPLIES[cur.type];
          const full = r.text;
          let i = 0;
          const step = () => {
            i = Math.min(full.length, i + 6);
            const done = i >= full.length;
            updateLastMsg(cid, active, (m) => ({
              ...m,
              text: full.slice(0, i),
              streaming: !done,
              refused: !!r.refused,
              ...(done
                ? {
                    sources: r.sources || [],
                    laws: r.laws || [],
                    canAdd: !!r.canAdd,
                    taskTitle: r.taskTitle,
                  }
                : {}),
            }));
            if (!done) chatTimer.current = setTimeout(step, 40);
            else finish();
          };
          chatTimer.current = setTimeout(step, 400);
        };

        if (!apiOnRef.current) return runLocalSim();

        // 백엔드 SSE 스트리밍 (docs/api-spec.md §8)
        apiStream(
          `/cases/${cid}/chat/sessions/${active}/messages`,
          { text },
          {
            meta: (d) => updateLastMsg(cid, active, (m) => ({ ...m, refused: !!d?.refused })),
            delta: (d) =>
              updateLastMsg(cid, active, (m) => ({ ...m, text: m.text + (d?.text || "") })),
            refs: (d) =>
              updateLastMsg(cid, active, (m) => ({
                ...m,
                sources: d?.sources || [],
                laws: d?.laws || [],
              })),
            done: (d) => {
              updateLastMsg(cid, active, (m) => ({
                ...m,
                streaming: false,
                canAdd: !!d?.canAdd,
                taskTitle: d?.taskTitle,
                // 서버가 스트림 중 오류를 알린 경우 — 빈 답변으로 끝내지 않고 안내
                ...(d?.error
                  ? {
                      error: true,
                      text: m.text || "답변을 만드는 중 문제가 생겼어요. 잠시 후 다시 질문해 주세요.",
                    }
                  : {}),
              }));
              finish();
            },
          }
        ).catch(() => runLocalSim());
      },
      chatMarkAdded: (cid, sessionId, msgIndex) =>
        setChat((s) => ({
          ...s,
          sessions: {
            ...s.sessions,
            [cid]: s.sessions[cid].map((y) =>
              y.id !== sessionId
                ? y
                : {
                    ...y,
                    msgs: y.msgs.map((m, j) =>
                      j === msgIndex ? { ...m, added: true } : m
                    ),
                  }
            ),
          },
        })),
      chatSetActive: (cid, sessionId) =>
        setChat((s) => ({ ...s, active: { ...s.active, [cid]: sessionId } })),
      chatNewSession: (cid) => {
        const id = cid + "-s" + Date.now();
        setChat((s) => ({
          ...s,
          sessions: {
            ...s.sessions,
            [cid]: [...(s.sessions[cid] || []), { id, title: "새 대화", msgs: [] }],
          },
          active: { ...s.active, [cid]: id },
        }));
        sync(`/cases/${cid}/chat/sessions`, { method: "POST", body: { id } });
      },
      chatRenameSession: (cid, sessionId, title) => {
        const trimmed = (title || "").trim().slice(0, 40);
        if (!trimmed) return;
        setChat((s) => ({
          ...s,
          sessions: {
            ...s.sessions,
            [cid]: (s.sessions[cid] || []).map((x) =>
              x.id === sessionId ? { ...x, title: trimmed } : x
            ),
          },
        }));
        sync(`/cases/${cid}/chat/sessions/${sessionId}`, {
          method: "PATCH",
          body: { title: trimmed },
        });
      },
      chatDeleteSession: (cid, sessionId) => {
        setChat((s) => {
          const rest = (s.sessions[cid] || []).filter((x) => x.id !== sessionId);
          const active =
            s.active[cid] === sessionId ? (rest[rest.length - 1]?.id ?? null) : s.active[cid];
          return {
            ...s,
            sessions: { ...s.sessions, [cid]: rest },
            active: { ...s.active, [cid]: active },
          };
        });
        sync(`/cases/${cid}/chat/sessions/${sessionId}`, { method: "DELETE" });
        toast("대화를 삭제했어요");
      },
    };
  }, []);

  const value = {
    loggedIn,
    setLoggedIn,
    consented,
    setConsented,
    caseId,
    setCaseId,
    cases,
    // 현재 케이스 객체 — 목록에 없으면 null (화면은 빈 상태/케이스 생성 안내로 처리)
    currentCase: cases.find((c) => c.id === caseId) ?? null,
    me,
    apiOn,
    docs,
    tasks,
    chat,
    toastMsg,
    law,
    setLaw,
    term,
    setTerm,
    showDiff,
    setShowDiff,
    ...store,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
