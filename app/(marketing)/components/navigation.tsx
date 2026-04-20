import Image from "next/image";
import Link from "next/link";

import logoImage from "@/public/brand/FBFLogo-OR.png";
import wordmarkImage from "@/public/brand/wordmark/WordMark.svg";
import { Button } from "@/components/ui/button";
import { getEnv } from "@/lib/env";

export function Navigation() {
  const startFreeHref = new URL("/get-access", getEnv().appUrl).toString();

  return (
    <header className="marketing-topbar">
      <Link href="/" className="marketing-brand" aria-label="WHIM home">
        <span className="marketing-brand-icon-wrap" aria-hidden="true">
          <Image src={logoImage} alt="WHIM logo" fill sizes="30px" priority />
        </span>
        <span className="marketing-brand-wordmark-wrap" aria-hidden="true">
          <Image
            src={wordmarkImage}
            alt="WHIM"
            fill
            sizes="(max-width: 720px) 72px, 96px"
            priority
          />
        </span>
      </Link>

      <div className="marketing-topbar-actions">
        <Button asChild variant="primary" className="marketing-topbar-cta">
          <Link href={startFreeHref}>Start free</Link>
        </Button>
      </div>
    </header>
  );
}
