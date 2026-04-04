"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type DashboardLiveRefreshProps = {
  userId: string;
};

export function DashboardLiveRefresh({ userId }: DashboardLiveRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    function refreshDashboard() {
      startTransition(() => {
        router.refresh();
      });
    }

    const channel = supabase
      .channel("attendance-logs-" + userId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_logs",
          filter: "user_id=eq." + userId,
        },
        refreshDashboard,
      )
      .subscribe();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    }

    window.addEventListener("focus", refreshDashboard);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshDashboard);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
