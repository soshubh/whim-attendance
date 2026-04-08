import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardSurfaceCardVariant = "sidebar" | "calendar" | "panel";

type DashboardSurfaceCardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  variant: DashboardSurfaceCardVariant;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function DashboardSurfaceCard<T extends ElementType = "section">({
  as,
  children,
  variant,
  className,
  ...props
}: DashboardSurfaceCardProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={cn("app-dashboard-surface-card", `is-${variant}`, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
