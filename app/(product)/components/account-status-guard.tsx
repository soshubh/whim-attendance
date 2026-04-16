"use client";

import { useEffect, useMemo } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const DEACTIVATED_REDIRECT =
  "/get-access?message=Your%20account%20has%20been%20disabled%20from%20admin%20side.";

export function AccountStatusGuard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function checkAccountStatus() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || cancelled) {
        return;
      }

      const response = await fetch("/api/get-access/state", {
        method: "GET",
        cache: "no-store",
      });

      if (cancelled || response.status !== 403) {
        return;
      }

      await supabase.auth.signOut();

      if (!cancelled) {
        window.location.href = DEACTIVATED_REDIRECT;
      }
    }

    void checkAccountStatus();

    const intervalId = window.setInterval(() => {
      void checkAccountStatus();
    }, 30_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkAccountStatus();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabase]);

  return null;
}
