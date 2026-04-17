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
  const automationSteps = [
    "Open the Shortcuts app on your iPhone.",
    "Go to the Automation tab.",
    "Tap the add button in the top-right corner.",
    "Choose the location trigger for this automation. If you copied the arrival URL, choose Arrive. If you copied the leave URL, choose Leave.",
    "Select your office location or type the location manually on that screen.",
    "Set the time option to Any Time.",
    "Set the automation to Run Immediately.",
    "Tap Next in the top-right corner.",
    "Tap Create New Shortcut at the top.",
    "Search for Get Contents of URL.",
    "Paste this URL and set Method to POST.",
    "Tap Done in the top-right corner.",
  ];

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
          <ShortcutLinkCard
            label="1. Arrival URL"
            url={arrivalUrl}
            copyButtonPlacement="header"
          />
        </div>
        <div className="app-step-item">
          <ShortcutLinkCard
            label="2. Leave URL"
            url={leaveUrl}
            copyButtonPlacement="header"
          />
        </div>
        <div className="app-step-item">
          <div className="app-step-heading">
            <strong>3. Setup process</strong>
          </div>
          <p className="app-step-lead">
            Follow this same process twice. Paste one copied URL at a time, then
            repeat the flow for the second URL. The only difference is the
            trigger you choose: use <strong>Arrive</strong> for the arrival URL
            and <strong>Leave</strong> for the leave URL.
          </p>
          <ol className="app-step-sequence">
            {automationSteps.map((step, index) => (
              <li key={`setup-${index}`}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      {showActions ? (
        <AuthClientOnly>
          <SetupForm showActions={showActions} />
        </AuthClientOnly>
      ) : null}
    </>
  );
}
