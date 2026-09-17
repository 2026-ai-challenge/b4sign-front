"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@/design-system";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";

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
  const { toast } = useApp();
  const [step, setStep] = useState("form"); // form | result
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null); // { maskedEmail, provider }
  const [busy, setBusy] = useState(false);

  const find = async () => {
    if (!name.trim()) return toast("이름을 입력해 주세요");
    setBusy(true);
    try {
      const r = await api("/auth/find-id", {
        method: "POST",
        body: { name: name.trim(), emailPrefix: email.trim() || undefined },
      });
      setResult(r);
      setStep("result");
    } catch (e) {
      if (e.status === 404) toast("해당 이름으로 가입된 계정을 찾지 못했어요");
      else if (e.status) toast(e.message);
      else toast("서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

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
            <Button variant="dark" onClick={find} disabled={busy} style={{ marginTop: 20, fontSize: 16 }}>
              {busy ? "찾는 중…" : "찾기"}
            </Button>
          </>
        ) : (
          <>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              일치하는 계정 1개를 찾았어요.
            </p>
            <Card style={{ marginTop: 24, padding: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{result?.maskedEmail}</div>
              {result?.provider === "kakao" && (
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
                <svg width="12" height="11" viewBox="0 0 99.61801 92.147011" aria-hidden="true">
                  <path
                    fill="#191919"
                    d="M49.80801,1c-26.953,0,-48.80801,17.256,-48.80801,38.555,0,13.68101,9.05201,25.69301,22.64601,32.54901l-4.599,17.167c-0.176,0.527,-0.03,1.085,0.352,1.465,0.263,0.265,0.614,0.411,0.995,0.411,0.294,0,0.586,-0.117,0.85,-0.322l19.775,-13.36c2.872,0.41,5.802,0.644,8.789,0.644,26.953,0,48.81,-17.255,48.81,-38.55401,0,-21.299,-21.857,-38.555,-48.81,-38.555z"
                  />
                </svg>
                카카오로 가입됨
              </div>
              )}
              <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.55, color: "#4B6157" }}>
                {result?.provider === "email"
                  ? "이 이메일과 비밀번호로 로그인하세요. 비밀번호를 잊었다면 비밀번호 찾기를 이용해 주세요."
                  : "이 계정은 비밀번호가 없어요. 로그인 화면에서 소셜 버튼을 눌러주세요."}
              </p>
            </Card>
            <Button onClick={() => router.push("/login")} style={{ marginTop: 20, fontSize: 16 }}>
              로그인으로
            </Button>
          </>
        )}
      </div>
    </>
  );
}
