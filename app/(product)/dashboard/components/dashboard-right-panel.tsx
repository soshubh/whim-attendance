import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { SettingsForm } from "@/app/(product)/settings/settings-form";
import { SetupPanelContent } from "@/app/(product)/setup/setup-panel-content";
import type { AttendanceSettingsPayload } from "@/lib/attendance-settings";

import type { DashboardPanelType, SelectedDateDetail } from "../dashboard-shared";
import { DashboardSurfaceCard } from "./dashboard-surface-card";

type DashboardRightPanelProps = {
  activePanel: DashboardPanelType | null;
  isOpen: boolean;
  selectedDateDetail: SelectedDateDetail | null;
  settingsState: AttendanceSettingsPayload;
  arrivalUrl: string;
  leaveUrl: string;
  onClose: () => void;
  onCloseActivity: () => void;
  onSettingsSaved: (settings: AttendanceSettingsPayload) => void;
};

export function DashboardRightPanel({
  activePanel,
  isOpen,
  selectedDateDetail,
  settingsState,
  arrivalUrl,
  leaveUrl,
  onClose,
  onCloseActivity,
  onSettingsSaved,
}: DashboardRightPanelProps) {
  if (!activePanel) {
    return null;
  }

  return (
    <aside
      className={`app-attendance-right-panel${isOpen ? " is-open" : ""}`}
      role="region"
      aria-label={
        activePanel === "settings"
          ? "Settings panel"
          : activePanel === "setup"
            ? "Setup panel"
            : "Activity panel"
      }
    >
      <DashboardSurfaceCard as="div" variant="panel" className="app-attendance-right-panel-card">
        {activePanel === "settings" ? (
          <>
            <div className="app-attendance-right-panel-header">
              <div className="app-attendance-right-panel-copy">
                <h2 className="app-settings-panel-title">Settings</h2>
              </div>
              <button
                type="button"
                className="app-dashboard-modal-close app-attendance-right-panel-close"
                aria-label="Close settings"
                onClick={onClose}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
              </button>
            </div>

            <div className="app-attendance-right-panel-body">
              <SettingsForm
                showBackLink={false}
                initialSettings={settingsState}
                onSettingsSaved={onSettingsSaved}
              />
            </div>
          </>
        ) : null}

        {activePanel === "activity" && selectedDateDetail ? (
          <>
            <div className="app-attendance-right-panel-header">
              <div className="app-attendance-right-panel-copy">
                <h2 className="app-settings-panel-title">{selectedDateDetail.label}</h2>
              </div>
              <button
                type="button"
                className="app-dashboard-modal-close app-attendance-right-panel-close"
                aria-label="Close activity"
                onClick={onCloseActivity}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
              </button>
            </div>

            <div className="app-attendance-right-panel-body">
              {selectedDateDetail.entries.length ? (
                <div className="app-attendance-sidebar-detail-list">
                  {selectedDateDetail.entries.map((entry) => (
                    <article key={entry.id} className="app-attendance-sidebar-detail-item">
                      <div className="app-attendance-sidebar-detail-item-copy">
                        <strong className="app-attendance-sidebar-detail-title">{entry.title}</strong>
                        <span className="app-attendance-sidebar-detail-meta">{entry.meta}</span>
                      </div>
                      {entry.value ? (
                        <b className="app-attendance-sidebar-detail-value">{entry.value}</b>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="app-attendance-sidebar-detail-empty">
                  No activity recorded for this date.
                </div>
              )}
            </div>
          </>
        ) : null}

        {activePanel === "setup" ? (
          <>
            <div className="app-attendance-right-panel-header">
              <div className="app-attendance-right-panel-copy">
                <h2 className="app-settings-panel-title">Setup</h2>
              </div>
              <button
                type="button"
                className="app-dashboard-modal-close app-attendance-right-panel-close"
                aria-label="Close setup"
                onClick={onClose}
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
              </button>
            </div>

            <div className="app-attendance-right-panel-body">
              <SetupPanelContent
                arrivalUrl={arrivalUrl}
                leaveUrl={leaveUrl}
                showIntro={false}
                showActions={false}
              />
            </div>
          </>
        ) : null}
      </DashboardSurfaceCard>
    </aside>
  );
}
