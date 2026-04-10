import type { ReactNode } from "react";
import "./landingpage.css";
import { GridBackground } from "@/app/components/grid-background";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-surface">
      <GridBackground />
      <div className="marketing-shell">{children}</div>
    </div>
  );
}
