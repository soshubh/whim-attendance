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
        <div className="marketing-footer-links">
          <Link href="/privacy" className="marketing-footer-meta">
            Privacy Policy
          </Link>
          <Link href="/terms" className="marketing-footer-meta">
            Terms of Service
          </Link>
          <span className="marketing-footer-meta">BY SHUBH</span>
        </div>
      </div>
    </footer>
  );
}
