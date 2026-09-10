"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function FindId() {
  const router = useRouter();
  const [step, setStep] = useState("form"); // form | result
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

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
          아이디 찾기
        </h1>
        {step === "form" ? (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              가입 시 입력한 이름과 이메일 앞부분을 알려주세요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름"
                style={inputStyle}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 앞 2자 이상 (예: dl)"
                style={inputStyle}
              />
            </div>
            <button
              onClick={() => setStep("result")}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                marginTop: 20,
                background: "#0F2A20",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              찾기
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              일치하는 계정 1개를 찾았어요.
            </p>
            <div
              style={{
                marginTop: 24,
                padding: 18,
                borderRadius: 16,
                background: "#fff",
                border: "1px solid #E3E8E3",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800 }}>dl***@gmail.com</div>
              <div
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "#FEE500",
                  color: "#191919",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 11,
                    background: "#191919",
                    borderRadius: "50% 50% 50% 50%/60% 60% 40% 40%",
                    display: "inline-block",
                  }}
                />
                카카오로 가입됨
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.55, color: "#4B6157" }}>
                이 계정은 비밀번호가 없어요. 로그인 화면에서 카카오 버튼을 눌러주세요.
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                marginTop: 20,
                background: "#1B7F5C",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              로그인으로
            </button>
          </>
        )}
      </div>
    </>
  );
}
