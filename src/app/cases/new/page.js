"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useApp } from "@/lib/store";
import { D } from "@/lib/derive";
import { AddressField, DateField } from "@/components/fields";
import { Button, Card } from "@/design-system";

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

export default function NewCase() {
  const router = useRouter();
  const { addCase, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const [nc, setNc] = useState({
    type: "jeonse",
    housing: "아파트",
    addrBase: "",
    addrDetail: "",
    amount: "",
    contract: "",
    balance: "",
  });
  const set = (k) => (e) => setNc((s) => ({ ...s, [k]: e.target.value }));
  const typ = D.TYPES[nc.type];

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
          style={{ background: "none", border: "none", color: "#17211E", padding: "6px 10px", display: "flex" }}
        >
          <ChevronLeftIcon style={{ width: 20, height: 20 }} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800 }}>새 케이스</span>
      </div>
      <div style={{ padding: "4px 20px 32px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#6E827A" }}>어떤 계약인가요?</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
            marginTop: 10,
          }}
        >
          {Object.values(D.TYPES).map((t) => {
            const on = nc.type === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setNc((s) => ({ ...s, type: t.key }))}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                  padding: "14px 12px",
                  borderRadius: 16,
                  border: `2px solid ${on ? t.color : "#E3E8E3"}`,
                  background: on ? t.bg : "#fff",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 17, fontWeight: 800, color: t.color }}>{t.label}</span>
                <span style={{ fontSize: 12, lineHeight: 1.45, color: "#4B6157" }}>
                  {t.risk.split(": ")[0]}
                </span>
              </button>
            );
          })}
        </div>
        <Card radius={14} style={{ marginTop: 14, padding: 14, fontSize: 13, lineHeight: 1.55, color: "#4B6157" }}>
          <b style={{ color: "#17211E" }}>{typ.label}</b>에서 집중해서 보는 것 ·{" "}
          {typ.focus.join(" · ")}
        </Card>

        <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: "#6E827A" }}>
          기본 정보
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          <AddressField
            base={nc.addrBase}
            detail={nc.addrDetail}
            onBase={(v) => setNc((s) => ({ ...s, addrBase: v }))}
            onDetail={(v) => setNc((s) => ({ ...s, addrDetail: v }))}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {["아파트", "빌라·다세대", "오피스텔"].map((h) => {
              const on = nc.housing === h;
              return (
                <button
                  key={h}
                  onClick={() => setNc((s) => ({ ...s, housing: h }))}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 999,
                    border: `1px solid ${on ? "#17211E" : "#DDE3DF"}`,
                    background: on ? "#17211E" : "#fff",
                    color: on ? "#fff" : "#17211E",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {h}
                </button>
              );
            })}
          </div>
          <input
            value={nc.amount}
            onChange={set("amount")}
            placeholder={typ.amountLabel}
            style={inputStyle}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <DateField
              value={nc.contract}
              onChange={(v) => setNc((s) => ({ ...s, contract: v }))}
              placeholder="계약 예정일"
              marks={
                nc.balance
                  ? [
                      {
                        date: nc.balance,
                        color: "#16A36A",
                        label: nc.type === "maemae" ? "잔금 예정일" : "입주 예정일",
                      },
                    ]
                  : []
              }
            />
            <DateField
              value={nc.balance}
              onChange={(v) => setNc((s) => ({ ...s, balance: v }))}
              placeholder={nc.type === "maemae" ? "잔금 예정일" : "입주 예정일"}
              marks={
                nc.contract
                  ? [{ date: nc.contract, color: "#B4231A", label: "계약 예정일" }]
                  : []
              }
            />
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 13, fontWeight: 700, color: "#6E827A" }}>
          필요한 서류
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {typ.docs.map(([k, req]) => (
            <Card
              key={k}
              radius={12}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px" }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{D.DOCS[k].name}</div>
                <div style={{ fontSize: 12, color: "#6E827A" }}>{D.DOCS[k].where}</div>
              </div>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: req === "필수" ? "#EEF6F1" : "#F1F3F1",
                  color: req === "필수" ? "#14613F" : "#5A6660",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {req}
              </span>
            </Card>
          ))}
        </div>

        <Button
          onClick={async () => {
            if (!nc.addrBase) return toast("주소를 검색해서 선택해 주세요");
            setBusy(true);
            try {
              // 서버에 실제 케이스 생성 (법정동코드는 서버가 주소로 자동 보완) → 그 케이스로 전환
              await addCase({
                type: nc.type,
                housing: nc.housing,
                addr: [nc.addrBase, nc.addrDetail].filter(Boolean).join(", "),
                amount: nc.amount || undefined,
                contractDate: nc.contract || undefined,
                balanceDate: nc.balance || undefined,
              });
              toast("케이스를 만들었어요. 서류를 올려주세요");
              router.push("/documents");
            } catch (e) {
              toast(e.message || "케이스를 만들지 못했어요");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          style={{ marginTop: 20, fontSize: 16 }}
        >
          {busy ? "만드는 중…" : "케이스 만들고 서류 올리기"}
        </Button>
      </div>
    </>
  );
}
