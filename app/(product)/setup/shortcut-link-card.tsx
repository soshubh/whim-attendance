"use client";

import { useEffect, useState } from "react";

type ShortcutLinkCardProps = {
  label: string;
  url: string;
  showLabel?: boolean;
  copyButtonPlacement?: "header" | "box";
  hideFeedback?: boolean;
};

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error("Copy command failed.");
  }
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="8"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 10.5V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShortcutLinkCard({
  label,
  url,
  showLabel = true,
  copyButtonPlacement = "box",
  hideFeedback = false,
}: ShortcutLinkCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyState !== "copied") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  async function handleCopy() {
    try {
      await copyTextToClipboard(url);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="app-shortcut-link-card">
      {showLabel ? (
        <div className="app-shortcut-link-header">
          <strong className="app-shortcut-link-title">{label}</strong>
          {copyButtonPlacement === "header" ? (
            <button
              className={`app-shortcut-code-copy app-shortcut-code-copy-header${copyState === "copied" ? " is-success" : ""}`}
              type="button"
              onClick={handleCopy}
              aria-label={`Copy ${label}`}
            >
              <CopyIcon />
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="app-shortcut-code-wrap">
        {copyButtonPlacement === "box" ? (
          <button
            className={`app-shortcut-code-copy${copyState === "copied" ? " is-success" : ""}`}
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
          >
            <CopyIcon />
          </button>
        ) : null}
        <code>{url}</code>
      </div>
      {copyState === "error" && !hideFeedback ? (
        <p className="app-shortcut-feedback">Copy failed. Copy the URL manually.</p>
      ) : null}
    </div>
  );
}
