import "../styles/globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Decentralized Staker",
  description: "Stake ETH with a deadline-driven pool",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
