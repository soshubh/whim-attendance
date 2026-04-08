import type { ReactNode } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Logout03Icon, Settings02Icon } from "@hugeicons/core-free-icons";

type DashboardTopPanelProps = {
  firstName: string;
  localDateTime: string;
  identityName: string;
  email: string | null;
  userInitial: string;
  activePanel: "settings" | "setup" | "activity" | null;
  isMobileViewport: boolean;
  mobileExpandedPanel: "settings" | "setup" | null;
  isMobileExpandedOpen: boolean;
  mobileExpandedContent?: ReactNode;
  onToggleSetup: () => void;
  onToggleSettings: () => void;
  setupIcon: ReactNode;
};

export function DashboardTopPanel({
  firstName,
  localDateTime,
  identityName,
  email,
  userInitial,
  activePanel,
  isMobileViewport,
  mobileExpandedPanel,
  isMobileExpandedOpen,
  mobileExpandedContent,
  onToggleSetup,
  onToggleSettings,
  setupIcon,
}: DashboardTopPanelProps) {
  return (
    <section
      className={`app-dashboard-identity-panel${mobileExpandedPanel ? " has-mobile-panel" : ""}${mobileExpandedPanel && isMobileExpandedOpen ? " is-mobile-panel-open" : ""}`}
    >
      <div className="app-dashboard-identity-main">
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
            aria-label={isMobileViewport && activePanel === "setup" ? "Close setup panel" : "Open setup panel"}
            title={isMobileViewport && activePanel === "setup" ? "Close setup panel" : "Open setup panel"}
            aria-pressed={activePanel === "setup"}
            onClick={onToggleSetup}
          >
            {isMobileViewport && activePanel === "setup" ? (
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
            ) : (
              setupIcon
            )}
          </button>
          <button
            type="button"
            className="app-dashboard-settings-trigger"
            aria-label={isMobileViewport && activePanel === "settings" ? "Close settings" : "Open settings"}
            aria-pressed={activePanel === "settings"}
            onClick={onToggleSettings}
          >
            <HugeiconsIcon
              icon={isMobileViewport && activePanel === "settings" ? Cancel01Icon : Settings02Icon}
              strokeWidth={2}
              className="size-5"
            />
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
      </div>

      {mobileExpandedPanel ? (
        <div className={`app-dashboard-mobile-panel${isMobileExpandedOpen ? " is-open" : ""}`}>
          <div className="app-dashboard-mobile-panel-inner">{mobileExpandedContent}</div>
        </div>
      ) : null}
    </section>
  );
}
