import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";

export interface UpgradeEventDetail {
  feature?: string;
  reason?: "limit_reached" | "pro_only" | string;
}

export const UPGRADE_EVENT = "upgrade-required";

/** Dispatch anywhere in the app to open the upgrade modal. */
export function requestUpgrade(detail: UpgradeEventDetail = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(UPGRADE_EVENT, { detail }));
  }
}

const PRO_BENEFITS = [
  "Unlimited career recommendations",
  "Unlimited resume & skill analysis",
  "Full interview simulator access",
  "Career reports (PDF export)",
  "Full market intelligence insights",
];

/** Global upgrade modal. Mount once, near the app root. */
const UpgradeModal = () => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpgradeEventDetail>({});
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<UpgradeEventDetail>;
      setDetail(ce.detail || {});
      setOpen(true);
    };
    window.addEventListener(UPGRADE_EVENT, handler);
    return () => window.removeEventListener(UPGRADE_EVENT, handler);
  }, []);

  const isProOnly = detail.reason === "pro_only";
  const headline = isProOnly ? "This is a Pro feature" : "You've reached your free limit";
  const subline = isProOnly
    ? "Upgrade to Pro to unlock this and everything else."
    : "You've used all your free runs this month. Keep the momentum going with Pro.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">{headline}</DialogTitle>
          <DialogDescription className="text-center">{subline}</DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm font-semibold mb-3 text-foreground">Pro unlocks everything:</p>
          <ul className="space-y-2.5">
            {PRO_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
                <span className="text-foreground/90">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} className="sm:flex-1">
            Maybe later
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              navigate("/pricing");
            }}
            className="sm:flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            See Pro Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
