import { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  // Placeholder — no auth enforcement. Ready for Phase 2.
  return <>{children}</>;
};

export default ProtectedRoute;
