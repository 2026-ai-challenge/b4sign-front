import test from "node:test";
import assert from "node:assert/strict";
import { uploadDocument } from "../src/lib/document-upload.js";

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "Content-Type": "application/json" },
});
const options = () => ({
  caseId: "c1", docKey: "registry",
  file: new File(["sample"], "registry.pdf", { type: "application/pdf" }),
  pollIntervalMs: 1, timeoutMs: 1000,
});

test("서버 done 응답이 있어야 업로드를 완료한다", async (t) => {
  const calls = [];
  const responses = [{ jobId: "job-1" }, { status: "uploading", progress: 70 }, { status: "analyzing", eta: 2 }, { status: "done" }];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return json(responses.shift());
  });
  const progress = [];
  const result = await uploadDocument({ ...options(), onProgress: (job) => progress.push(job.status) });
  assert.equal(result.status, "done");
  assert.deepEqual(progress, ["uploading", "analyzing"]);
  assert.equal(calls.length, 4);
  assert.equal(calls[0].init.body.get("docKey"), "registry");
  assert.ok(calls.slice(1).every((c) => c.url.endsWith("/jobs/job-1")));
});

for (const status of [401, 413, 500]) {
  test(`업로드 HTTP ${status} 오류를 성공으로 바꾸지 않는다`, async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => json({ error: { message: "실패" } }, status));
    await assert.rejects(uploadDocument(options()), (error) => error.status === status);
    assert.equal(fetch.mock.callCount(), 1);
  });
}

test("폴링 네트워크 오류가 호출자에게 전달된다", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    if (++calls === 1) return json({ jobId: "j" });
    throw new TypeError("offline");
  });
  await assert.rejects(uploadDocument(options()), /offline/);
  assert.equal(calls, 2);
});

test("분석 실패 사유를 보존한다", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => json(++calls === 1
    ? { jobId: "j" } : { status: "failed", reason: "scan" }));
  await assert.rejects(uploadDocument(options()), (e) => e.code === "ANALYSIS_FAILED" && e.reason === "scan");
});

test("잘못된 응답으로 무한 폴링하지 않는다", async (t) => {
  for (const responses of [[null], [{ jobId: "j" }, { status: "unexpected" }]]) {
    const fetch = t.mock.method(globalThis, "fetch", async () => json(responses.shift()));
    await assert.rejects(uploadDocument(options()));
    assert.ok(fetch.mock.callCount() <= 2);
    fetch.mock.restore();
  }
});

test("창 닫기 취소가 진행 중인 요청을 중단한다", async (t) => {
  const controller = new AbortController();
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  t.mock.method(globalThis, "fetch", (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    started();
  }));
  const pending = uploadDocument({ ...options(), signal: controller.signal });
  await ready;
  controller.abort();
  await assert.rejects(pending, (e) => e.name === "AbortError");
});

test("서버가 응답하지 않아도 제한 시간 뒤 종료한다", async (t) => {
  t.mock.method(globalThis, "fetch", (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
  await assert.rejects(uploadDocument({ ...options(), timeoutMs: 15 }), (e) => e.code === "UPLOAD_TIMEOUT");
});
