import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Better Auth Next.js Drizzle Example",
  description: "Example application with Better Auth, Next.js, and Drizzle",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
