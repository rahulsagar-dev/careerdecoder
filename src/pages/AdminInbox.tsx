import { useEffect, useState } from "react";
import { Loader2, Bug, Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { reviewService } from "@/services/reviewService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BugReport {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  expected_behavior: string | null;
  steps_to_reproduce: string | null;
  severity: string;
  browser_info: string | null;
  page_url: string | null;
  screenshot_url: string | null;
  status: string;
  created_at: string;
}

interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUSES = ["open", "in_progress", "resolved", "closed"];

const severityColor = (s: string) =>
  s === "critical"
    ? "bg-destructive text-destructive-foreground"
    : s === "high"
    ? "bg-orange-500 text-white"
    : s === "medium"
    ? "bg-yellow-500 text-white"
    : "bg-muted text-muted-foreground";

const AdminInbox = () => {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const admin = await reviewService.isAdmin(user.id);
      setIsAdmin(admin);
      setChecked(true);
      if (admin) await loadAll();
      else setLoading(false);
    })();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([
        supabase.from("bug_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      ]);
      if (b.error) throw b.error;
      if (t.error) throw t.error;
      setBugs((b.data ?? []) as BugReport[]);
      setTickets((t.data ?? []) as SupportTicket[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    table: "bug_reports" | "support_tickets",
    id: string,
    status: string,
  ) => {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    await loadAll();
  };

  const openScreenshot = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("bug-screenshots")
      .createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  if (!checked || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to view this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const openBugs = bugs.filter((b) => b.status === "open").length;
  const openTickets = tickets.filter((t) => t.status === "open").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Inbox</h1>
          <p className="text-muted-foreground mt-1">
            Bug reports and support tickets submitted by users.
          </p>
        </div>

        <Tabs defaultValue="bugs">
          <TabsList>
            <TabsTrigger value="bugs" className="gap-2">
              <Bug className="h-4 w-4" /> Bugs
              {openBugs > 0 && <Badge variant="destructive">{openBugs}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <Mail className="h-4 w-4" /> Support
              {openTickets > 0 && <Badge>{openTickets}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bugs" className="space-y-3 mt-4">
            {bugs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bug reports yet.</p>
            ) : (
              bugs.map((b) => (
                <Card key={b.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{b.title}</h3>
                          <Badge className={severityColor(b.severity)}>{b.severity}</Badge>
                          <Badge variant="outline">{b.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.created_at).toLocaleString()} · user:{" "}
                          {b.user_id?.slice(0, 8) ?? "anon"}
                        </p>
                      </div>
                      <Select
                        value={b.status}
                        onValueChange={(v) => updateStatus("bug_reports", b.id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{b.description}</p>
                    {b.expected_behavior && (
                      <div className="text-sm">
                        <span className="font-medium">Expected: </span>
                        <span className="text-muted-foreground whitespace-pre-wrap">
                          {b.expected_behavior}
                        </span>
                      </div>
                    )}
                    {b.steps_to_reproduce && (
                      <div className="text-sm">
                        <span className="font-medium">Steps: </span>
                        <span className="text-muted-foreground whitespace-pre-wrap">
                          {b.steps_to_reproduce}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                      {b.page_url && <span>Page: {b.page_url}</span>}
                      {b.browser_info && <span>· {b.browser_info}</span>}
                    </div>
                    {b.screenshot_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openScreenshot(b.screenshot_url!)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> View screenshot
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="support" className="space-y-3 mt-4">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No support tickets yet.</p>
            ) : (
              tickets.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{t.subject}</h3>
                          <Badge variant="secondary">{t.category}</Badge>
                          <Badge variant="outline">{t.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleString()} · {t.email}
                        </p>
                      </div>
                      <Select
                        value={t.status}
                        onValueChange={(v) => updateStatus("support_tickets", t.id, v)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{t.message}</p>
                    <a
                      href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Reply via email →
                    </a>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminInbox;
