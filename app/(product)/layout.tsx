import type { ReactNode } from "react";
import "./product.css";
import { AccountStatusGuard } from "./components/account-status-guard";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AccountStatusGuard />
      {children}
    </>
  );
}
