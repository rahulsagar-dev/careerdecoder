import { billingService } from "./billingService";

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
 * Pass `increment=false` (default) — the actual increment is done atomically
 * server-side inside each AI edge function so limits cannot be bypassed.
 * Throws UpgradeRequiredError if blocked.
 */
export async function gateFeature(feature: keyof typeof LABEL, increment = false) {
  const res = await billingService.checkUsage(feature, increment);
  if (!res.allowed) {
    const label = LABEL[feature] || feature;
    const msg = res.reason === "pro_only"
      ? `${label} is a Pro-only feature. Upgrade to unlock it.`
      : `You've used all your free ${label} runs this month. Upgrade to Pro for unlimited access.`;
    throw new UpgradeRequiredError(label, res.reason || "limit_reached", msg);
  }
  return res;
}
