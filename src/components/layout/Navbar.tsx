import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Loader2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const scrollToFeatures = () => {
    setMobileOpen(false);
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#features");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">
          Career Decode
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <button onClick={scrollToFeatures} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </button>
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="/careers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Careers
          </Link>
          <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          {loading ? (
            <Button variant="ghost" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : user ? (
            <Button size="sm" className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Home</Link>
          <button onClick={scrollToFeatures} className="block py-2 text-sm font-medium text-muted-foreground w-full text-left">Features</button>
          <Link to="/pricing" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium text-muted-foreground">Pricing</Link>
          {loading ? (
            <Button variant="ghost" className="w-full justify-start" disabled><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading</Button>
          ) : user ? (
            <Button className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]" onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}>
              <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="w-full justify-start" onClick={() => { setMobileOpen(false); navigate("/login"); }}>Login</Button>
              <Button className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]" onClick={() => { setMobileOpen(false); navigate("/signup"); }}>Sign Up</Button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
