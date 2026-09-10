import "./globals.css";
import { AppProvider } from "@/lib/store";
import { Shell } from "@/components/ui";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFAF7",
};

export const metadata = {
  title: "B4SIGN(비포사인) — 4 checks before you sign",
  description:
    "사인하기 전, 놓치면 안 되는 계약 위험을 확인하세요. 등기부등본·계약서·건축물대장을 올리면 위험한 줄을 문서 위에 표시해 드려요.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
