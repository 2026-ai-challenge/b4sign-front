"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
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
        background: on ? "#1B7F5C" : "#C9D2CC",
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
          left: on ? 23 : 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          transition: "left .2s",
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
  const { caseId, me, patchMe, clearDocs, setLoggedIn, setConsented, toast } = useApp();
  const notif = me.notif;
  // 알림 설정 변경은 로컬 반영 + PATCH /me 동기화
  const setNotif = (fn) => patchMe({ notif: fn(notif) });
  const [delDocs, setDelDocs] = useState(false);
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
        <span style={{ fontSize: 18, fontWeight: 800 }}>내 정보</span>
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
              background: "#1B7F5C",
              color: "#fff",
              fontSize: 18,
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
                onClick={() => toast("이름 수정 (데모)")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  color: "#1B7F5C",
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
              gap: 5,
              padding: "4px 9px",
              borderRadius: 999,
              background: "#FEE500",
              color: "#191919",
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 11,
                height: 10,
                background: "#191919",
                borderRadius: "50% 50% 50% 50%/60% 60% 40% 40%",
                display: "inline-block",
              }}
            />
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
                fontSize: 12.5,
                color: "#1B7F5C",
                fontWeight: 700,
              }}
            >
              + 새 케이스
            </button>
          </div>
          {D.CASES.map((c) => (
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
                  onClick={() => toast("보관함으로 옮겼어요")}
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
                  onClick={() => toast("삭제 전 확인 모달이 열려요 (데모)")}
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
          <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#4B6157" }}>
            업로드한 PDF는 마스킹 후 저장되며 계정 삭제 없이도 지울 수 있어요. 분석 결과는
            유지돼요.
          </p>
          <button
            onClick={() => setDelDocs(true)}
            style={{
              marginTop: 12,
              height: 42,
              width: "100%",
              borderRadius: 999,
              border: "1px solid #DDE3DF",
              background: "#fff",
              fontSize: 13.5,
              fontWeight: 700,
              color: "#0F2A20",
            }}
          >
            업로드한 서류 전부 삭제
          </button>
        </div>

        <button
          onClick={() => {
            setLoggedIn(false);
            router.push("/");
          }}
          style={{
            height: 48,
            borderRadius: 999,
            border: "1px solid #DDE3DF",
            background: "#fff",
            fontSize: 14,
            fontWeight: 700,
            color: "#0F2A20",
          }}
        >
          로그아웃
        </button>
        <button
          onClick={() => setDelStep(1)}
          style={{
            background: "none",
            border: "none",
            fontSize: 13,
            color: "#6E827A",
            textDecoration: "underline",
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
            <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#4B6157" }}>
              원본 PDF와 페이지 이미지가 삭제돼요. 분석 결과와 할 일은 남아 있고, 서류를 다시
              올리면 재분석돼요.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={closeModals}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 999,
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
                  borderRadius: 999,
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
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800 }}>
              탈퇴하면 이런 것들이 삭제돼요
            </div>
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 14,
                lineHeight: 1.5,
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
            <p style={{ margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#6E827A" }}>
              삭제 후 복구할 수 없어요. 서류만 지우고 싶다면 &lsquo;업로드한 서류 전부
              삭제&rsquo;를 이용하세요.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={closeModals}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 999,
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
                  borderRadius: 999,
                  border: "none",
                  background: "#0F2A20",
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
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800 }}>
              확인 문구를 입력해 주세요
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "#4B6157" }}>
              아래 칸에 <b style={{ color: "#0F2A20" }}>탈퇴합니다</b>를 그대로 입력하세요.
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
                  borderRadius: 999,
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
                  if (delText !== "탈퇴합니다") return;
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
                  borderRadius: 999,
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
