import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { billingService } from "@/services/billingService";

const REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing a feature I need",
  "Found an alternative",
  "Just testing",
  "Other",
];

const Billing = () => {
  const { plan, status, isPro, currentPeriodEnd, cancelAtPeriodEnd, billingInterval, refresh, loading } = useSubscription();
  const [step, setStep] = useState<"closed" | "reason" | "confirm">("closed");
  const [reason, setReason] = useState<string>("");
  const [canceling, setCanceling] = useState(false);

  const periodEndStr = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : null;

  const doCancel = async () => {
    setCanceling(true);
    try {
      await billingService.cancel();
      toast.success("Subscription canceled. You keep Pro access until the end of your billing period.");
      await refresh();
      setStep("closed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your plan and payment settings.</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-semibold">Current Plan</h2>
                  <Badge className={isPro ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white" : ""}>
                    {isPro ? <><Sparkles className="w-3 h-3 mr-1" /> Pro</> : "Free"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="capitalize">{status}</span>
                  {billingInterval && isPro ? ` · Billed ${billingInterval}` : ""}
                </p>
              </div>
              {!isPro && (
                <Button asChild className="bg-gradient-to-r from-indigo-500 to-blue-500">
                  <Link to="/pricing"><Sparkles className="w-4 h-4 mr-2" /> Upgrade to Pro</Link>
                </Button>
              )}
            </div>

            {isPro && periodEndStr && (
              <div className={`rounded-lg p-4 flex items-start gap-3 ${cancelAtPeriodEnd ? "bg-amber-500/10 border border-amber-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                {cancelAtPeriodEnd ? <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />}
                <div className="text-sm">
                  {cancelAtPeriodEnd ? (
                    <>Canceling — active until <strong>{periodEndStr}</strong>. You'll be moved to the Free plan after that.</>
                  ) : (
                    <>Pro access active until: <strong>{periodEndStr}</strong></>
                  )}
                </div>
              </div>
            )}

            {isPro && !cancelAtPeriodEnd && (
              <div className="pt-2">
                <Button variant="outline" onClick={() => setStep("reason")}>Cancel subscription</Button>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-1">Need help?</h3>
          <p className="text-sm text-muted-foreground mb-3">Questions about billing or refunds? We're here.</p>
          <Button variant="outline" asChild><Link to="/support">Contact support</Link></Button>
        </div>
      </div>

      <Dialog open={step !== "closed"} onOpenChange={(v) => !v && setStep("closed")}>
        <DialogContent>
          {step === "reason" && (
            <>
              <DialogHeader>
                <DialogTitle>We're sorry to see you go</DialogTitle>
                <DialogDescription>Help us improve — why are you canceling?</DialogDescription>
              </DialogHeader>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-2 py-2">
                {REASONS.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <RadioGroupItem value={r} id={r} />
                    <Label htmlFor={r} className="cursor-pointer">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("closed")}>Keep Pro</Button>
                <Button variant="destructive" disabled={!reason} onClick={() => setStep("confirm")}>Continue</Button>
              </DialogFooter>
            </>
          )}
          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm cancellation</DialogTitle>
                <DialogDescription>
                  Your Pro access will continue until {periodEndStr || "the end of your billing period"}. After that, you'll be moved to the Free plan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("reason")} disabled={canceling}>Back</Button>
                <Button variant="destructive" onClick={doCancel} disabled={canceling}>
                  {canceling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Canceling…</> : "Confirm cancel"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Billing;
