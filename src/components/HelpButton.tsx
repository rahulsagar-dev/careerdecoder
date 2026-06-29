import { Link, useLocation } from "react-router-dom";
import { HelpCircle } from "lucide-react";

const HIDE_ON = ["/login", "/signup", "/forgot-password", "/reset-password"];

const HelpButton = () => {
  const location = useLocation();
  if (HIDE_ON.includes(location.pathname)) return null;
  if (location.pathname === "/support") return null;

  return (
    <Link
      to="/support"
      aria-label="Help & Support"
      className="fixed bottom-4 right-4 z-40 w-11 h-11 rounded-full bg-gradient-to-br from-primary to-[hsl(260,84%,60%)] text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
    >
      <HelpCircle className="h-5 w-5" />
    </Link>
  );
};

export default HelpButton;
