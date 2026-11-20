import type { Metadata } from "next";
import { QueryProvider } from "@/src/providers/query-provider";

import { Titillium_Web } from "next/font/google";
import "./globals.css";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-titillium",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tecno Soluciones",
    template: "%s | Tecno soluciones",
  },
  description: "Sistema de gestion de servicios tecnicos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${titillium.variable} h-full font-sans antialiased`}
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
