import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Providers } from "./providers"; // <-- 1. IMPORTA EL PROVEEDOR
import { Toaster } from 'sonner';

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
        <Providers> {/* <-- 2. ENVUELVE TODO CON PROVIDERS */}
          <Header />
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}