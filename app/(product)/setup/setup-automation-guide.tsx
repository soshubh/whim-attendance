"use client";

import { useEffect, useState } from "react";

import { copyTextToClipboard } from "./shortcut-link-card";

type SetupAutomationGuideProps = {
  arrivalUrl: string;
  leaveUrl: string;
};

type AutomationMode = "arrival" | "leave";

type AutomationStep = {
  title: string;
  note?: string;
};

const automationContent: Record<
  AutomationMode,
  {
    label: string;
    url: string;
    steps: AutomationStep[];
  }
> = {
  arrival: {
    label: "Arrive automation",
    url: "",
    steps: [
      { title: "Open the Shortcuts app on your iPhone." },
      { title: "Go to the Automation tab." },
      { title: "Tap the + button in the top-right corner." },
      { title: "Choose Location as the trigger type, then select Arrive." },
      { title: "Search for or type your office location." },
      { title: "Set Time to Any Time." },
      { title: "Set the automation to Run Immediately." },
      { title: "Tap Next in the top-right." },
      { title: "Tap Create New Shortcut at the top." },
      { title: "Search for Get Contents of URL." },
      { title: "Paste the URL above and set Method to POST." },
      { title: "Tap Done." },
    ],
  },
  leave: {
    label: "Leave automation",
    url: "",
    steps: [
      { title: "Open the Shortcuts app on your iPhone." },
      { title: "Go to the Automation tab." },
      { title: "Tap the + button in the top-right corner." },
      { title: "Choose Location as the trigger type, then select Leave." },
      { title: "Search for or type your office location." },
      { title: "Set Time to Any Time." },
      { title: "Set the automation to Run Immediately." },
      { title: "Tap Next in the top-right." },
      { title: "Tap Create New Shortcut at the top." },
      { title: "Search for Get Contents of URL." },
      { title: "Paste the URL above and set Method to POST." },
      { title: "Tap Done." },
    ],
  },
};

export function SetupAutomationGuide({
  arrivalUrl,
  leaveUrl,
}: SetupAutomationGuideProps) {
  const [activeMode, setActiveMode] = useState<AutomationMode>("arrival");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    if (copyState !== "copied") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copyState]);

  const activeContent = {
    ...automationContent[activeMode],
    url: activeMode === "arrival" ? arrivalUrl : leaveUrl,
  };

  async function handleCopy() {
    try {
      await copyTextToClipboard(activeContent.url);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="app-setup-guide">
      <div
        className="app-setup-mode-switch"
        role="tablist"
        aria-label="Automation type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "arrival"}
          className={`app-setup-mode-button${activeMode === "arrival" ? " is-active" : ""}`}
          onClick={() => setActiveMode("arrival")}
        >
          Arrive automation
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === "leave"}
          className={`app-setup-mode-button${activeMode === "leave" ? " is-active" : ""}`}
          onClick={() => setActiveMode("leave")}
        >
          Leave automation
        </button>
      </div>

      <section className="app-setup-guide-section">
        <div className="app-setup-guide-url">
          <code>{activeContent.url}</code>
          <button
            type="button"
            className={`app-setup-guide-copy-button${copyState === "copied" ? " is-success" : ""}`}
            onClick={handleCopy}
          >
            {copyState === "copied" ? "Copied" : "Copy"}
          </button>
        </div>
        {copyState === "error" ? (
          <p className="app-shortcut-feedback">
            Copy failed. Copy the URL manually.
          </p>
        ) : null}
      </section>

      <section className="app-setup-guide-section">
        <p className="app-setup-guide-label">Steps in Shortcuts App</p>
        <div className="app-setup-guide-steps">
          {activeContent.steps.map((step, index) => (
            <div
              className="app-setup-guide-step"
              key={`${activeMode}-${index}`}
            >
              <div className="app-setup-guide-step-index" aria-hidden="true">
                {index + 1}
              </div>
              <div className="app-setup-guide-step-copy">
                <strong>{step.title}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
