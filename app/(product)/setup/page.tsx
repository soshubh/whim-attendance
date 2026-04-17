import { GridBackground } from "@/app/components/grid-background";
import {
  ensureShortcutTokenForUser,
  requireAuthenticatedUser,
} from "@/lib/auth";
import { getEnv } from "@/lib/env";

import { SetupSurface } from "./setup-surface";

export default async function SetupPage() {
  const user = await requireAuthenticatedUser();
  const shortcutToken = await ensureShortcutTokenForUser(user.id);
  const shortcutTokenValue = shortcutToken?.token ?? "";
  const arrivalUrl = `${getEnv().appUrl}/i/${shortcutTokenValue}`;
  const leaveUrl = `${getEnv().appUrl}/o/${shortcutTokenValue}`;

  return (
    <main className="app-shell app-auth-shell product-surface">
      <GridBackground />
      <SetupSurface arrivalUrl={arrivalUrl} leaveUrl={leaveUrl} />
    </main>
  );
}
