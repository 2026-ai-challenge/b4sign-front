"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { api, setToken } from "@/lib/api";

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

export default function Signup() {
  const router = useRouter();
  const { setLoggedIn, toast } = useApp();
  const [step, setStep] = useState("form"); // form | code
  const [su, setSu] = useState({ email: "", pw: "", pw2: "", name: "", code: "" });
  const [devCode, setDevCode] = useState(null); // 메일 미연동(dev) 시 서버가 알려주는 코드
  const [codeErr, setCodeErr] = useState(null);
  const set = (k) => (e) => setSu((s) => ({ ...s, [k]: e.target.value }));

  // 인증 코드 요청 — 실제 API (메일 프로바이더 미설정이면 devCode 응답)
  const requestCode = async () => {
    try {
      const r = await api("/auth/signup", {
        method: "POST",
        body: { email: su.email, password: su.pw, name: su.name || undefined },
      });
      setDevCode(r.devCode || null);
      setStep("code");
    } catch (e) {
      if (e.status) toast(e.message);
      else setStep("code"); // API 미기동: 로컬 데모로 진행
    }
  };

  const verifyCode = async () => {
    try {
      const r = await api("/auth/signup/verify", {
        method: "POST",
        body: { email: su.email, code: su.code },
      });
      if (r?.accessToken) setToken(r.accessToken);
      setLoggedIn(true);
      router.push("/signup/consent");
    } catch (e) {
      if (e.code === "CODE_INVALID") setCodeErr("인증 코드가 맞지 않아요.");
      else if (e.code === "CODE_EXPIRED") setCodeErr("코드가 만료됐어요. 다시 받아주세요.");
      else if (e.status) setCodeErr(e.message);
      else {
        // API 미기동: 로컬 데모로 진행
        setLoggedIn(true);
        router.push("/signup/consent");
      }
    }
  };

  const resendCode = async () => {
    try {
      const r = await api("/auth/signup/resend", { method: "POST", body: { email: su.email } });
      setDevCode(r.devCode || null);
      toast("코드를 다시 보냈어요");
    } catch (e) {
      toast(e.status === 429 ? e.message : "코드를 다시 보냈어요");
    }
  };

  const pwOk = {
    len: su.pw.length >= 8,
    num: /\d/.test(su.pw),
    sp: /[^A-Za-z0-9]/.test(su.pw),
  };
  const mismatch = su.pw2.length > 0 && su.pw2 !== su.pw;
  const ok = su.email.includes("@") && pwOk.len && pwOk.num && pwOk.sp && su.pw === su.pw2;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: 52, padding: "0 12px", flex: "none" }}>
        <button
          onClick={() => (step === "code" ? setStep("form") : router.push("/login"))}
          style={{ background: "none", border: "none", fontSize: 22, color: "#0F2A20", padding: "6px 10px" }}
        >
          ‹
        </button>
      </div>
      <div style={{ padding: "8px 20px 32px", flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1B7F5C" }}>
          {step === "form" ? "1 / 2" : "2 / 2"}
        </div>
        <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
          {step === "form" ? "회원가입" : "이메일 인증"}
        </h1>

        {step === "form" ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              <input value={su.email} onChange={set("email")} placeholder="이메일" style={inputStyle()} />
              <input
                value={su.pw}
                onChange={set("pw")}
                type="password"
                placeholder="비밀번호"
                style={inputStyle()}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  ["8자 이상", pwOk.len],
                  ["숫자 포함", pwOk.num],
                  ["특수문자 포함", pwOk.sp],
                ].map(([label, on]) => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 9px",
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 600,
                      background: on ? "#E3F3E9" : "#F1F3F1",
                      color: on ? "#14613F" : "#8A968F",
                    }}
                  >
                    {on ? "✓" : "·"} {label}
                  </span>
                ))}
              </div>
              <input
                value={su.pw2}
                onChange={set("pw2")}
                type="password"
                placeholder="비밀번호 확인"
                style={inputStyle(mismatch ? "#B4231A" : "#DDE3DF")}
              />
              {mismatch && (
                <div style={{ fontSize: 12, color: "#B4231A", marginTop: -4 }}>
                  비밀번호가 서로 달라요
                </div>
              )}
              <input value={su.name} onChange={set("name")} placeholder="이름 (선택)" style={inputStyle()} />
            </div>
            <button
              onClick={() => ok && requestCode()}
              disabled={!ok}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                marginTop: 20,
                background: ok ? "#0F2A20" : "#B9C2BC",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 16,
                cursor: ok ? "pointer" : "default",
              }}
            >
              인증 코드 받기
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157", lineHeight: 1.55 }}>
              <b style={{ color: "#0F2A20" }}>{su.email}</b>로 6자리 코드를 보냈어요. 10분 안에
              입력해 주세요.
            </p>
            {devCode && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#F1F3F1",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: "#6E827A",
                }}
              >
                개발 모드 (메일 프로바이더 미연결) · 인증 코드:{" "}
                <b style={{ color: "#0F2A20", letterSpacing: ".1em" }}>{devCode}</b>
              </div>
            )}
            <input
              value={su.code}
              onChange={(e) => {
                setCodeErr(null);
                set("code")(e);
              }}
              placeholder="000000"
              maxLength={6}
              style={{
                height: 60,
                marginTop: 24,
                width: "100%",
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #DDE3DF",
                background: "#fff",
                fontSize: 26,
                letterSpacing: ".3em",
                textAlign: "center",
                outline: "none",
                fontWeight: 700,
              }}
            />
            {codeErr && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: "#B4231A" }}>▲ {codeErr}</div>
            )}
            <button
              onClick={() => {
                if (su.code.length < 6) return;
                verifyCode();
              }}
              disabled={su.code.length < 6}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                marginTop: 16,
                background: su.code.length >= 6 ? "#0F2A20" : "#B9C2BC",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 16,
                cursor: su.code.length >= 6 ? "pointer" : "default",
              }}
            >
              확인
            </button>
            <button
              onClick={resendCode}
              style={{
                display: "block",
                margin: "16px auto 0",
                background: "none",
                border: "none",
                color: "#4B6157",
                fontSize: 13,
                textDecoration: "underline",
              }}
            >
              코드 다시 보내기
            </button>
          </>
        )}
      </div>
    </>
  );
}
