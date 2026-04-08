import type { ReactNode } from "react";
import "./landingpage.css";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-surface">
      <div className="marketing-shell">{children}</div>
    </div>
  );
}
