"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { D, buildDocList } from "@/lib/derive";
import { TypeBadge } from "@/components/ui";
import { api, apiUpload } from "@/lib/api";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";
const MAX_SIZE = 20 * 1024 * 1024;
const fmtSize = (b) =>
  b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + "MB" : Math.ceil(b / 1024) + "KB";

export default function DocumentsPage() {
  return (
    <Suspense>
      <Documents />
    </Suspense>
  );
}

// 분석 실패 3종: 원인과 해결 방법을 다르게 안내 (api-spec §4 reason 코드와 동일)
const FAILS = {
  scan: {
    title: "스캔 품질이 낮아요",
    body: "글자가 흐릿하거나 기울어져 있어요. 인터넷등기소에서 PDF로 직접 발급하거나 300dpi 이상으로 다시 스캔해 주세요.",
    cta: "다시 올리기",
  },
  unsupported: {
    title: "지원하지 않는 서류예요",
    body: "등기부등본·계약서·건축물대장·확정일자 서류만 분석할 수 있어요. 파일이 맞는지 확인해 주세요.",
    cta: "다른 파일 선택",
  },
  extract: {
    title: "텍스트를 읽지 못했어요",
    body: "이미지로만 된 PDF라 글자를 추출할 수 없었어요. 원본 PDF(텍스트 포함)로 다시 올리면 바로 분석돼요.",
    cta: "다시 올리기",
  },
};

function Documents() {
  const router = useRouter();
  const params = useSearchParams();
  const { caseId, docs, completeUpload, refreshDocs, apiOn, toast } = useApp();
  const cur = D.CASES.find((c) => c.id === caseId);
  const docList = buildDocList(caseId, docs[caseId]);

  // 업로드 모달 상태: { docKey, stage: 'pick'|'progress'|'analyzing'|'fail', pct, eta, fail, demoFail, fileName, fileSize }
  const [upload, setUpload] = useState(null);
  const timer = useRef(null);
  const fileRef = useRef(null); // 파일 선택 input
  const cameraRef = useRef(null); // 카메라 촬영 input (모바일)

  // /documents?upload=registry 로 진입하면 모달 자동 오픈
  // &fail=scan|unsupported|extract 를 붙이면 해당 실패 플로우 데모
  useEffect(() => {
    const key = params.get("upload");
    const fail = params.get("fail");
    if (key && D.DOCS[key])
      setUpload({ docKey: key, stage: "pick", demoFail: fail || undefined });
  }, [params]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const finishUpload = (key) => {
    completeUpload(caseId, key);
    refreshDocs(caseId);
    toast("분석이 끝났어요");
    const hasText = D.DOCTEXT[caseId] && D.DOCTEXT[caseId][key];
    router.push(hasText ? `/documents/${key}` : "/analysis");
  };

  // 백엔드 업로드: multipart POST → jobId 폴링 (uploading/analyzing/done/failed)
  const startUploadApi = async (key, demoFail, file) => {
    let jobId;
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("docKey", key);
      if (demoFail) fd.append("demoFail", demoFail);
      ({ jobId } = await apiUpload(`/cases/${caseId}/documents`, fd));
    } else {
      ({ jobId } = await api(`/cases/${caseId}/documents`, {
        method: "POST",
        body: { docKey: key, demoFail },
      }));
    }
    const poll = async () => {
      let j;
      try {
        j = await api(`/jobs/${jobId}`);
      } catch {
        setUpload(null);
        return;
      }
      if (j.status === "uploading") {
        setUpload((u) => u && { ...u, stage: "progress", pct: j.progress });
      } else if (j.status === "analyzing") {
        setUpload((u) => u && { ...u, stage: "analyzing", eta: j.eta });
      } else if (j.status === "failed") {
        setUpload((u) => u && { ...u, stage: "fail", fail: j.reason });
        return;
      } else if (j.status === "done") {
        setUpload(null);
        finishUpload(key);
        return;
      }
      timer.current = setTimeout(poll, 400);
    };
    timer.current = setTimeout(poll, 300);
  };

  // 파일 선택/촬영 결과 처리 — 모바일에서는 탭하면 파일 선택 또는 카메라가 뜬다
  const onFilePicked = (file) => {
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toast("파일이 너무 커요. 20MB 이하로 올려주세요.");
      return;
    }
    const key = upload.docKey;
    const demoFail = upload.demoFail;
    setUpload((u) => ({
      ...u,
      stage: "progress",
      pct: 0,
      fileName: file.name,
      fileSize: file.size,
    }));
    if (apiOn) {
      startUploadApi(key, demoFail, file).catch((e) => {
        if (e.code === "UNSUPPORTED_FILE_TYPE") {
          setUpload((u) => u && { ...u, stage: "fail", fail: "unsupported" });
        } else {
          startUploadLocal(key, demoFail);
        }
      });
      return;
    }
    startUploadLocal(key, demoFail);
  };

  // 로컬 폴백 시뮬레이션 (API 미기동 시)
  const startUploadLocal = (key, demoFail) => {
    let pct = 0;
    const tick = () => {
      pct = Math.min(100, pct + 9 + Math.random() * 12);
      setUpload((u) => ({ ...u, stage: "progress", pct }));
      if (pct < 100) {
        timer.current = setTimeout(tick, 160);
        return;
      }
      let eta = 12;
      setUpload((u) => ({ ...u, stage: "analyzing", eta }));
      const t2 = () => {
        eta -= 4;
        if (eta > 0) {
          setUpload((u) => ({ ...u, eta }));
          timer.current = setTimeout(t2, 700);
          return;
        }
        if (demoFail) {
          setUpload((u) => u && { ...u, stage: "fail", fail: demoFail });
          return;
        }
        setUpload(null);
        finishUpload(key);
      };
      timer.current = setTimeout(t2, 700);
    };
    timer.current = setTimeout(tick, 200);
  };

  const closeUpload = () => {
    clearTimeout(timer.current);
    setUpload(null);
    if (params.get("upload")) router.replace("/documents");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 52,
          padding: "0 20px",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800 }}>서류</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: "#6E827A",
          }}
        >
          <TypeBadge type={cur.type} size="sm" />
          {cur.short}
        </span>
      </div>

      <div style={{ padding: "8px 20px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {docList.map((d) => (
            <div
              key={d.key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 14,
                borderRadius: 18,
                background: "#fff",
                border: `1px solid ${d.border}`,
                minHeight: 150,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "4px 9px",
                    borderRadius: 999,
                    background: d.st.bg,
                    color: d.st.fg,
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  {d.st.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#8A968F" }}>{d.req}</span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "#6E827A", lineHeight: 1.5, flex: 1 }}>
                {d.meta}
              </div>
              {d.marks > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {d.markChips.map((m) => (
                    <span
                      key={m.glyph}
                      style={{
                        padding: "2px 7px",
                        borderRadius: 5,
                        background: m.bg,
                        color: m.fg,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {m.glyph} {m.n}
                    </span>
                  ))}
                </div>
              )}
              {d.stale && (
                <div style={{ fontSize: 12, color: "#7A4E00", lineHeight: 1.45 }}>
                  ! 발급 {d.days}일 경과 — 재발급 권장
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                {d.has ? (
                  <>
                    <button
                      onClick={() => router.push(`/documents/${d.key}`)}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 999,
                        border: "none",
                        background: "#1B7F5C",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      보기
                    </button>
                    <button
                      onClick={() => setUpload({ docKey: d.key, stage: "pick" })}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 999,
                        border: "1px solid #CFE3D8",
                        background: "#fff",
                        color: "#1B7F5C",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      재업로드
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setUpload({ docKey: d.key, stage: "pick" })}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 999,
                      border: "none",
                      background: "#EEF6F1",
                      color: "#14613F",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    올리기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* 등기 변동 모니터링 진입 */}
        <button
          onClick={() => router.push("/registry-watch")}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            gap: 12,
            marginTop: 14,
            padding: "14px",
            borderRadius: 16,
            background: "#0F2A20",
            border: "none",
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: 18, flex: "none" }}>🔍</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "#fff" }}>
              등기 변동 모니터링
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "#9BD3B9", marginTop: 2 }}>
              3개월 주기 재확인 · 재업로드 시 변동 자동 비교
            </span>
          </span>
          <span style={{ flex: "none", color: "rgba(255,255,255,.6)", fontSize: 14 }}>›</span>
        </button>
        <p style={{ margin: "16px 0 0", fontSize: 12, lineHeight: 1.6, color: "#6E827A" }}>
          업로드 시 주민등록번호 뒷자리는 자동 마스킹 후 저장돼요. 원본은 보관하지 않으며, 케이스
          삭제 시 함께 지워집니다.
        </p>
      </div>

      {/* 업로드 바텀시트 */}
      {upload && (
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1B7F5C" }}>
                  {D.DOCS[upload.docKey].name}
                </div>
                <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800 }}>
                  {
                    {
                      pick: "서류 올리기",
                      progress: "업로드 중",
                      analyzing: "분석 중",
                      fail: "분석 실패",
                    }[upload.stage]
                  }
                </div>
              </div>
              <button
                onClick={closeUpload}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "#F1F3F1",
                  fontSize: 16,
                  color: "#4B6157",
                }}
              >
                ×
              </button>
            </div>

            {upload.stage === "pick" && (
              <>
                {/* 실제 파일 선택 — 모바일에서 탭하면 파일 앱/사진첩이 열린다 */}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  hidden
                  onChange={(e) => {
                    onFilePicked(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {/* 카메라 촬영 (모바일에서 후면 카메라 바로 실행) */}
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => {
                    onFilePicked(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    display: "flex",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    height: 140,
                    marginTop: 18,
                    borderRadius: 16,
                    border: "1.5px dashed #9BD3B9",
                    background: "#F4FAF6",
                    color: "#14613F",
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>↑</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    눌러서 파일 선택
                  </span>
                  <span style={{ fontSize: 12, color: "#6E827A" }}>
                    PDF · 사진(JPG·PNG·HEIC) · 최대 20MB · 스캔본 가능
                  </span>
                </button>
                <button
                  onClick={() => cameraRef.current?.click()}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    height: 46,
                    marginTop: 10,
                    borderRadius: 999,
                    border: "1px solid #CFE3D8",
                    background: "#fff",
                    color: "#1B7F5C",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  📷 카메라로 촬영하기
                </button>
                <p style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.55, color: "#6E827A" }}>
                  업로드 즉시 주민등록번호 뒷자리를 마스킹하고, 원본은 저장하지 않아요. 사진은
                  문서 전체가 나오게, 최대한 정면에서 찍어주세요.
                </p>
              </>
            )}

            {upload.stage === "progress" && (
              <>
                <div
                  style={{
                    marginTop: 22,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginRight: 8,
                    }}
                  >
                    {upload.fileName || `${D.DOCS[upload.docKey].name}.pdf`}
                  </span>
                  <span style={{ color: "#6E827A", flex: "none" }}>
                    {Math.round(upload.pct || 0)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "#E6EBE7",
                    marginTop: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(upload.pct || 0)}%`,
                      background: "#1B7F5C",
                      borderRadius: 4,
                      transition: "width .15s",
                    }}
                  />
                </div>
                <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#6E827A" }}>
                  {upload.fileSize ? fmtSize(upload.fileSize) : ""} · 업로드 중
                </p>
              </>
            )}

            {upload.stage === "analyzing" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: "2.5px solid #CFE3D8",
                      borderTopColor: "#1B7F5C",
                      animation: "spin .9s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    분석 중 · 약 {upload.eta}초 남음
                  </span>
                </div>
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {["60%", "90%", "75%"].map((w, i) => (
                    <div
                      key={w}
                      style={{
                        height: 14,
                        width: w,
                        borderRadius: 7,
                        background: "#E6EBE7",
                        animation: `sk 1.4s infinite ${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
                <p style={{ margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#6E827A" }}>
                  텍스트 추출 → 항목 판정(룰) → 설명 생성(AI) 순서로 진행돼요. 완료되면 문서
                  뷰어로 이동합니다.
                </p>
              </>
            )}

            {upload.stage === "fail" && (
              <>
                <div
                  style={{
                    marginTop: 18,
                    padding: 16,
                    borderRadius: 14,
                    background: "#FDE8E4",
                    border: "1px solid #F5C8C1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#B4231A",
                    }}
                  >
                    <span>▲</span>
                    {FAILS[upload.fail]?.title ?? "분석에 실패했어요"}
                  </div>
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: "#7A2A22",
                    }}
                  >
                    {FAILS[upload.fail]?.body ??
                      "잠시 후 다시 시도해 주세요. 문제가 계속되면 다른 파일로 올려보세요."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button
                    onClick={closeUpload}
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
                    나중에
                  </button>
                  <button
                    onClick={() =>
                      // 재시도: 데모 실패 플래그를 지워 이번엔 성공 플로우로
                      setUpload({ docKey: upload.docKey, stage: "pick" })
                    }
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
                    {FAILS[upload.fail]?.cta ?? "다시 올리기"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
