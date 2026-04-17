"use client";

import { useEffect, useState } from "react";

import { Logout03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AuthClientOnly } from "@/app/(product)/components/auth-client-only";

import { SetupPanelContent } from "./setup-panel-content";
import { SetupForm } from "./setup-form";

type SetupSurfaceProps = {
  arrivalUrl: string;
  leaveUrl: string;
};

export function SetupSurface({ arrivalUrl, leaveUrl }: SetupSurfaceProps) {
  const [isCtaVisible, setIsCtaVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsCtaVisible(true);
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <Card className="app-auth-surface app-setup-surface">
      <CardHeader className="app-auth-surface-header app-setup-surface-header">
        <div className="app-auth-surface-copy">
          <CardTitle className="app-auth-surface-title">
            Copy shortcut links and finish setup
          </CardTitle>
        </div>
        <div
          className={`app-setup-surface-actions${isCtaVisible ? " is-cta-visible" : ""}`}
        >
          <a
            className="app-dashboard-settings-trigger app-setup-logout-link"
            href="/logout"
            aria-label="Log out"
            title="Log out"
          >
            <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} className="size-5" />
          </a>
          <AuthClientOnly>
            <SetupForm
              showActions
              revealActions={isCtaVisible}
              mode="topbar"
            />
          </AuthClientOnly>
        </div>
      </CardHeader>
      <CardContent className="app-auth-surface-content app-setup-surface-content">
        <SetupPanelContent
          arrivalUrl={arrivalUrl}
          leaveUrl={leaveUrl}
          showIntro={false}
          showActions={false}
        />
      </CardContent>
    </Card>
  );
}
