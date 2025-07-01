// En: frontend/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header"; // <--- IMPORTA TU HEADER
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TokenCrafter - Crea tu Criptomoneda con IA",
  description: "Diseña, define y lanza tu token personalizado sin necesidad de código.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
          <Header />
          {children}
      </body>
    </html>
  );
}