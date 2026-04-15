import {
  ensureShortcutTokenForUser,
  requireAuthenticatedUser,
} from "@/lib/auth";
import { getEnv } from "@/lib/env";

import { SetupPanelContent } from "./setup-panel-content";

export default async function SetupPage() {
  const user = await requireAuthenticatedUser();
  const shortcutToken = await ensureShortcutTokenForUser(user.id);
  const shortcutTokenValue = shortcutToken?.token ?? "";
  const arrivalUrl = `${getEnv().appUrl}/i/${shortcutTokenValue}`;
  const leaveUrl = `${getEnv().appUrl}/o/${shortcutTokenValue}`;

  return (
    <main className="app-shell app-flow-shell">
      <section className="app-setup-wrap">
        <div className="app-panel app-panel-sticky">
          <SetupPanelContent arrivalUrl={arrivalUrl} leaveUrl={leaveUrl} />
        </div>
      </section>
    </main>
  );
}
