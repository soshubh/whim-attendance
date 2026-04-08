import { useEffect, useState } from "react";
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
  deletingEntryId: number | null;
  deleteEntryError: string;
  onClose: () => void;
  onCloseActivity: () => void;
  onDeleteEntry: (entryId: number) => Promise<boolean>;
  onSettingsSaved: (settings: AttendanceSettingsPayload) => void;
};

function DeleteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4.5h6m-9 3h12m-1 0-.6 9.1a2 2 0 0 1-2 1.9H9.6a2 2 0 0 1-2-1.9L7 7.5m3 3.25v4.5m4-4.5v4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardRightPanel({
  activePanel,
  isOpen,
  selectedDateDetail,
  settingsState,
  arrivalUrl,
  leaveUrl,
  deletingEntryId,
  deleteEntryError,
  onClose,
  onCloseActivity,
  onDeleteEntry,
  onSettingsSaved,
}: DashboardRightPanelProps) {
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<SelectedDateDetail["entries"][number] | null>(
    null,
  );

  useEffect(() => {
    setPendingDeleteEntry(null);
  }, [activePanel, selectedDateDetail?.label]);

  async function confirmDeleteEntry() {
    if (!pendingDeleteEntry) {
      return;
    }

    const deleted = await onDeleteEntry(pendingDeleteEntry.id);
    if (deleted) {
      setPendingDeleteEntry(null);
    }
  }

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
                      <div className="app-attendance-sidebar-detail-actions">
                        {entry.value ? (
                          <b className="app-attendance-sidebar-detail-value">{entry.value}</b>
                        ) : null}
                        {entry.deletable ? (
                          <button
                            type="button"
                            className="app-attendance-sidebar-detail-delete"
                            aria-label={`Delete ${entry.title}`}
                            onClick={() => setPendingDeleteEntry(entry)}
                            disabled={deletingEntryId === entry.id}
                          >
                            <DeleteIcon />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="app-attendance-sidebar-detail-empty">
                  No activity recorded for this date.
                </div>
              )}
              {pendingDeleteEntry ? (
                <div className="app-attendance-right-panel-confirm-overlay">
                  <div className="app-attendance-right-panel-confirm-card">
                    <div className="app-attendance-right-panel-confirm-copy">
                      <strong>Delete this entry?</strong>
                      <span>
                        {pendingDeleteEntry.title}
                        {pendingDeleteEntry.value ? ` at ${pendingDeleteEntry.value}` : ""}
                        {" "}will be removed.
                      </span>
                      {deleteEntryError ? (
                        <span className="app-attendance-right-panel-confirm-error">{deleteEntryError}</span>
                      ) : null}
                    </div>
                    <div className="app-attendance-right-panel-confirm-actions">
                      <button
                        type="button"
                        className="app-button app-button-secondary app-button-compact"
                        onClick={() => setPendingDeleteEntry(null)}
                        disabled={deletingEntryId === pendingDeleteEntry.id}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="app-button app-button-primary app-button-compact"
                        onClick={confirmDeleteEntry}
                        disabled={deletingEntryId === pendingDeleteEntry.id}
                      >
                        {deletingEntryId === pendingDeleteEntry.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
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
