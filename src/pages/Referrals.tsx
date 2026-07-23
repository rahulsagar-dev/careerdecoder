import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Copy, Share2, Gift, Users, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";

const SITE = "https://careerdecoder.work";

const Referrals = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string>("");
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: codeData, error: codeErr } = await supabase.functions.invoke("get-referral-code");
      if (codeErr) toast.error("Could not load referral code");
      else setCode(((codeData as { code?: string })?.code) || "");

      const { count: c } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", user.id);
      setCount(c ?? 0);
      setLoading(false);
    })();
  }, [user]);

  const link = code ? `${SITE}/signup?ref=${code}` : "";
  const rewardDays = count * 30;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Career Decoder — AI Career Coach",
          text: "I'm using Career Decoder to decode my next role. Sign up with my link and we both get 30 days of Pro free.",
          url: link,
        });
      } catch { /* user cancelled */ }
    } else {
      copy(link, "Link");
    }
  };

  return (
    <DashboardLayout>
      <SEO title="Refer friends — Career Decoder" description="Invite friends and both get 30 days of Pro free." path="/referrals" />
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Refer &amp; earn Pro</h1>
          <p className="text-muted-foreground mt-1">
            Share your link. When a friend signs up, <span className="font-medium text-foreground">both of you get 30 days of Pro free</span>.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="text-primary" size={22} />
              </div>
              <div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">Friends joined</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gift className="text-primary" size={22} />
              </div>
              <div>
                <div className="text-2xl font-bold">{rewardDays} days</div>
                <div className="text-sm text-muted-foreground">Pro time earned</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your referral link</CardTitle>
            <CardDescription>Anyone who signs up with this link gets 30 days of Pro instantly — and so do you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="animate-spin" size={16} /> Loading…
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input readOnly value={link} className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copy(link, "Link")} aria-label="Copy link">
                    <Copy size={16} />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={code} className="font-mono text-sm max-w-[180px]" />
                  <Button variant="outline" onClick={() => copy(code, "Code")}>Copy code</Button>
                  <Button
                    className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90"
                    onClick={share}
                  >
                    <Share2 size={16} className="mr-2" /> Share
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">1.</span> Share your link on WhatsApp, LinkedIn, or with a friend.</p>
            <p><span className="font-medium text-foreground">2.</span> They sign up with the link and verify their email.</p>
            <p><span className="font-medium text-foreground">3.</span> Both of you instantly get <span className="text-foreground font-medium">30 days of Pro</span> added to your subscription.</p>
            <p className="pt-2 text-xs">Rewards are stackable — every friend adds another 30 days. Self-referrals don't count.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Referrals;
