import { GridBackground } from "@/app/components/grid-background";

import { AdminDashboardClient } from "./admin-dashboard-client";

export default function AdminPage() {
  return (
    <div className="product-surface">
      <GridBackground />
      <AdminDashboardClient />
    </div>
  );
}
