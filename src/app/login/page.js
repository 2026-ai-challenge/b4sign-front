"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { api, setToken } from "@/lib/api";

const ERR = {
  cred: {
    bg: "#FDE8E4",
    fg: "#B4231A",
    glyph: "▲",
    text: "이메일 또는 비밀번호가 맞지 않아요. 5회 이상 틀리면 잠시 잠겨요.",
  },
  social: {
    bg: "#FFF1D6",
    fg: "#7A4E00",
    glyph: "!",
    text: "이 이메일은 카카오로 가입되어 있어요. 위의 카카오 버튼으로 로그인해 주세요.",
  },
  lock: {
    bg: "#FDE8E4",
    fg: "#B4231A",
    glyph: "▲",
    text: "로그인 시도가 너무 많아요. 15분 후 다시 시도해 주세요. (429)",
  },
};

const inputStyle = (borderColor = "#DDE3DF") => ({
  height: 48,
  padding: "0 14px",
  borderRadius: 12,
  border: `1px solid ${borderColor}`,
  background: "#fff",
  fontSize: 15,
  outline: "none",
  width: "100%",
});

export default function Login() {
  const router = useRouter();
  const { loggedIn, setLoggedIn, consented } = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const e = err ? ERR[err] : null;

  const afterAuth = () => router.push(consented ? "/dashboard" : "/signup/consent");
  const pass = (tokens) => {
    if (tokens?.accessToken) setToken(tokens.accessToken);
    setLoggedIn(true);
    afterAuth();
  };
  // 로컬 데모 규칙 (API 미기동 시 폴백)
  const localRules = () => {
    if (/kakao/i.test(email)) return setErr("social");
    if (/lock/i.test(email)) return setErr("lock");
    if (!pw || !email) return setErr("cred");
    pass(null);
  };
  const socialLogin = async (provider) => {
    try {
      pass(await api(`/auth/social/${provider}`, { method: "POST", body: { authCode: "demo" } }));
    } catch {
      pass(null); // API 미기동 폴백
    }
  };
  const emailLogin = async () => {
    try {
      pass(await api("/auth/login", { method: "POST", body: { email, password: pw } }));
    } catch (e) {
      if (e.status === 409) setErr("social");
      else if (e.status === 429) setErr("lock");
      else if (e.status === 400) setErr("cred");
      else localRules(); // 네트워크 오류 → 로컬 데모 규칙
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: 52, padding: "0 12px", flex: "none" }}>
        <button
          onClick={() => router.push("/")}
          style={{ background: "none", border: "none", fontSize: 22, color: "#0F2A20", padding: "6px 10px" }}
        >
          ‹
        </button>
      </div>
      <div style={{ padding: "8px 20px 32px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>로그인</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
          계약 진행 상황은 계정에 저장돼요.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <button
            onClick={() => socialLogin("kakao")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 50,
              borderRadius: 12,
              border: "none",
              background: "#FEE500",
              color: "#191919",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 18,
                height: 16,
                background: "#191919",
                borderRadius: "50% 50% 50% 50%/60% 60% 40% 40%",
                display: "inline-block",
              }}
            />
            카카오로 계속하기
          </button>
          <button
            onClick={() => socialLogin("google")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 50,
              borderRadius: 12,
              border: "1px solid #DADCE0",
              background: "#fff",
              color: "#1F1F1F",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "conic-gradient(#EA4335 0 25%,#FBBC05 0 50%,#34A853 0 75%,#4285F4 0)",
                display: "inline-block",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 5,
                  background: "#fff",
                  borderRadius: "50%",
                }}
              />
            </span>
            Google로 계속하기
          </button>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "22px 0",
            color: "#9AA8A1",
            fontSize: 12,
          }}
        >
          <span style={{ flex: 1, height: 1, background: "#E3E8E3" }} />
          또는 이메일로
          <span style={{ flex: 1, height: 1, background: "#E3E8E3" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              setErr(null);
            }}
            placeholder="이메일"
            style={inputStyle(e ? e.fg : "#DDE3DF")}
          />
          <input
            value={pw}
            onChange={(ev) => {
              setPw(ev.target.value);
              setErr(null);
            }}
            type="password"
            placeholder="비밀번호"
            style={inputStyle(e ? e.fg : "#DDE3DF")}
          />
        </div>
        {e && (
          <div
            style={{
              marginTop: 10,
              padding: "12px 14px",
              borderRadius: 12,
              background: e.bg,
              color: e.fg,
              fontSize: 13,
              lineHeight: 1.5,
              display: "flex",
              gap: 8,
            }}
          >
            <span style={{ fontWeight: 900 }}>{e.glyph}</span>
            <span>{e.text}</span>
          </div>
        )}
        <button
          onClick={emailLogin}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            height: 52,
            marginTop: 14,
            background: "#0F2A20",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          로그인
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 14,
            marginTop: 18,
            fontSize: 13,
            color: "#4B6157",
          }}
        >
          <button
            onClick={() => router.push("/signup")}
            style={{ background: "none", border: "none", color: "#1B7F5C", fontWeight: 700, fontSize: 13, padding: 0 }}
          >
            회원가입
          </button>
          <span style={{ color: "#CFD6D2" }}>|</span>
          <button
            onClick={() => router.push("/find-id")}
            style={{ background: "none", border: "none", color: "#4B6157", fontSize: 13, padding: 0 }}
          >
            아이디 찾기
          </button>
          <span style={{ color: "#CFD6D2" }}>|</span>
          <button
            onClick={() => router.push("/find-password")}
            style={{ background: "none", border: "none", color: "#4B6157", fontSize: 13, padding: 0 }}
          >
            비밀번호 찾기
          </button>
        </div>
        <div
          style={{
            marginTop: "auto",
            paddingTop: 28,
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "#F1F3F1",
              fontSize: 11.5,
              lineHeight: 1.6,
              color: "#6E827A",
            }}
          >
            데모: 이메일에 <b>kakao</b> 포함 → 소셜 가입 안내 · <b>lock</b> 포함 → 시도 초과 ·
            비밀번호 비움 → 자격증명 오류
          </div>
        </div>
      </div>
    </>
  );
}
