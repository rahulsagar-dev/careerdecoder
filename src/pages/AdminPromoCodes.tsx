import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percent" | "flat" | "free_extension" | "free_upgrade";
  discount_value: number;
  applies_to: "monthly" | "yearly" | "any";
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

async function callAdmin(action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const { data, error } = await supabase.functions.invoke("admin-promo-codes", {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

const AdminPromoCodes = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<PromoCode["discount_type"]>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [appliesTo, setAppliesTo] = useState<PromoCode["applies_to"]>("any");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      setIsAdmin(!!(data as any)?.is_admin);
    })();
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await callAdmin("list");
      setCodes(res.codes || []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleCreate = async () => {
    if (!code.trim() || !discountValue) {
      toast.error("Code and value required");
      return;
    }
    setCreating(true);
    try {
      await callAdmin("create", {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        applies_to: appliesTo,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expires_at: expiresAt || null,
      });
      toast.success("Code created");
      setCode("");
      setDiscountValue("");
      setMaxRedemptions("");
      setExpiresAt("");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await callAdmin("update", { id, active });
      setCodes((cs) => cs.map((c) => (c.id === id ? { ...c, active } : c)));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    try {
      await callAdmin("delete", { id });
      setCodes((cs) => cs.filter((c) => c.id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const valueHint = () => {
    switch (discountType) {
      case "percent": return "1-100 (e.g. 50 = 50% off)";
      case "flat": return "Amount in paise (e.g. 10000 = ₹100)";
      case "free_extension": return "Number of free days";
      case "free_upgrade": return "Any positive number (100% off)";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Promo Codes</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-4 h-4" /> Create new code
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LAUNCH50" className="font-mono" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as PromoCode["discount_type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent off</SelectItem>
                  <SelectItem value="flat">Flat off (paise)</SelectItem>
                  <SelectItem value="free_extension">Free extension (days)</SelectItem>
                  <SelectItem value="free_upgrade">Free upgrade (100% off)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={valueHint()} />
              <p className="text-xs text-muted-foreground mt-1">{valueHint()}</p>
            </div>
            <div>
              <Label>Applies to</Label>
              <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as PromoCode["applies_to"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any plan</SelectItem>
                  <SelectItem value="monthly">Monthly only</SelectItem>
                  <SelectItem value="yearly">Yearly only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max redemptions (optional)</Label>
              <Input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" />
            </div>
            <div>
              <Label>Expires at (optional)</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…</> : "Create code"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">All codes ({codes.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : codes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No codes yet.</p>
            ) : (
              <div className="space-y-3">
                {codes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border rounded-lg p-4 gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-lg">{c.code}</span>
                        <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge>
                        <Badge variant="outline">
                          {c.discount_type === "percent" && `${c.discount_value}% off`}
                          {c.discount_type === "flat" && `₹${(c.discount_value / 100).toFixed(0)} off`}
                          {c.discount_type === "free_extension" && `+${c.discount_value} days`}
                          {c.discount_type === "free_upgrade" && "Free upgrade"}
                        </Badge>
                        <Badge variant="outline">{c.applies_to}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Redeemed {c.redemption_count}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""} times
                        {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={c.active} onCheckedChange={(v) => toggleActive(c.id, v)} />
                      <Button size="icon" variant="ghost" onClick={() => deleteCode(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPromoCodes;
