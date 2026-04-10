import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { MarketingFooter } from "./marketing-footer";
import { Navigation } from "./navigation";

type MarketingPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function MarketingPageShell({
  children,
  className,
}: MarketingPageShellProps) {
  return (
    <main className={cn("marketing-page", className)}>
      <Navigation />
      {children}
      <MarketingFooter />
    </main>
  );
}
