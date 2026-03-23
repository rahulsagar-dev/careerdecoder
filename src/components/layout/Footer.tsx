import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-background py-10">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">© 2026 Career Decode. All rights reserved.</p>
      <nav className="flex gap-6">
        {["About", "Contact", "Privacy"].map((item) => (
          <Link key={item} to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {item}
          </Link>
        ))}
      </nav>
    </div>
  </footer>
);

export default Footer;
