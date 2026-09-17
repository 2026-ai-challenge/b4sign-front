// B4SIGN 디자인 토큰 — 소스: 2026-09-11 브랜드킷(docs/superpowers/specs/2026-09-14-b4sign-design-system-design.md 참고)
export const color = {
  primary: "#16A36A",
  primaryMid: "#3B9C7A",
  primaryTint: "#E8F4F0",
  primarySoft: "#BFE5D8",
  ink: "#17211E",

  textSecondary: "#4B6157",
  textTertiary: "#5A6660",
  border: "#DDE3DF",
  borderSoft: "#E3E8E3",
  borderFaint: "#E8ECE9", // 상하 28~32px 여백이 이미 구분해주는 큰 컨테이너용 — 선을 거의 안 보이게
  bgMuted: "#F4F6F4",
  bgShell: "#E9EAE4",
  white: "#FFFFFF",

  safeBg: "#E3F3E9",
  safeFg: "#14613F",
  warnBg: "#FFF1D6",
  warnFg: "#7A4E00",
  dangerBg: "#FDE8E4",
  dangerFg: "#B4231A",
  unknownBg: "#ECEEEC",
  unknownFg: "#5A6660",

  jeonse: "#3B5BDB",
  jeonseBg: "#EDF2FF",
  wolse: "#0B7285",
  wolseBg: "#E3FAFC",
  maemae: "#6741D9",
  maemaeBg: "#F3F0FF",
};

export const font = {
  family: '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif',
  // 2026-09-14 정리: 19개 임의값(11~34, 소수점 포함) → 10단계 정수 스케일로 통합
  size: {
    micro: 11, // 아주 작은 라벨(뱃지 안쪽 등)
    caption: 12, // 캡션, 보조 라벨
    sm: 13, // 보조 본문
    body: 14, // 기본 본문
    md: 15, // 강조 본문, 버튼 텍스트
    lg: 16, // 입력창, 큰 버튼
    title: 17, // 화면/섹션 타이틀
    xl: 20, // 카드 타이틀, 숫자 강조
    heading: 26, // 페이지 제목(로그인 등)
    display: 34, // 랜딩 히어로
  },
  weight: { regular: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 },
};

export const space = [0, 4, 8, 12, 16, 20, 24, 28, 32];
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };
