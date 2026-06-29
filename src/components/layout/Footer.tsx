import { Link } from "react-router-dom";
import { useCookieConsent } from "@/context/CookieConsentContext";

const Footer = () => {
  const { openPreferences } = useCookieConsent();
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Career Decode. All rights reserved.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link>
          <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          <button onClick={openPreferences} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cookie Settings
          </button>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
