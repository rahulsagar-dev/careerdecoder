import { toast } from "sonner";
import { billingService } from "./billingService";
import { requestUpgrade } from "@/components/UpgradeModal";

export class UpgradeRequiredError extends Error {
  code = "UPGRADE_REQUIRED";
  reason: string;
  feature: string;
  constructor(feature: string, reason: string, message: string) {
    super(message);
    this.feature = feature;
    this.reason = reason;
  }
}

const LABEL: Record<string, string> = {
  "career-recommendations": "career recommendations",
  "skill-analysis": "skill gap analysis",
  "github-analysis": "GitHub analysis",
  "interview-session": "interview simulator",
  "resume-analysis": "resume analysis",
  "career-report": "career report",
};

/**
 * Client-side pre-check before running an AI feature.
 * The actual increment is done atomically server-side inside each AI edge
 * function, so limits cannot be bypassed. Throws UpgradeRequiredError if
 * blocked AND dispatches the global upgrade modal.
 */
export async function gateFeature(feature: keyof typeof LABEL, increment = false) {
  const res = await billingService.checkUsage(feature, increment);
  if (!res.allowed) {
    const label = LABEL[feature] || feature;
    const reason = res.reason || "limit_reached";
    const msg = reason === "pro_only"
      ? `${label} is a Pro-only feature.`
      : `You've used all your free ${label} runs this month.`;
    requestUpgrade({ feature: label, reason });
    throw new UpgradeRequiredError(label, reason, msg);
  }
  return res;
}

function looksLikeUpgradeError(err: unknown): { feature?: string; reason: string } | null {
  if (err instanceof UpgradeRequiredError) return { feature: err.feature, reason: err.reason };
  const msg = (err instanceof Error ? err.message : String(err || "")).toLowerCase();
  if (!msg) return null;
  if (msg.includes("pro subscription required") || msg.includes("pro-only") || msg.includes("pro only")) {
    return { reason: "pro_only" };
  }
  if (msg.includes("limit reached") || msg.includes("free-tier limit") || msg.includes("free tier limit") || msg.includes("upgrade to pro")) {
    return { reason: "limit_reached" };
  }
  return null;
}

/**
 * Central error handler for AI feature calls. Opens the upgrade modal on
 * limit / pro-only errors and returns true (caller should skip its own toast).
 * For any other error, shows a toast and returns false.
 */
export function handleFeatureError(err: unknown, fallback = "Something went wrong"): boolean {
  const up = looksLikeUpgradeError(err);
  if (up) {
    requestUpgrade({ feature: up.feature, reason: up.reason });
    return true;
  }
  const msg = err instanceof Error ? err.message : fallback;
  toast.error(msg || fallback);
  return false;
}
