"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TITLES = {
  email: "비밀번호 찾기",
  sent: "메일 확인",
  reset: "새 비밀번호 설정",
  done: "완료",
  expired: "링크 만료",
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

const cta = (bg = "#0F2A20") => ({
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
  height: 52,
  marginTop: 20,
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: 999,
  fontWeight: 700,
  fontSize: 16,
});

export default function FindPassword() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // email | sent | reset | done | expired
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: 52, padding: "0 12px", flex: "none" }}>
        <button
          onClick={() => router.push("/login")}
          style={{ background: "none", border: "none", fontSize: 22, color: "#0F2A20", padding: "6px 10px" }}
        >
          ‹
        </button>
      </div>
      <div style={{ padding: "8px 20px 32px", flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
          {TITLES[step]}
        </h1>

        {step === "email" && (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              가입한 이메일로 재설정 링크를 보내드려요.
            </p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              style={{ ...inputStyle, marginTop: 24 }}
            />
            <button
              onClick={() => {
                if (!email) setEmail("dlminji@gmail.com");
                setStep("sent");
              }}
              style={cta()}
            >
              재설정 메일 보내기
            </button>
          </>
        )}

        {step === "sent" && (
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
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#1B7F5C",
                  color: "#fff",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                ✓
              </div>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700 }}>메일을 보냈어요</div>
              <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: "#4B6157" }}>
                {email || "dlminji@gmail.com"}
                <br />
                링크는 30분 동안 유효해요. 스팸함도 확인해 주세요.
              </p>
            </div>
            <button
              onClick={() => setStep("reset")}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                marginTop: 20,
                background: "#fff",
                color: "#1B7F5C",
                border: "1px solid #CFE3D8",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              (데모) 메일의 링크 열기
            </button>
            <button
              onClick={() => setStep("expired")}
              style={{
                display: "block",
                margin: "12px auto 0",
                background: "none",
                border: "none",
                color: "#6E827A",
                fontSize: 12.5,
                textDecoration: "underline",
              }}
            >
              (데모) 만료된 링크 열기
            </button>
          </>
        )}

        {step === "reset" && (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              /reset-password?token=8f2a… · 8자 이상, 숫자·특수문자 포함
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                type="password"
                placeholder="새 비밀번호"
                style={inputStyle}
              />
              <input type="password" placeholder="새 비밀번호 확인" style={inputStyle} />
            </div>
            <button onClick={() => setStep("done")} style={cta()}>
              비밀번호 변경
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
              <div style={{ fontSize: 15, fontWeight: 700 }}>비밀번호를 변경했어요</div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#4B6157" }}>
                새 비밀번호로 로그인해 주세요.
              </p>
            </div>
            <button onClick={() => router.push("/login")} style={cta("#1B7F5C")}>
              로그인으로
            </button>
          </>
        )}

        {step === "expired" && (
          <>
            <div
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: 16,
                background: "#FDE8E4",
                border: "1px solid #F5C8C1",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#B4231A",
                }}
              >
                <span>▲</span>링크가 만료됐어요
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "#7A2A22" }}>
                재설정 링크는 30분 동안만 유효해요. 새 링크를 다시 요청해 주세요.
              </p>
            </div>
            <button onClick={() => setStep("email")} style={cta()}>
              다시 요청하기
            </button>
          </>
        )}
      </div>
    </>
  );
}
