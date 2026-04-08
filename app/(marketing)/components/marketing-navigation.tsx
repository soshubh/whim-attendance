"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import logoImage from "@/public/brand/FBFLogo.png";
import { Button } from "@/components/ui/button";

export function MarketingNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="marketing-topbar-wrap">
      <div className="marketing-topbar">
        <Link
          href="/"
          className="marketing-brand"
          aria-label="WHIM home"
          onClick={closeMenu}
        >
          <span className="marketing-brand-icon-wrap" aria-hidden="true">
            <Image
              src={logoImage}
              alt="WHIM logo"
              fill
              sizes="30px"
              className="marketing-brand-icon"
              priority
            />
          </span>
          <span className="marketing-brand-wordmark-wrap" aria-hidden="true">
            <Image
              src="/brand/wordmark/WordMark.svg"
              alt="WHIM"
              fill
              sizes="(max-width: 720px) 72px, 96px"
              className="marketing-brand-wordmark"
              priority
            />
          </span>
        </Link>

        <div className="marketing-topbar-actions">
          <Button asChild variant="inverse">
            <Link href="/get-access">Start free</Link>
          </Button>
        </div>

        <button
          type="button"
          className={
            isOpen ? "marketing-nav-toggle marketing-nav-toggle-open" : "marketing-nav-toggle"
          }
          aria-expanded={isOpen}
          aria-controls="marketing-mobile-panel"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="marketing-nav-toggle-icon" aria-hidden="true">
            <span className="marketing-nav-toggle-bar marketing-nav-toggle-bar-top" />
            <span className="marketing-nav-toggle-bar marketing-nav-toggle-bar-middle" />
            <span className="marketing-nav-toggle-bar marketing-nav-toggle-bar-bottom" />
          </span>
        </button>
      </div>

      <div
        id="marketing-mobile-panel"
        className={
          isOpen
            ? "marketing-mobile-panel marketing-mobile-panel-open"
            : "marketing-mobile-panel"
        }
      >
        <div className="marketing-mobile-actions">
          <Button asChild variant="inverse" width="full">
            <Link href="/get-access" onClick={closeMenu}>
              Start free
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
