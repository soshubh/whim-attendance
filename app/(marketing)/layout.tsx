import type { ReactNode } from "react";
import "./landingpage.css";
import { MarketingGridBackground } from "./components/grid";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-surface">
      <MarketingGridBackground />
      <div className="marketing-shell">{children}</div>
    </div>
  );
}
