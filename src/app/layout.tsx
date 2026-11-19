import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coy Discover — Meet someone lovely",
  description: "A more thoughtful way to discover a connection. Your privacy comes first.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
