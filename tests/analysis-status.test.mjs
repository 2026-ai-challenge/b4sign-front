import test from "node:test";
import assert from "node:assert/strict";
import { D, caseCounts, buildDocList } from "../src/lib/derive.js";

test("판정 불가나 누락된 판정을 안전으로 집계하지 않는다", () => {
  const cases = [
    [[], "unknown"],
    [[{ st: "unknown" }], "unknown"],
    [[{ st: "safe" }, { st: "unknown" }], "unknown"],
    [[{ st: "safe" }, {}], "unknown"],
    [[{ st: "safe" }, { st: "unexpected" }], "unknown"],
    [[{ st: "safe" }], "safe"],
    [[{ st: "unknown" }, { st: "warn" }], "warn"],
    [[{ st: "danger" }, { st: "unknown" }], "danger"],
    [[{ deadline: true, due: "2026-10-01" }], "unknown"],
  ];
  try {
    for (const [items, expected] of cases) {
      D.ANALYSIS.test = items;
      const result = caseCounts("test");
      assert.equal(result.overall.key, expected, JSON.stringify(items));
      assert.ok(Object.values(result.counts).every(Number.isFinite));
    }
  } finally {
    delete D.ANALYSIS.test;
  }
});

test("업로드 상태만으로 텍스트 추출 완료를 단정하지 않는다", () => {
  const docs = buildDocList("c1", {
    registry: { status: "ok" },
    contract: { status: "stale", issued: "2026-08-01" },
  });
  assert.equal(docs.find((d) => d.key === "registry").meta, "발급일 확인 필요");
  assert.equal(docs.find((d) => d.key === "contract").meta, "발급일 2026-08-01");
  assert.ok(docs.every((d) => !d.meta.includes("추출 완료") && !d.meta.includes("undefined")));
});
