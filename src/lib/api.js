// 백엔드(zipsalpi-api, NestJS) 클라이언트 — 명세: docs/api-spec.md
// API가 꺼져 있으면 각 호출부가 로컬 목 동작으로 폴백한다 (데모 안전장치).

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
export const API_BASE = BASE; // 파일 다운로드 등 직접 링크용

/**
 * API 사용 가능 여부. NEXT_PUBLIC_API_URL이 없으면 localhost 개발 환경에서만
 * 기본 주소(localhost:4000)를 시도한다 — 배포(Vercel)에서는 불필요한 요청과
 * 콘솔 에러 없이 곧장 목 데이터로 동작.
 */
export function apiAvailable() {
  if (process.env.NEXT_PUBLIC_API_URL) return true;
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

const TOKEN_KEY = "zipsalpi_token";
const REFRESH_KEY = "zipsalpi_refresh";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function setRefreshToken(token) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {}
}

/** 로그인 응답 {accessToken, refreshToken} 저장 (둘 다) */
export function saveTokens(res) {
  setToken(res?.accessToken || null);
  setRefreshToken(res?.refreshToken || null);
}

export function clearTokens() {
  setToken(null);
  setRefreshToken(null);
}

/**
 * 액세스 토큰 만료(401) 시 리프레시로 1회 갱신. 실패하면 토큰을 지우고
 * 'auth:expired' 이벤트를 던져 앱이 로그아웃 처리(데모 데이터로 조용히 전환하지 않는다).
 */
let refreshing = null;
export async function refreshAccessToken() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    let refreshToken = null;
    try {
      refreshToken = localStorage.getItem(REFRESH_KEY);
    } catch {}
    if (!refreshToken) return false;
    try {
      const res = await fetch(BASE + "/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      saveTokens(await res.json());
      return true;
    } catch {
      return false;
    }
  })();
  const ok = await refreshing;
  refreshing = null;
  if (!ok) {
    clearTokens();
    try {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    } catch {}
  }
  return ok;
}

export async function api(path, { method = "GET", body } = {}, _retried = false) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // 만료 토큰(401): 리프레시 성공 시 1회 재시도, 실패 시 로그아웃 이벤트 (데모로 바꿔치기 금지)
  if (res.status === 401 && token && !_retried) {
    const ok = await refreshAccessToken();
    if (ok) return api(path, { method, body }, true);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message || `API ${res.status}`);
    err.status = res.status;
    err.code = data?.error?.code;
    err.data = data;
    throw err;
  }
  return data;
}

/** multipart 업로드 (FormData — Content-Type은 브라우저가 boundary와 함께 설정) */
export async function apiUpload(path, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method: "POST", headers, body: formData });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message || `API ${res.status}`);
    err.status = res.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}

/**
 * SSE POST 스트리밍 소비 (AI 상담).
 * handlers: { meta(data), delta(data), refs(data), done(data) }
 */
export async function apiStream(path, body, handlers) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const err = new Error(`stream ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = "message";
      let data = null;
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) {
          try {
            data = JSON.parse(line.slice(6));
          } catch {}
        }
      }
      if (handlers[event]) handlers[event](data);
    }
  }
}
