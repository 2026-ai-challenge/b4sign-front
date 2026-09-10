"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤 리빌: 스크롤 컨테이너([data-scroll-root]) 기준으로 화면에 들어오면
 * 부드럽게 슬라이드업 + 페이드인.
 *
 * prefers-reduced-motion(Windows "애니메이션 효과" 끔 포함) 환경에서는
 * 통째로 끄지 않고 저강도 모션(8px·0.45s)으로 낮춰서 보여준다 —
 * 무한 반복·큰 패럴랙스가 아니라면 이 수준은 허용 가능한 절충.
 */
export function Reveal({ children, delay = 0, y = 26 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    if (!el) return;
    // 앱 셸은 내부 div가 스크롤 컨테이너라, 뷰포트가 아닌 그 컨테이너를 root로.
    const root = el.closest("[data-scroll-root]");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { root, threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dist = reduced.current ? 8 : y;
  const dur = reduced.current ? 0.45 : 0.65;

  return (
    <div
      ref={ref}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : `translateY(${dist}px)`,
        transition: `opacity ${dur}s ease ${delay}ms, transform ${dur}s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
