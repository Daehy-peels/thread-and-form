"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === "/auth" || pathname.startsWith("/auth/");

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
