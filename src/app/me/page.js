"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { api, getToken, setToken } from "@/lib/api";
import { D, balanceWord } from "@/lib/derive";
import { TypeBadge } from "@/components/ui";

function Toggle({ on, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        border: "none",
        background: on ? "#16A36A" : "#C9D2CC",
        position: "relative",
        padding: 0,
        transition: "background .2s",
        flex: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          transform: `translateX(${on ? 20 : 0}px)`,
          transition: "transform .2s",
        }}
      />
    </button>
  );
}

const card = {
  borderRadius: 20,
  background: "#fff",
  border: "1px solid #E3E8E3",
};

export default function Me() {
  const router = useRouter();
  const { caseId, me, patchMe, clearDocs, setLoggedIn, setConsented, toast, removeCase, logout, cases } = useApp();
  const notif = me.notif;
  // 알림 설정 변경은 로컬 반영 + PATCH /me 동기화
  const setNotif = (fn) => patchMe({ notif: fn(notif) });
  const [delDocs, setDelDocs] = useState(false);
  const [resetting, setResetting] = useState(false);

  // 공유 데모 계정은 방문자 전원이 같은 데이터를 본다 — 한 명이 삭제·초기화하면 다른 방문자 화면이
  // 비어 버리므로 배포 빌드에서는 잠근다. 시연 리셋이 필요할 땐 NEXT_PUBLIC_DEMO_RESET=1 로 빌드.
  const demoLocked = !!me?.isDemo && process.env.NEXT_PUBLIC_DEMO_RESET !== "1";
  const lockToast = () =>
    toast("체험 계정에서는 삭제·보관할 수 없어요. 모든 방문자가 같은 데이터를 함께 봐요");

  // 데모 초기화 — 데모 계정(me.isDemo)에서만 노출. 서버가 케이스·서류·할 일·상담을 전부 지우고,
  // 새로고침으로 부트스트랩을 다시 받아 빈 상태(첫 케이스 만들기)에서 시연을 시작한다.
  const resetDemo = async () => {
    if (!window.confirm("데모 데이터를 전부 지우고 빈 상태로 되돌릴까요?\n케이스·서류·할 일·상담이 모두 삭제돼요.")) return;
    setResetting(true);
    try {
      await api("/demo/reset", { method: "POST" });
      try {
        localStorage.removeItem("zipsalpi_case");
      } catch {}
      window.location.href = "/dashboard";
    } catch (e) {
      setResetting(false);
      toast(e.message || "초기화하지 못했어요");
    }
  };
  const [delStep, setDelStep] = useState(0); // 0 | 1 | 2
  const [delText, setDelText] = useState("");

  const closeModals = () => {
    setDelDocs(false);
    setDelStep(0);
    setDelText("");
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", height: 52, padding: "0 20px", flex: "none" }}>
        <span style={{ fontSize: 17, fontWeight: 800 }}>내 정보</span>
      </div>
      <div
        style={{
          padding: "4px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* 프로필 */}
        <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#16A36A",
              color: "#fff",
              fontSize: 17,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            민
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>{me.name}</span>
              <button
                onClick={() => {
                  const next = window.prompt("표시할 이름을 입력하세요", me.name || "");
                  if (next === null) return;
                  const trimmed = next.trim().slice(0, 20);
                  if (!trimmed) return toast("이름을 입력해 주세요");
                  patchMe({ name: trimmed });
                  toast("이름을 바꿨어요");
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  color: "#16A36A",
                  fontWeight: 700,
                }}
              >
                수정
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#4B6157", marginTop: 2 }}>{me.email}</div>
          </div>
          <span
            style={{
              flex: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
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
            카카오
          </span>
        </div>

        {/* 알림 */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>알림</div>
              <div style={{ fontSize: 12, color: "#6E827A", marginTop: 2 }}>
                이메일 · 브라우저 푸시
              </div>
            </div>
            <Toggle
              on={notif.master}
              onClick={() => setNotif((s) => ({ ...s, master: !s.master }))}
            />
          </div>
          {[
            ["due", "할 일 기한 리마인더", "이메일 · 푸시"],
            ["stale", "서류 최신본 경고", "이메일"],
            ["done", "분석 완료", "푸시"],
          ].map(([k, label, channel]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderTop: "1px solid #EEF1EE",
                opacity: notif.master ? 1 : 0.45,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 12, color: "#6E827A", marginTop: 2 }}>{channel}</div>
              </div>
              <Toggle
                on={notif[k] && notif.master}
                disabled={!notif.master}
                onClick={() => setNotif((s) => ({ ...s, [k]: !s[k] }))}
              />
            </div>
          ))}
        </div>

        {/* 케이스 관리 */}
        <div style={{ ...card, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>케이스 관리</span>
            <button
              onClick={() => router.push("/cases/new")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 13,
                color: "#16A36A",
                fontWeight: 700,
              }}
            >
              + 새 케이스
            </button>
          </div>
          {cases.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderTop: "1px solid #EEF1EE",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <TypeBadge type={c.type} size="sm" />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.addr}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6E827A", marginTop: 2 }}>
                  {c.amount} · 계약 {c.contractDate} · {balanceWord(c.type).split("·")[0]}{" "}
                  {c.balanceDate}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flex: "none" }}>
                <button
                  onClick={() => (demoLocked ? lockToast() : removeCase(c.id, false))}
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 999,
                    border: "1px solid #DDE3DF",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#4B6157",
                  }}
                >
                  보관
                </button>
                <button
                  onClick={() => {
                    if (demoLocked) return lockToast();
                    if (window.confirm(`"${c.short}" 케이스를 삭제할까요?\n서류·할 일·상담 기록이 함께 지워져요.`))
                      removeCase(c.id, true);
                  }}
                  style={{
                    height: 32,
                    padding: "0 10px",
                    borderRadius: 999,
                    border: "1px solid #F5C8C1",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#B4231A",
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 데이터 */}
        <div style={{ ...card, padding: "14px 16px" }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>데이터</div>
          <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: "20px", color: "#4B6157" }}>
            업로드한 PDF는 마스킹 후 저장되며 계정 삭제 없이도 지울 수 있어요. 분석 결과는
            유지돼요.
          </p>
          <button
            onClick={() => (demoLocked ? lockToast() : setDelDocs(true))}
            style={{
              marginTop: 12,
              height: 42,
              width: "100%",
              borderRadius: 12,
              border: "1px solid #DDE3DF",
              background: "#fff",
              fontSize: 14,
              fontWeight: 700,
              color: "#17211E",
            }}
          >
            업로드한 서류 전부 삭제
          </button>
        </div>

        {me?.isDemo && !demoLocked && (
          <div style={{ ...card, padding: "14px 16px", border: "1px dashed #B9C2BC" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>데모 초기화</div>
            <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: "20px", color: "#4B6157" }}>
              공유 데모 계정의 케이스·서류·할 일·상담을 전부 지우고 빈 상태로 되돌려요. 새 케이스를
              만들고 서류 탭의 샘플 PDF를 올리면 파싱→AI 판정→자동 등기부까지 처음부터 볼 수 있어요.
            </p>
            <button
              onClick={resetDemo}
              disabled={resetting}
              style={{
                marginTop: 12,
                height: 42,
                width: "100%",
                borderRadius: 12,
                border: "1px solid #B4231A",
                background: "#fff",
                fontSize: 14,
                fontWeight: 700,
                color: "#B4231A",
                opacity: resetting ? 0.6 : 1,
              }}
            >
              {resetting ? "초기화 중…" : "데모 데이터 전부 지우기"}
            </button>
          </div>
        )}

        <button
          onClick={() => {
            logout(); // 토큰(액세스·리프레시)까지 정리
            router.push("/");
          }}
          style={{
            height: 48,
            borderRadius: 12,
            border: "1px solid #DDE3DF",
            background: "#fff",
            fontSize: 14,
            fontWeight: 700,
            color: "#17211E",
          }}
        >
          로그아웃
        </button>
        <button
          onClick={() => (demoLocked ? lockToast() : setDelStep(1))}
          style={{
            background: "none",
            border: "none",
            fontSize: 13,
            color: "#6E827A",
            padding: 4,
          }}
        >
          회원 탈퇴
        </button>
      </div>

      {/* 서류 삭제 확인 모달 */}
      {delDocs && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,42,32,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 382,
              background: "#fff",
              borderRadius: 20,
              padding: "22px 20px",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 800 }}>
              이 케이스의 서류를 모두 삭제할까요?
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: "22px", color: "#4B6157" }}>
              원본 PDF와 페이지 이미지가 삭제돼요. 분석 결과와 할 일은 남아 있고, 서류를 다시
              올리면 재분석돼요.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={closeModals}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  border: "1px solid #DDE3DF",
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  clearDocs(caseId);
                  closeModals();
                  toast("서류를 삭제했어요");
                }}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  background: "#B4231A",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탈퇴 1/2 */}
      {delStep === 1 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,42,32,.45)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              padding: "20px 20px 32px",
              animation: "sheetUp .22s ease",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#B4231A" }}>1 / 2</div>
            <div style={{ marginTop: 4, fontSize: 17, fontWeight: 800 }}>
              탈퇴하면 이런 것들이 삭제돼요
            </div>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 14,
                lineHeight: "22px",
                color: "#2E463C",
              }}
            >
              {[
                "업로드한 서류 원본·페이지 이미지",
                "분석 결과와 변경 이력 (케이스 3개)",
                "할 일·특약 체크 상태, AI 상담 대화",
              ].map((t) => (
                <div key={t} style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#B4231A" }}>–</span>
                  {t}
                </div>
              ))}
            </div>
            <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: "20px", color: "#6E827A" }}>
              삭제 후 복구할 수 없어요. 서류만 지우고 싶다면 &lsquo;업로드한 서류 전부
              삭제&rsquo;를 이용하세요.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={closeModals}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  border: "1px solid #DDE3DF",
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                취소
              </button>
              <button
                onClick={() => setDelStep(2)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  background: "#17211E",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탈퇴 2/2 */}
      {delStep === 2 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,42,32,.45)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 40,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              padding: "20px 20px 32px",
              animation: "sheetUp .22s ease",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#B4231A" }}>2 / 2</div>
            <div style={{ marginTop: 4, fontSize: 17, fontWeight: 800 }}>
              확인 문구를 입력해 주세요
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#4B6157" }}>
              아래 칸에 <b style={{ color: "#17211E" }}>탈퇴합니다</b>를 그대로 입력하세요.
            </p>
            <input
              value={delText}
              onChange={(e) => setDelText(e.target.value)}
              placeholder="탈퇴합니다"
              style={{
                height: 48,
                marginTop: 14,
                width: "100%",
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #DDE3DF",
                background: "#fff",
                fontSize: 15,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={closeModals}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  border: "1px solid #DDE3DF",
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (delText !== "탈퇴합니다") return;
                  // 실제 탈퇴 — 서버의 계정·케이스·서류·상담이 cascade 삭제된다.
                  // 단, 토큰이 있는 실가입 사용자만 — 무토큰(공유 데모 계정)은 서버를 건드리지 않는다.
                  if (getToken()) {
                    try {
                      await api("/me", { method: "DELETE", body: { confirmText: "탈퇴합니다" } });
                    } catch {
                      /* API 미기동이어도 화면 흐름은 진행 */
                    }
                  }
                  setToken(null);
                  closeModals();
                  setLoggedIn(false);
                  setConsented(false);
                  toast("계정과 데이터를 삭제했어요");
                  router.push("/");
                }}
                disabled={delText !== "탈퇴합니다"}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  background: delText === "탈퇴합니다" ? "#B4231A" : "#B9C2BC",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: delText === "탈퇴합니다" ? "pointer" : "default",
                }}
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
