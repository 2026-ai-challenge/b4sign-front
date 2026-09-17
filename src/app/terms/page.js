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

export default function Terms() {
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
          이용약관
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6E827A" }}>
          시행일 <span style={TODO}>[입력 필요]</span>
        </p>

        <Section title="제1조 (목적)">
          이 약관은 B4SIGN(비포사인, 이하 "회사")이 제공하는 부동산 계약 전 서류 점검 서비스(이하
          "서비스")의 이용조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 정하는 것을
          목적으로 합니다.
        </Section>

        <Section title="제2조 (서비스의 내용 및 한계)">
          서비스는 이용자가 업로드한 등기부등본·계약서·건축물대장을 정해진 규칙(룰)에 따라
          점검하고, 위험할 수 있는 조항을 문서 원문 위에 표시하며, 그 근거와 쉬운 설명을 함께
          제공합니다.
          <br />
          <br />
          서비스는 법률 자문이 아니며, 최종 계약 여부에 대한 판단은 이용자 본인의 책임입니다.
          서비스는 업로드된 문서 원본의 위·변조 여부를 확인하지 않으며, 계약 당일 인터넷등기소
          등에서 원본을 직접 재열람할 것을 권장합니다.
        </Section>

        <Section title="제3조 (이용자의 의무)">
          이용자는 본인 명의 또는 정당한 권한이 있는 문서만 업로드해야 하며, 타인의 개인정보가
          포함된 문서를 무단으로 업로드해서는 안 됩니다. 서비스를 통해 얻은 분석 결과를 무단으로
          복제·배포·재판매할 수 없습니다.
        </Section>

        <Section title="제4조 (면책조항)">
          회사는 서비스가 제공하는 분석 결과의 정확성을 위해 노력하나, 이를 유일한 판단 근거로
          삼아 발생한 손해에 대해서는 <span style={TODO}>[면책 범위 — 법무 검토 후 입력 필요]</span>의
          범위에서 책임을 지지 않습니다. 중요한 계약 결정은 반드시 법무사·변호사 등 전문가와
          상의하시기 바랍니다.
        </Section>

        <Section title="제5조 (회사 정보 및 문의)">
          상호 <span style={TODO}>[입력 필요]</span>
          <br />
          사업자등록번호 <span style={TODO}>[입력 필요]</span>
          <br />
          대표자 <span style={TODO}>[입력 필요]</span>
          <br />
          주소 <span style={TODO}>[입력 필요]</span>
          <br />
          문의처 <span style={TODO}>[입력 필요]</span>
        </Section>

        <Section title="제6조 (분쟁 해결)">
          서비스 이용과 관련해 발생한 분쟁은 대한민국 법령에 따르며, 관할 법원은{" "}
          <span style={TODO}>[입력 필요]</span>로 합니다.
        </Section>
      </div>
    </>
  );
}
