"use client";

import { useEffect, useState } from "react";

type AdminStats = {
  totalUsers: number;
  admins: number;
  activeUsers: number;
  deactivatedUsers: number;
};

type AdminUserRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: "admin" | "user";
  providers: string[];
  joinedAt: string | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  onboardingStage: "pending" | "setup" | "complete";
  isDeactivated: boolean;
  isCurrentUser: boolean;
};

type AdminPayload = {
  stats: AdminStats;
  rows: AdminUserRow[];
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatJoined(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getOnboardingLabel(stage: AdminUserRow["onboardingStage"]) {
  switch (stage) {
    case "complete":
      return "Complete";
    case "setup":
      return "Setup";
    default:
      return "Pending";
  }
}

export function AdminDashboardClient() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [data, setData] = useState<AdminPayload | null>(null);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);

  async function loadUsers() {
    setLoadingData(true);
    setDataError("");

    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | AdminPayload
        | { error?: string }
        | null;

      if (!response.ok) {
        setDataError(
          payload && "error" in payload
            ? payload.error ?? "Could not load users."
            : "Could not load users.",
        );
        return;
      }

      setData(payload as AdminPayload);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { authenticated?: boolean }
        | null;
      const isAuthenticated = Boolean(payload?.authenticated);
      setAuthenticated(isAuthenticated);

      if (isAuthenticated) {
        void loadUsers();
      } else {
        setData(null);
      }
    }

    void bootstrap();
  }, []);

  async function handleRoleChange(userId: string, role: "admin" | "user") {
    setMutatingUserId(userId);
    setDataError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setDataError(payload?.error ?? "Could not update role.");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              rows: current.rows.map((row) =>
                row.id === userId
                  ? {
                      ...row,
                      role,
                    }
                  : row,
              ),
              stats: {
                ...current.stats,
                admins: current.rows.map((row) =>
                  row.id === userId ? { ...row, role } : row,
                ).filter((row) => row.role === "admin").length,
              },
            }
          : current,
      );
    } finally {
      setMutatingUserId(null);
    }
  }

  async function handleAccessToggle(userId: string, nextDeactivated: boolean) {
    setMutatingUserId(userId);
    setDataError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deactivated: nextDeactivated }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setDataError(payload?.error ?? "Could not update access.");
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              rows: current.rows.map((row) =>
                row.id === userId
                  ? {
                      ...row,
                      isDeactivated: nextDeactivated,
                    }
                  : row,
              ),
              stats: {
                ...current.stats,
                deactivatedUsers: current.rows.map((row) =>
                  row.id === userId ? { ...row, isDeactivated: nextDeactivated } : row,
                ).filter((row) => row.isDeactivated).length,
              },
            }
          : current,
      );
    } finally {
      setMutatingUserId(null);
    }
  }

  async function handleLogout() {
    window.location.href = "/logout";
  }

  return (
    <main className="app-admin-page">
      <section className="app-admin-shell">
        <header className="app-admin-header">
          <div className="app-admin-copy">
            <h1 className="app-admin-title">Admin Portal</h1>
            <p className="app-admin-subtitle">
              Manage access, role, onboarding progress, and recent account activity from one place.
            </p>
          </div>
          {authenticated ? (
            <button
              type="button"
              className="app-admin-button app-admin-button-secondary"
              onClick={handleLogout}
            >
              Log out
            </button>
          ) : null}
        </header>

        {authenticated === false ? (
          <section className="app-admin-note">
            <div className="app-admin-auth-copy">
              <strong>Admin access required</strong>
              <span>This account does not have the `admin` role in the profiles table.</span>
            </div>
          </section>
        ) : null}

        {authenticated && data ? (
          <>
            <section className="app-admin-stat-grid">
              <article className="app-admin-stat-card">
                <span>Total users</span>
                <strong>{data.stats.totalUsers}</strong>
              </article>
              <article className="app-admin-stat-card">
                <span>Admins</span>
                <strong>{data.stats.admins}</strong>
              </article>
              <article className="app-admin-stat-card">
                <span>Active in 24h</span>
                <strong>{data.stats.activeUsers}</strong>
              </article>
              <article className="app-admin-stat-card">
                <span>Deactivated</span>
                <strong>{data.stats.deactivatedUsers}</strong>
              </article>
            </section>

            <section className="app-admin-table-card">
              <div className="app-admin-table-scroll">
                <table className="app-admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Gmail</th>
                      <th>Role</th>
                      <th>Provider</th>
                      <th>Joined</th>
                      <th>Last login</th>
                      <th>Last active</th>
                      <th>Onboarding</th>
                      <th>Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => {
                      const isBusy = mutatingUserId === row.id;

                      return (
                        <tr key={row.id}>
                          <td>
                            <div className="app-admin-user-cell">
                              <strong>{row.fullName?.trim() || "Unnamed user"}</strong>
                              <span>{row.id}</span>
                            </div>
                          </td>
                          <td>{row.email ?? "—"}</td>
                          <td>
                            <select
                              className="app-admin-select"
                              value={row.role}
                              disabled={isBusy || row.isCurrentUser}
                              onChange={(event) =>
                                void handleRoleChange(
                                  row.id,
                                  event.target.value === "admin" ? "admin" : "user",
                                )
                              }
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>{row.providers.length ? row.providers.join(", ") : "email"}</td>
                          <td>{formatJoined(row.joinedAt)}</td>
                          <td>{formatDateTime(row.lastLoginAt)}</td>
                          <td>{formatDateTime(row.lastActiveAt)}</td>
                          <td>
                            <span
                              className={`app-admin-status-pill${
                                row.onboardingStage === "complete"
                                  ? " is-success"
                                  : row.onboardingStage === "setup"
                                    ? " is-info"
                                    : " is-muted"
                              }`}
                            >
                              {getOnboardingLabel(row.onboardingStage)}
                            </span>
                          </td>
                          <td>
                            {row.isCurrentUser ? (
                              <span className="app-admin-status-pill is-muted">Current account</span>
                            ) : (
                              <button
                                type="button"
                                className={`app-admin-button ${
                                  row.isDeactivated
                                    ? "app-admin-button-primary"
                                    : "app-admin-button-secondary"
                                } app-admin-inline-button`}
                                disabled={isBusy}
                                onClick={() => void handleAccessToggle(row.id, !row.isDeactivated)}
                              >
                                {row.isDeactivated ? "Activate" : "Deactivate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {authenticated && loadingData ? <p className="app-admin-loading">Loading users...</p> : null}
        {authenticated && dataError ? <p className="app-admin-error">{dataError}</p> : null}
      </section>
    </main>
  );
}
