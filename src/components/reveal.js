"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤 리빌: 뷰포트에 들어오면 부드럽게 슬라이드업 + 페이드인.
 * prefers-reduced-motion 사용자는 애니메이션 없이 즉시 표시.
 */
export function Reveal({ children, delay = 0, y = 26 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : `translateY(${y}px)`,
        transition: `opacity .65s ease ${delay}ms, transform .65s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
