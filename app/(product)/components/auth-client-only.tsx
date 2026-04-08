"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function AuthClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}
