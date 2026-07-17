import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Sparkles, Loader2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsIndia } from "@/hooks/useIndiaGeo";
import { billingService, loadRazorpay } from "@/services/billingService";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";

const FREE_FEATURES = [
  "1 career recommendation run",
  "2 resume analyses / month",
  "2 skill gap analyses / month",
  "1 GitHub analysis / month",
  "1 LinkedIn profile analysis / month",
  "Basic market intelligence",
  "AI Interview Simulator — Pro only",
];

const PRO_FEATURES = [
  "Unlimited career recommendations",
  "Unlimited resume & skill analyses",
  "Unlimited GitHub analyses",
  "Unlimited LinkedIn profile analyses",
  "Unlimited AI interview simulations (Pro exclusive)",
  "Full market intelligence insights",
  "Career report PDF export",
  "Priority support",
];

const Pricing = () => {
  const { user, loading: authLoading } = useAuth();
  const { plan, isPro, refresh, loading: subscriptionLoading } = useSubscription();
  const { isIndia, loading: geoLoading } = useIsIndia();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [applied, setApplied] = useState<{
    code: string;
    final_amount_paise: number;
    base_amount_paise: number;
    discount_paise: number;
    is_free: boolean;
    discount_type: string;
    discount_value: number;
    extension_days: number;
  } | null>(null);

  const formatINR = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const basePaise = interval === "monthly" ? 49900 : 399900;
  const price = formatINR(basePaise);
  const suffix = interval === "monthly" ? "/mo" : "/yr";

  // Clear applied code when interval changes and it's plan-restricted or reprice.
  const onIntervalChange = (v: "monthly" | "yearly") => {
    setInterval(v);
    if (applied) setApplied(null);
  };

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }
    setApplyingPromo(true);
    try {
      const res = await billingService.validatePromo(code, interval);
      setApplied({
        code: res.code,
        final_amount_paise: res.final_amount_paise,
        base_amount_paise: res.base_amount_paise,
        discount_paise: res.discount_paise,
        is_free: res.is_free,
        discount_type: res.discount_type,
        discount_value: res.discount_value,
        extension_days: res.extension_days,
      });
      toast.success("Code applied");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setApplied(null);
    setPromoInput("");
  };

  const handleUpgrade = async () => {
    if (authLoading) return;

    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }
    setLoading(true);
    try {
      const res = await billingService.createSubscription(interval, applied?.code);

      // Free path (100% off / free extension / free upgrade) — no Razorpay.
      if (res.free) {
        toast.success("Pro activated!");
        await refresh();
        navigate("/payment-success");
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) throw new Error("Failed to load Razorpay");

      const rzp = new (window as any).Razorpay({
        key: res.key_id,
        order_id: res.order_id,
        amount: res.amount,
        currency: res.currency,
        name: "Decode My Career",
        description: `Pro ${interval} plan${applied ? ` (${applied.code})` : ""}`,
        prefill: { email: user.email },
        theme: { color: "#4f46e5" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await billingService.verifyPayment(response);
            toast.success("Payment verified! Pro is active.");
            await refresh();
            navigate("/payment-success");
          } catch (e) {
            toast.error((e as Error).message);
            setLoading(false);
          }
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
  const checkoutLoading = loading || authLoading || subscriptionLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Pricing — Career Decode" description="Simple plans for Career Decode. Choose monthly or yearly and unlock AI-powered career guidance, roadmaps, and interview prep." path="/pricing" />
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
                onClick={() => onIntervalChange("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${interval === "monthly" ? "bg-background shadow" : ""}`}
              >Monthly</button>
              <button
                onClick={() => onIntervalChange("yearly")}
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
              ) : geoLoading || authLoading || subscriptionLoading ? (
                <Button className="w-full" disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</Button>
              ) : canPay ? (
                <Button
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
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
            Prices in INR. GST additional as applicable. Pro access remains active until the end of your selected period.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
