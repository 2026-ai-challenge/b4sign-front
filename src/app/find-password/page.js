"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/design-system";

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
          style={{ background: "none", border: "none", color: "#17211E", padding: "6px 10px", display: "flex" }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
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
            <Button
              variant="dark"
              onClick={() => {
                if (!email) setEmail("dlminji@gmail.com");
                setStep("sent");
              }}
              style={{ marginTop: 20, fontSize: 16 }}
            >
              재설정 메일 보내기
            </Button>
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
                  background: "#16A36A",
                  color: "#fff",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckIcon style={{ width: 22, height: 22 }} />
              </div>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700 }}>메일을 보냈어요</div>
              <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: "#4B6157" }}>
                {email || "dlminji@gmail.com"}
                <br />
                링크는 30분 동안 유효해요. 스팸함도 확인해 주세요.
              </p>
            </div>
            <Button variant="secondary" size="md" onClick={() => setStep("reset")} style={{ marginTop: 20, fontSize: 14 }}>
              (데모) 메일의 링크 열기
            </Button>
            <button
              onClick={() => setStep("expired")}
              style={{
                display: "block",
                margin: "12px auto 0",
                background: "none",
                border: "none",
                color: "#6E827A",
                fontSize: 13,
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
            <Button variant="dark" onClick={() => setStep("done")} style={{ marginTop: 20, fontSize: 16 }}>
              비밀번호 변경
            </Button>
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
            <Button onClick={() => router.push("/login")} style={{ marginTop: 20, fontSize: 16 }}>
              로그인으로
            </Button>
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
                <ExclamationCircleIcon style={{ width: 17, height: 17 }} />링크가 만료됐어요
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "#7A2A22" }}>
                재설정 링크는 30분 동안만 유효해요. 새 링크를 다시 요청해 주세요.
              </p>
            </div>
            <Button variant="dark" onClick={() => setStep("email")} style={{ marginTop: 20, fontSize: 16 }}>
              다시 요청하기
            </Button>
          </>
        )}
      </div>
    </>
  );
}
