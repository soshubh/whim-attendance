import { AuthClientOnly } from "@/app/(product)/components/auth-client-only";

import { ShortcutLinkCard } from "./shortcut-link-card";
import { SetupForm } from "./setup-form";

type SetupPanelContentProps = {
  arrivalUrl: string;
  leaveUrl: string;
  showIntro?: boolean;
  showActions?: boolean;
};

export function SetupPanelContent({
  arrivalUrl,
  leaveUrl,
  showIntro = true,
  showActions = true,
}: SetupPanelContentProps) {
  return (
    <>
      {showIntro ? (
        <>
          <p className="app-eyebrow">Complete setup</p>
          <h1 className="app-title">
            Copy two shortcut links and finish setup.
          </h1>
          <p className="app-copy">
            Use one arrival URL and one leave URL in your iPhone automations.
            The backend will read the event directly from the URL.
          </p>
        </>
      ) : null}

      <div className="app-step-list">
        <div className="app-step-item">
          <strong>1. Arrival automation</strong>
          <span>
            Copy the IN URL and use it in the office arrival automation with a
            POST request.
          </span>
        </div>
        <div className="app-step-item">
          <strong>2. Leave automation</strong>
          <span>
            Copy the OUT URL and use it in the office leave automation with a
            POST request.
          </span>
        </div>
        <div className="app-step-item">
          <strong>3. Open dashboard</strong>
          <span>
            Once both shortcuts are in place, open your dashboard and start
            using the workspace.
          </span>
        </div>
        <div className="app-step-item">
          <ShortcutLinkCard
            label="4. Office arrival URL"
            url={arrivalUrl}
            copyButtonPlacement="header"
          />
        </div>
        <div className="app-step-item">
          <ShortcutLinkCard
            label="5. Office leave URL"
            url={leaveUrl}
            copyButtonPlacement="header"
          />
        </div>
      </div>

      <AuthClientOnly>
        <SetupForm showActions={showActions} />
      </AuthClientOnly>
    </>
  );
}
