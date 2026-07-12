import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsIndia } from "@/hooks/useIndiaGeo";
import { billingService, loadRazorpay } from "@/services/billingService";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const FREE_FEATURES = [
  "1 career recommendation run",
  "2 resume analyses / month",
  "2 skill gap analyses / month",
  "1 GitHub analysis / month",
  "3 interview sessions / month",
  "Basic market intelligence",
];

const PRO_FEATURES = [
  "Unlimited career recommendations",
  "Unlimited resume & skill analyses",
  "Unlimited GitHub analyses",
  "Unlimited interview simulations",
  "Full market intelligence insights",
  "Career report PDF export",
  "Priority support",
];

const Pricing = () => {
  const { user } = useAuth();
  const { plan, isPro, refresh } = useSubscription();
  const { isIndia, loading: geoLoading } = useIsIndia();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const price = interval === "monthly" ? "₹499" : "₹3,999";
  const suffix = interval === "monthly" ? "/mo" : "/yr";

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }
    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Failed to load Razorpay");
      const { subscription_id, key_id } = await billingService.createSubscription(interval);

      const rzp = new (window as any).Razorpay({
        key: key_id,
        subscription_id,
        name: "Decode My Career",
        description: `Pro ${interval} plan`,
        prefill: { email: user.email },
        theme: { color: "#4f46e5" },
        handler: async () => {
          toast.success("Payment successful! Activating your Pro plan…");
          await refresh();
          navigate("/payment-success");
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed");
        setLoading(false);
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  };

  const canPay = isIndia;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Simple, transparent pricing</h1>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready to accelerate.</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full bg-muted p-1">
              <button
                onClick={() => setInterval("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${interval === "monthly" ? "bg-background shadow" : ""}`}
              >Monthly</button>
              <button
                onClick={() => setInterval("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${interval === "yearly" ? "bg-background shadow" : ""}`}
              >Yearly <Badge variant="secondary" className="ml-2">Save 33%</Badge></button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Free</h2>
                {plan === "free" && <Badge>Current Plan</Badge>}
              </div>
              <p className="text-4xl font-bold mb-1">₹0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mb-6">Get started, no card required.</p>
              <ul className="space-y-3 mb-6">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to={user ? "/dashboard" : "/signup"}>Get started</Link>
              </Button>
            </div>

            <div className="rounded-2xl border-2 border-indigo-500 bg-card p-8 relative shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                  <Sparkles className="w-3 h-3 mr-1" /> Most Popular
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Pro</h2>
                {isPro && <Badge>Current Plan</Badge>}
              </div>
              <p className="text-4xl font-bold mb-1">{price}<span className="text-base font-normal text-muted-foreground">{suffix}</span></p>
              <p className="text-sm text-muted-foreground mb-6">Everything you need to land your dream role.</p>
              <ul className="space-y-3 mb-6">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {isPro ? (
                <Button className="w-full" asChild>
                  <Link to="/billing">Manage subscription</Link>
                </Button>
              ) : geoLoading ? (
                <Button className="w-full" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</Button>
              ) : canPay ? (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening checkout…</> : "Upgrade to Pro"}
                </Button>
              ) : (
                <Button className="w-full" disabled variant="outline">International payments coming soon</Button>
              )}
              {!canPay && !geoLoading && (
                <p className="text-xs text-muted-foreground mt-2 text-center">We currently accept payments from India only. Global support is on the way.</p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Prices in INR. GST additional as applicable. Cancel anytime — you keep Pro access until the end of your billing cycle.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
