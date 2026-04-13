import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GridBackground } from "@/app/components/grid-background";

type AuthFormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthFormShell({
  title,
  description,
  children,
}: AuthFormShellProps) {
  return (
    <main className="app-shell app-auth-shell product-surface">
      <GridBackground />
      <Card className="app-auth-surface">
        <CardHeader className="app-auth-surface-header">
          <div className="app-auth-surface-copy">
            <CardTitle className="app-auth-surface-title">{title}</CardTitle>
            <CardDescription className="app-auth-surface-description">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="app-auth-surface-content">
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
