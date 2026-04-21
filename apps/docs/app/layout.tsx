import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RootProvider } from "@farming-labs/theme";
import docsConfig from "../docs.config";
import "./global.css";

const geistSans = Geist({
  variable: "--fd-font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--fd-font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Docs",
    template: docsConfig.metadata?.titleTemplate ?? "%s",
  },
  description: docsConfig.metadata?.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
