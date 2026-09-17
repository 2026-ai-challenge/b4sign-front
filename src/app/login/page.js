"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useApp } from "@/lib/store";
import { api, saveTokens } from "@/lib/api";
import { Button } from "@/design-system";

const ERR = {
  cred: {
    bg: "#FDE8E4",
    fg: "#B4231A",
    Icon: ExclamationCircleIcon,
    text: "이메일 또는 비밀번호가 맞지 않아요. 5회 이상 틀리면 잠시 잠겨요.",
  },
  social: {
    bg: "#FFF1D6",
    fg: "#7A4E00",
    Icon: ExclamationTriangleIcon,
    text: "이 이메일은 카카오로 가입되어 있어요. 위의 카카오 버튼으로 로그인해 주세요.",
  },
  lock: {
    bg: "#FDE8E4",
    fg: "#B4231A",
    Icon: ExclamationCircleIcon,
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
  const { loggedIn, setLoggedIn, consented, setConsented, toast } = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const e = err ? ERR[err] : null;

  const afterAuth = () => router.push(consented ? "/dashboard" : "/signup/consent");
  const pass = (tokens) => {
    if (tokens?.accessToken) saveTokens(tokens); // 액세스+리프레시 둘 다 저장
    setLoggedIn(true);
    afterAuth();
  };
  // 데모/심사용: 실제 인증 없이 바로 둘러보기 (동의 절차도 건너뜀)
  const demoLogin = () => {
    setConsented(true);
    setLoggedIn(true);
    router.push("/dashboard");
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
    } catch (e) {
      // 서버가 응답한 오류(거절)는 통과시키지 않는다 — 네트워크 미기동(status 없음)만 로컬 데모
      if (e.status) toast(e.message || "소셜 로그인을 사용할 수 없어요");
      else pass(null);
    }
  };
  const emailLogin = async () => {
    try {
      pass(await api("/auth/login", { method: "POST", body: { email, password: pw } }));
    } catch (e) {
      if (e.status === 409) setErr("social");
      else if (e.status === 429) setErr("lock");
      else if (e.status === 400 || e.status === 401) setErr("cred");
      else if (e.status) toast(e.message || "로그인에 실패했어요");
      else localRules(); // 네트워크 오류(API 미기동)만 로컬 데모 규칙
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: 52, padding: "0 12px", flex: "none" }}>
        <button
          onClick={() => router.push("/")}
          style={{ background: "none", border: "none", color: "#17211E", padding: "6px 10px", display: "flex" }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
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
            <svg width="18" height="17" viewBox="0 0 99.61801 92.147011" aria-hidden="true">
              <path
                fill="#191919"
                d="M49.80801,1c-26.953,0,-48.80801,17.256,-48.80801,38.555,0,13.68101,9.05201,25.69301,22.64601,32.54901l-4.599,17.167c-0.176,0.527,-0.03,1.085,0.352,1.465,0.263,0.265,0.614,0.411,0.995,0.411,0.294,0,0.586,-0.117,0.85,-0.322l19.775,-13.36c2.872,0.41,5.802,0.644,8.789,0.644,26.953,0,48.81,-17.255,48.81,-38.55401,0,-21.299,-21.857,-38.555,-48.81,-38.555z"
              />
            </svg>
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
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.5399-1.8368.8577-3.0477.8577-2.3436 0-4.3282-1.5831-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
              <path fill="#FBBC05" d="M3.9641 10.71c-.18-.5399-.2822-1.1168-.2822-1.71s.1023-1.1701.2822-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z" />
              <path fill="#EA4335" d="M9 3.5799c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.163 6.6564 3.5799 9 3.5799z" />
            </svg>
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
            <e.Icon style={{ width: 16, height: 16, flex: "none" }} />
            <span>{e.text}</span>
          </div>
        )}
        <Button variant="dark" onClick={emailLogin} style={{ marginTop: 14, fontSize: 16 }}>
          로그인
        </Button>
        <Button variant="secondary" onClick={demoLogin} style={{ marginTop: 8, fontSize: 14 }}>
          데모로 둘러보기
        </Button>
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
            style={{ background: "none", border: "none", color: "#16A36A", fontWeight: 700, fontSize: 13, padding: 0 }}
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
              fontSize: 12,
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
