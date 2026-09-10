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
import { api, apiStream } from "@/lib/api";

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
  const [caseId, setCaseId] = useState("c1");
  const [me, setMe] = useState({
    name: "김민지",
    email: "dlminji@gmail.com",
    provider: "kakao",
    notif: { master: true, due: true, stale: true, done: false },
  });
  const [apiOn, setApiOn] = useState(false); // 백엔드 연결 여부 (실패 시 로컬 목으로 동작)
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

  // 백엔드 부트스트랩 — 실패하면 로컬 목 데이터 그대로 사용
  useEffect(() => {
    let cancelled = false;
    api("/bootstrap")
      .then((b) => {
        if (cancelled) return;
        setMe(b.me);
        setDocs(b.docs);
        setTasksState(b.tasks);
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
          const cur = D.CASES.find((c) => c.id === cid);
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
