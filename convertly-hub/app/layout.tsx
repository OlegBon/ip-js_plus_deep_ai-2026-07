import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import Header from "@/components/core/Header";
import Footer from "@/components/core/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-family-headings",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-family-mono",
});

export const metadata: Metadata = {
  title: "Convertly Hub | Seamless File Conversion",
  description: "Convert images and documents with ease. Get your API key and start building.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body className="bg-background text-text-primary min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
