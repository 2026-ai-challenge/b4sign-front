"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

const TODO = { fontStyle: "italic", color: "#B4231A" };

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "#4B6157" }}>
        {children}
      </div>
    </div>
  );
}

export default function Privacy() {
  const router = useRouter();

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

      <div style={{ padding: "8px 20px 40px", flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
          개인정보처리방침
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6E827A" }}>
          시행일 <span style={TODO}>[입력 필요]</span>
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          회원가입 시: 이름, 이메일, 비밀번호(또는 카카오 소셜 로그인 식별정보)
          <br />
          서비스 이용 시: 이용자가 직접 업로드하는 등기부등본·계약서·건축물대장 문서(및 그 안에
          포함된 소유자·임대인 성명, 주소 등 문서 기재 정보), AI 상담 챗에 입력한 질문 내용
        </Section>

        <Section title="2. 수집 목적">
          업로드한 문서의 룰 기반 위험 점검, 등기부·건축물대장 교차검증, 위험 조항에 대한 AI
          설명·근거 제공, 회원 식별 및 서비스 이용 이력 관리를 위해 이용합니다.
        </Section>

        <Section title="3. 보유 및 이용 기간">
          회원 탈퇴 또는 업로드 문서 삭제 요청 시 지체 없이 파기합니다. 관계 법령에 따라 보관이
          필요한 경우 <span style={TODO}>[보관 항목·기간 — 입력 필요]</span>만큼 별도 보관 후
          파기합니다.
        </Section>

        <Section title="4. 제3자 제공 및 처리위탁">
          문서 분석을 위해 <span style={TODO}>[AI·OCR 등 외부 처리업체명 — 입력 필요]</span>에
          처리를 위탁할 수 있습니다. 법령에 근거하지 않는 한 이용자의 동의 없이 제3자에게
          제공하지 않습니다.
        </Section>

        <Section title="5. 이용자의 권리">
          이용자는 언제든 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 업로드한
          문서는 마이페이지에서 직접 삭제할 수 있습니다. 그 외 요청은 아래 문의처로 연락해
          주세요.
        </Section>

        <Section title="6. 개인정보 보호책임자">
          성명 <span style={TODO}>[입력 필요]</span>
          <br />
          연락처 <span style={TODO}>[입력 필요]</span>
        </Section>
      </div>
    </>
  );
}
