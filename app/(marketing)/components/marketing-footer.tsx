import Link from "next/link";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="marketing-footer">
      <h2 className="marketing-footer-title">
        Log Smarter.
        <br />
        Move Lighter.
      </h2>

      <div className="marketing-footer-bottom">
        <span className="marketing-footer-meta">{`© ${year} WHIM`}</span>
        <div className="marketing-footer-legal-links">
          <Link href="/privacy" className="marketing-footer-legal-link">
            Privacy Policy
          </Link>
          <Link href="/terms" className="marketing-footer-legal-link">
            Terms of Service
          </Link>
        </div>
        <div className="marketing-footer-links">
          <Link
            href="https://www.instagram.com/shubhforux/"
            className="marketing-footer-meta"
            target="_blank"
            rel="noreferrer"
          >
            <span>BY </span>
            <span className="marketing-footer-meta-accent">@shubhforux</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
