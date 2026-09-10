"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { TermButton } from "@/components/ui";

// 입주 당일 하자 체크 (계약서 기준으로 대조하며 전부 사진·영상 기록)
const MOVE_IN = [
  ["도배·장판 상태", "계약서 특약에 교체 약정이 있으면 실제로 됐는지 대조"],
  ["누수·결로 흔적", "천장·창틀·베란다 모서리의 얼룩과 곰팡이"],
  ["보일러·급수·배수", "온수 나오는지, 물 잘 빠지는지, 보일러 작동음"],
  ["창호·현관 잠금장치", "잠김·파손 여부, 도어락 배터리"],
  ["옵션 가전 작동", "에어컨·세탁기·냉장고 등 계약서에 적힌 옵션 전부"],
  ["벽·바닥 파손, 못 자국", "입주 전부터 있던 것임을 날짜 있는 사진으로 증거"],
];

// 퇴거할 때 주의
const MOVE_OUT = [
  {
    title: "보증금 전액 받기 전에 비밀번호·열쇠를 넘기지 마세요",
    desc: "집을 먼저 비워주면 보증금 협상력이 사라져요. 반환과 인도는 같은 자리에서 맞바꾸는 게 원칙이에요.",
  },
  {
    title: "보증금은 깎아서 받는 게 아니에요",
    desc: "하자 비용이 있다면 임대인이 보증금 전액을 돌려준 뒤 별도로 청구하는 게 원칙이에요. 일방적으로 공제하고 주면 내역서를 요구하세요.",
  },
  {
    title: "장기수선충당금 정산",
    desc: "아파트·오피스텔에서 관리비로 낸 장기수선충당금은 퇴거 시 소유자에게 돌려받을 수 있어요. 관리사무소에서 납부 내역을 떼세요.",
  },
  {
    title: "관리비·공과금 정산 확인",
    desc: "이사 당일 검침값 기준으로 정산하고, 정산서를 사진으로 남기세요.",
  },
];

export default function Moving() {
  const router = useRouter();
  const { toast } = useApp();
  const [checked, setChecked] = useState({});

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 52,
          padding: "0 12px",
          flex: "none",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", fontSize: 22, color: "#0F2A20", padding: "6px 10px" }}
        >
          ‹
        </button>
        <span style={{ fontSize: 17, fontWeight: 800 }}>📦 이사 체크리스트</span>
      </div>

      <div style={{ padding: "4px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 입주 당일 하자 체크 */}
        <div
          style={{
            borderRadius: 18,
            background: "#fff",
            border: "1px solid #E3E8E3",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800 }}>입주 당일 하자 체크</div>
          <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#4B6157" }}>
            계약서(시설 상태·옵션·특약)를 기준으로 대조하고, 전부{" "}
            <b>날짜가 남는 사진·영상</b>으로 기록하세요. 퇴거 시 원상복구 분쟁의 증거가 돼요.
          </p>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {MOVE_IN.map(([title, desc], i) => (
              <button
                key={title}
                onClick={() => {
                  setChecked((s) => ({ ...s, [i]: !s[i] }));
                  if (!checked[i]) toast("체크! 사진도 꼭 남겨두세요 📸");
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #EEF1EE",
                  background: checked[i] ? "#F4FAF6" : "#fff",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    flex: "none",
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${checked[i] ? "#1B7F5C" : "#C9D2CC"}`,
                    background: checked[i] ? "#1B7F5C" : "#fff",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 900,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  {checked[i] ? "✓" : ""}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{title}</span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: "#6E827A",
                      marginTop: 2,
                    }}
                  >
                    {desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 집주인 권리가 아닌 것 */}
        <div
          style={{
            borderRadius: 18,
            background: "#EEF6F1",
            border: "1px solid #CFE3D8",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: "#14613F" }}>
            알아두세요 — 이런 건 집주인의 권리가 아니에요
          </div>
          <ul
            style={{
              margin: "10px 0 0",
              paddingLeft: 18,
              fontSize: 13,
              lineHeight: 1.7,
              color: "#2E463C",
            }}
          >
            <li>
              <b>통상적인 마모</b>(벽지 변색, 가구 눌린 자국, 소량의 못 자국)는 원상복구 대상이
              아니에요 — 판례는 자연스러운 사용에 따른 손모를 임대인 부담으로 봐요
            </li>
            <li>2년 살았다고 도배·장판을 새로 해줄 의무는 없어요 (특약으로 강요하면 불리 조항)</li>
            <li>
              보일러·배관 같은 주요 설비 고장 수리는 <b>임대인 의무</b>예요 (민법 제623조)
            </li>
          </ul>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#4B6157" }}>
            근거가 궁금하면 분석 결과의 <b>§ 법 근거</b> 카드나{" "}
            <TermButton termKey="daehang">용어 사전</TermButton>을 참고하세요.
          </p>
        </div>

        {/* 퇴거할 때 */}
        <div
          style={{
            borderRadius: 18,
            background: "#fff",
            border: "1px solid #E3E8E3",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800 }}>퇴거할 때 꼭 지키세요</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {MOVE_OUT.map((m) => (
              <div
                key={m.title}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#F4F6F4",
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{m.title}</div>
                <div
                  style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.55, color: "#4B6157" }}
                >
                  {m.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
