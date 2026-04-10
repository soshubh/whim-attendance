import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <main className="app-shell app-auth-shell">
      <Card className="mx-auto flex h-auto w-full max-w-[560px] flex-col overflow-hidden rounded-[var(--foundation-radius-36)] border-[color:var(--foundation-stroke-neutral)] bg-white py-0 text-inherit shadow-none ring-0">
        <CardHeader className="justify-start gap-[var(--foundation-space-12)] px-[var(--foundation-space-24)] pt-[var(--foundation-space-24)] pb-[var(--foundation-space-16)] sm:px-[var(--foundation-space-32)] sm:pt-[var(--foundation-space-32)] sm:pb-[var(--foundation-space-20)] lg:px-[var(--foundation-space-40)] lg:pt-[var(--foundation-space-40)] lg:pb-[var(--foundation-space-20)]">
          <div className="grid gap-[var(--foundation-space-12)]">
            <CardTitle className="font-[var(--foundation-font-sans)] text-[length:var(--foundation-type-18)] leading-[1.3] tracking-[-0.02em] font-[var(--foundation-weight-semibold)] text-[color:var(--foundation-color-text)]">
              {title}
            </CardTitle>
            <CardDescription className="max-w-[28ch] text-[length:var(--foundation-type-14)] leading-[1.6] text-[color:var(--foundation-neutral-700)]">
              {description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid content-start gap-[var(--foundation-space-20)] px-[var(--foundation-space-24)] pb-[var(--foundation-space-24)] sm:px-[var(--foundation-space-32)] sm:pb-[var(--foundation-space-32)] lg:px-[var(--foundation-space-40)] lg:pb-[var(--foundation-space-40)]">
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
