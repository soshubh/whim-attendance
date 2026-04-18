import { AuthClientOnly } from "@/app/(product)/components/auth-client-only";

import { SetupAutomationGuide } from "./setup-automation-guide";
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

      <SetupAutomationGuide arrivalUrl={arrivalUrl} leaveUrl={leaveUrl} />

      {showActions ? (
        <AuthClientOnly>
          <SetupForm showActions={showActions} />
        </AuthClientOnly>
      ) : null}
    </>
  );
}
