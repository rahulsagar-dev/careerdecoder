import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  children: ReactNode;
  feature?: string;
  className?: string;
}

const PremiumGate = ({ children, feature = "This feature", className = "" }: Props) => {
  const { isPro, loading } = useSubscription();

  if (loading) return <div className={className}>{children}</div>;
  if (isPro) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none blur-sm opacity-40 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl max-w-md text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{feature} is a Pro feature</h3>
          <p className="text-sm text-muted-foreground mb-4">Upgrade to unlock unlimited access.</p>
          <Button asChild className="bg-gradient-to-r from-indigo-500 to-blue-500">
            <Link to="/pricing"><Sparkles className="w-4 h-4 mr-2" /> Upgrade to Pro</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumGate;
