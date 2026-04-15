import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { SettingsForm } from "@/app/(product)/settings/settings-form";
import { SetupPanelContent } from "@/app/(product)/setup/setup-panel-content";
import type { AttendanceSettingsPayload } from "@/lib/attendance-settings";

import type {
  AddRecordInput,
  AddRecordType,
  DashboardPanelType,
  SelectedDateDetail,
} from "../dashboard-shared";
import { DashboardSurfaceCard } from "./dashboard-surface-card";

type DashboardRightPanelProps = {
  activePanel: DashboardPanelType | null;
  isOpen: boolean;
  selectedDateDetail: SelectedDateDetail | null;
  selectedDateKey: string | null;
  settingsState: AttendanceSettingsPayload;
  arrivalUrl: string;
  leaveUrl: string;
  deletingEntryId: number | null;
  deleteEntryError: string;
  onClose: () => void;
  onCloseActivity: () => void;
  onDeleteEntry: (entryId: number) => Promise<boolean>;
  onAddEntry: (dateKey: string, payload: AddRecordInput) => Promise<void>;
  onSettingsSaved: (settings: AttendanceSettingsPayload) => void;
};

const ADD_RECORD_TYPES: Array<{ value: AddRecordType; label: string }> = [
  { value: "IN", label: "Check-in" },
  { value: "OUT", label: "Check-out" },
  { value: "LEAVE", label: "Leave" },
  { value: "WFH", label: "WFH" },
];

const LEAVE_CATEGORIES = [
  "Earned Leave",
  "Casual Leave",
  "Sick Leave",
  "Compensatory Off",
  "Public Holidays",
  "Restricted Holidays",
  "Loss of Pay (LOP)",
] as const;

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

function AddIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5.5v13m6.5-6.5h-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashboardRightPanel({
  activePanel,
  isOpen,
  selectedDateDetail,
  selectedDateKey,
  settingsState,
  arrivalUrl,
  leaveUrl,
  deletingEntryId,
  deleteEntryError,
  onClose,
  onCloseActivity,
  onDeleteEntry,
  onAddEntry,
  onSettingsSaved,
}: DashboardRightPanelProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<SelectedDateDetail["entries"][number] | null>(
    null,
  );
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [addRecordType, setAddRecordType] = useState<AddRecordType>("IN");
  const [addRecordTime, setAddRecordTime] = useState("09:00");
  const [addRecordLeaveCategory, setAddRecordLeaveCategory] = useState<(typeof LEAVE_CATEGORIES)[number]>("Casual Leave");
  const [addRecordLabel, setAddRecordLabel] = useState("");
  const [addRecordError, setAddRecordError] = useState("");
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setPendingDeleteEntry(null);
    setIsAddRecordOpen(false);
    setAddRecordType("IN");
    setAddRecordTime("09:00");
    setAddRecordLeaveCategory("Casual Leave");
    setAddRecordLabel("");
    setAddRecordError("");
  }, [activePanel, selectedDateDetail?.label]);

  useEffect(() => {
    if (!isAddRecordOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAddRecordOpen(false);
        setAddRecordError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddRecordOpen]);

  async function confirmDeleteEntry() {
    if (!pendingDeleteEntry) {
      return;
    }

    const deleted = await onDeleteEntry(pendingDeleteEntry.id);
    if (deleted) {
      setPendingDeleteEntry(null);
    }
  }

  async function handleAddRecordSubmit() {
    if (!selectedDateKey) {
      setAddRecordError("Choose a date first.");
      return;
    }

    setIsAddingRecord(true);
    setAddRecordError("");

    try {
      await onAddEntry(selectedDateKey, {
        type: addRecordType,
        time: addRecordType === "IN" || addRecordType === "OUT" ? addRecordTime : undefined,
        leaveCategory: addRecordType === "LEAVE" ? addRecordLeaveCategory : undefined,
        label: addRecordType === "LEAVE" ? addRecordLabel : undefined,
      });

      setIsAddRecordOpen(false);
      setAddRecordType("IN");
      setAddRecordTime("09:00");
      setAddRecordLeaveCategory("Casual Leave");
      setAddRecordLabel("");
    } catch (error) {
      setAddRecordError(error instanceof Error ? error.message : "Could not add record.");
    } finally {
      setIsAddingRecord(false);
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

            <div className={`app-attendance-right-panel-body${pendingDeleteEntry ? " is-locked" : ""}`}>
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
              <section className="app-attendance-add-record-card">
                <button
                  type="button"
                  className="app-attendance-add-record-trigger"
                  onClick={() => {
                    setIsAddRecordOpen(true);
                    setAddRecordError("");
                  }}
                >
                  <span className="app-attendance-add-record-trigger-icon" aria-hidden="true">
                    <AddIcon />
                  </span>
                  <span className="app-attendance-add-record-trigger-label">
                    Add new record
                  </span>
                </button>
              </section>

              {selectedDateDetail.entries.length ? (
                <div
                  className={`app-attendance-sidebar-detail-list${pendingDeleteEntry ? " is-locked" : ""}`}
                >
                  {selectedDateDetail.entries.map((entry) => (
                    <article
                      key={entry.id}
                      className={`app-attendance-sidebar-detail-item is-${entry.tone}`}
                    >
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
      {hasMounted && pendingDeleteEntry
        ? createPortal(
            <div className="app-dashboard-modal-backdrop">
              <div className="app-attendance-right-panel-confirm-card">
                <div className="app-attendance-right-panel-confirm-copy">
                  <strong>
                    Delete this entry? ({selectedDateDetail?.label ?? selectedDateKey})
                  </strong>
                  <span>
                    {pendingDeleteEntry.title}
                    {pendingDeleteEntry.value
                      ? ` at ${pendingDeleteEntry.value}`
                      : pendingDeleteEntry.tone === "present-in" ||
                          pendingDeleteEntry.tone === "present-out"
                        ? ` at ${pendingDeleteEntry.meta}`
                        : ""}
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
            </div>,
            document.body,
          )
        : null}
      {hasMounted && isAddRecordOpen
        ? createPortal(
            <div className="app-dashboard-modal-backdrop">
              <div className="app-attendance-right-panel-confirm-card app-attendance-add-record-dialog">
                <div className="app-attendance-add-record-dialog-head">
                  <div className="app-attendance-right-panel-confirm-copy">
                    <strong>
                      Add new record ({selectedDateDetail?.label ?? selectedDateKey})
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="app-dashboard-modal-close"
                    aria-label="Close add record"
                    onClick={() => {
                      setIsAddRecordOpen(false);
                      setAddRecordError("");
                    }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-5" />
                  </button>
                </div>

                <div className="app-attendance-add-record-form">
                  <label className="app-field">
                    <span>Record type</span>
                    <select
                      className="app-input"
                      value={addRecordType}
                      onChange={(event) => {
                        const nextType = event.target.value as Exclude<
                          AddRecordType,
                          "WEEKLY_OFF"
                        >;

                        setAddRecordType(nextType);

                        if (nextType === "OUT") {
                          setAddRecordTime("17:00");
                        } else if (nextType === "IN") {
                          setAddRecordTime("09:00");
                        }
                      }}
                      disabled={isAddingRecord}
                    >
                      {ADD_RECORD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {addRecordType === "IN" || addRecordType === "OUT" ? (
                    <label className="app-field">
                      <span>Time</span>
                      <input
                        className="app-input"
                        type="time"
                        value={addRecordTime}
                        onChange={(event) => setAddRecordTime(event.target.value)}
                        disabled={isAddingRecord}
                      />
                    </label>
                  ) : null}

                  {addRecordType === "LEAVE" ? (
                    <>
                      <label className="app-field">
                        <span>Leave type</span>
                        <select
                          className="app-input"
                          value={addRecordLeaveCategory}
                          onChange={(event) =>
                            setAddRecordLeaveCategory(
                              event.target.value as (typeof LEAVE_CATEGORIES)[number],
                            )
                          }
                          disabled={isAddingRecord}
                        >
                          {LEAVE_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="app-field">
                        <span>Note</span>
                        <input
                          className="app-input"
                          type="text"
                          value={addRecordLabel}
                          onChange={(event) => setAddRecordLabel(event.target.value)}
                          placeholder="Optional note"
                          disabled={isAddingRecord}
                        />
                      </label>
                    </>
                  ) : null}

                  {addRecordError ? (
                    <div className="app-attendance-add-record-error">{addRecordError}</div>
                  ) : null}

                  <div className="app-attendance-add-record-actions">
                    <button
                      type="button"
                      className="app-button app-button-secondary app-button-compact"
                      onClick={() => setIsAddRecordOpen(false)}
                      disabled={isAddingRecord}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="app-button app-button-primary app-button-compact"
                      onClick={handleAddRecordSubmit}
                      disabled={isAddingRecord}
                    >
                      {isAddingRecord ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </aside>
  );
}
