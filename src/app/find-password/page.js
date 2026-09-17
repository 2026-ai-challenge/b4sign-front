"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/design-system";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";

const TITLES = {
  email: "비밀번호 찾기",
  code: "인증 코드 확인",
  done: "완료",
};

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

/**
 * 비밀번호 재설정 — 이메일로 6자리 코드 발송(10분) → 코드 + 새 비밀번호 → 저장.
 * 백엔드: POST /auth/password-reset/request → /confirm (메일 미연동 dev 환경에선 devCode 표시)
 */
export default function FindPassword() {
  const router = useRouter();
  const { toast } = useApp();
  const [step, setStep] = useState("email"); // email | code | done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [devCode, setDevCode] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    if (!email.includes("@")) return setErr("이메일을 확인해 주세요.");
    setBusy(true);
    setErr(null);
    try {
      const r = await api("/auth/password-reset/request", { method: "POST", body: { email } });
      setDevCode(r.devCode || null);
      setStep("code");
    } catch (e) {
      setErr(e.status ? e.message : "서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (code.length !== 6) return setErr("6자리 코드를 입력해 주세요.");
    if (pw.length < 8) return setErr("새 비밀번호는 8자 이상이어야 해요.");
    if (pw !== pw2) return setErr("비밀번호 확인이 일치하지 않아요.");
    setBusy(true);
    setErr(null);
    try {
      await api("/auth/password-reset/confirm", {
        method: "POST",
        body: { email, code, newPassword: pw },
      });
      setStep("done");
    } catch (e) {
      if (e.code === "CODE_INVALID") setErr("인증 코드가 맞지 않아요.");
      else if (e.code === "CODE_EXPIRED") setErr("코드가 만료됐어요. 처음부터 다시 진행해 주세요.");
      else setErr(e.status ? e.message : "서버에 연결할 수 없어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: 52, padding: "0 12px", flex: "none" }}>
        <button
          onClick={() => (step === "code" ? setStep("email") : router.push("/login"))}
          style={{ background: "none", border: "none", color: "#17211E", padding: "6px 10px", display: "flex" }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </button>
      </div>
      <div style={{ padding: "8px 20px 32px", flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>{TITLES[step]}</h1>

        {step === "email" && (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              가입한 이메일로 6자리 인증 코드를 보내드려요. (10분간 유효)
            </p>
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr(null);
              }}
              placeholder="이메일"
              type="email"
              style={{ ...inputStyle, marginTop: 24 }}
            />
            {err && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#B4231A" }}>{err}</p>}
            <Button variant="dark" onClick={request} disabled={busy} style={{ marginTop: 20, fontSize: 16 }}>
              {busy ? "보내는 중…" : "인증 코드 받기"}
            </Button>
          </>
        )}

        {step === "code" && (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              <b>{email}</b>로 코드를 보냈어요. 코드와 새 비밀번호를 입력해 주세요.
            </p>
            {devCode && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#FFF1D6",
                  color: "#7A4E00",
                  fontSize: 13,
                }}
              >
                개발 모드: 메일 발송 대신 코드를 표시해요 — <b>{devCode}</b>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setErr(null);
                }}
                inputMode="numeric"
                placeholder="6자리 인증 코드"
                style={{ ...inputStyle, letterSpacing: ".2em", fontWeight: 700 }}
              />
              <input
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setErr(null);
                }}
                type="password"
                placeholder="새 비밀번호 (8자 이상)"
                style={inputStyle}
              />
              <input
                value={pw2}
                onChange={(e) => {
                  setPw2(e.target.value);
                  setErr(null);
                }}
                type="password"
                placeholder="새 비밀번호 확인"
                style={inputStyle}
              />
            </div>
            {err && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#B4231A" }}>{err}</p>}
            <Button variant="dark" onClick={confirm} disabled={busy} style={{ marginTop: 20, fontSize: 16 }}>
              {busy ? "변경 중…" : "비밀번호 변경"}
            </Button>
            <button
              onClick={request}
              disabled={busy}
              style={{
                display: "block",
                margin: "14px auto 0",
                background: "none",
                border: "none",
                fontSize: 13,
                color: "#4B6157",
                textDecoration: "underline",
              }}
            >
              코드 다시 받기
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <div
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: 16,
                background: "#EEF6F1",
                textAlign: "center",
              }}
            >
              <CheckIcon style={{ width: 28, height: 28, color: "#14613F" }} />
              <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700 }}>비밀번호를 변경했어요</div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#4B6157" }}>
                새 비밀번호로 로그인해 주세요.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} style={{ marginTop: 20, fontSize: 16 }}>
              로그인으로
            </Button>
          </>
        )}
      </div>
    </>
  );
}
