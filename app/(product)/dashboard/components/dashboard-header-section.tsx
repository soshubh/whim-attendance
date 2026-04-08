import type { ReactNode } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon, Settings02Icon } from "@hugeicons/core-free-icons";

type DashboardHeaderSectionProps = {
  firstName: string;
  localDateTime: string;
  identityName: string;
  email: string | null;
  userInitial: string;
  activePanel: "settings" | "setup" | "activity" | null;
  onToggleSetup: () => void;
  onToggleSettings: () => void;
  setupIcon: ReactNode;
};

export function DashboardHeaderSection({
  firstName,
  localDateTime,
  identityName,
  email,
  userInitial,
  activePanel,
  onToggleSetup,
  onToggleSettings,
  setupIcon,
}: DashboardHeaderSectionProps) {
  return (
    <section className="app-dashboard-identity-panel">
      <div className="app-dashboard-identity-copy">
        <h1 className="app-dashboard-identity-title">{`Welcome, ${firstName}.`}</h1>
        <p className="app-dashboard-identity-meta">
          {localDateTime || "Local date and time"}
        </p>
      </div>

      <div className="app-dashboard-identity-actions">
        <button
          type="button"
          className="app-dashboard-settings-trigger"
          aria-label="Open setup panel"
          title="Open setup panel"
          aria-pressed={activePanel === "setup"}
          onClick={onToggleSetup}
        >
          {setupIcon}
        </button>
        <button
          type="button"
          className="app-dashboard-settings-trigger"
          aria-label="Open settings"
          aria-pressed={activePanel === "settings"}
          onClick={onToggleSettings}
        >
          <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="size-5" />
        </button>
        <div className="app-dashboard-profile-menu">
          <button
            type="button"
            className="app-dashboard-profile-badge"
            aria-label="Open account menu"
          >
            {userInitial}
          </button>
          <div className="app-dashboard-profile-popover">
            <div className="app-dashboard-profile-popover-copy">
              <strong>{identityName}</strong>
              <span>{email ?? "No email available"}</span>
            </div>
            <a className="app-dashboard-profile-popover-action" href="/logout">
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} className="size-4" />
              Log out
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
