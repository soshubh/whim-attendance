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
        <span className="marketing-footer-meta">BY SHUBH</span>
      </div>
    </footer>
  );
}
