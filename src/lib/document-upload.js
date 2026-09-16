import { api, apiUpload } from "./api.js";

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** 서버 업로드만 수행한다. 오류를 데모 성공으로 바꾸지 않는다. */
export async function uploadDocument({
  caseId, docKey, file, demoFail, signal, onProgress,
  timeoutMs = 120000, pollIntervalMs = 400,
}) {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timeoutError = Object.assign(new Error("분석 응답 시간이 초과됐어요"), { code: "UPLOAD_TIMEOUT" });
  const deadline = setTimeout(() => controller.abort(timeoutError), timeoutMs);
  const requestSignal = controller.signal;

  try {
    requestSignal.throwIfAborted();
    const form = new FormData();
    form.append("file", file);
    form.append("docKey", docKey);
    if (demoFail) form.append("demoFail", demoFail);
    const result = await apiUpload(`/cases/${caseId}/documents`, form, { signal: requestSignal });
    if (!result?.jobId) throw new Error("분석 작업 ID가 없어요");

    for (;;) {
      await wait(pollIntervalMs, requestSignal);
      const job = await api(`/jobs/${encodeURIComponent(result.jobId)}`, { signal: requestSignal });
      requestSignal.throwIfAborted();
      if (job?.status === "done") return job;
      if (job?.status === "failed") {
        throw Object.assign(new Error("문서 분석에 실패했어요"), {
          code: "ANALYSIS_FAILED", reason: job.reason,
        });
      }
      if (!["uploading", "analyzing"].includes(job?.status)) {
        throw new Error("알 수 없는 분석 상태예요");
      }
      onProgress?.(job);
    }
  } catch (error) {
    // 브라우저별 fetch 취소 오류와 관계없이 타임아웃 원인을 보존한다.
    if (requestSignal.aborted) throw requestSignal.reason;
    throw error;
  } finally {
    clearTimeout(deadline);
    signal?.removeEventListener("abort", cancel);
  }
}
