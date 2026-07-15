import { useEffect, useState } from "react";
import { Star, Check, X, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { reviewService, Review } from "@/services/reviewService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminReviews = () => {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const admin = await reviewService.isAdmin(user.id);
      setIsAdmin(admin);
      setChecked(true);
      if (admin) await load();
      else setLoading(false);
    })();
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      setReviews(await reviewService.listAll());
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (id: string, status: "approved" | "rejected" | "pending") => {
    try {
      await reviewService.setStatus(id, status);
      toast.success(`Review ${status}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
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
          <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  const pending = reviews.filter((r) => r.status === "pending");
  const approved = reviews.filter((r) => r.status === "approved");
  const rejected = reviews.filter((r) => r.status === "rejected");

  const Row = ({ r }: { r: Review }) => (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{r.name}</p>
              {r.role && <span className="text-xs text-muted-foreground">· {r.role}</span>}
            </div>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
              ))}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
        </div>
        <p className="text-sm">"{r.quote}"</p>
        <div className="flex gap-2 pt-1">
          {r.status !== "approved" && (
            <Button size="sm" onClick={() => setStatus(r.id, "approved")}>
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
          )}
          {r.status !== "rejected" && (
            <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          )}
          {r.status !== "pending" && (
            <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "pending")}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Reviews</h1>
          {pending.length > 0 && <Badge>{pending.length} pending</Badge>}
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending reviews.</p>
          ) : (
            pending.map((r) => <Row key={r.id} r={r} />)
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Approved ({approved.length})</h2>
          {approved.map((r) => <Row key={r.id} r={r} />)}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Rejected ({rejected.length})</h2>
          {rejected.map((r) => <Row key={r.id} r={r} />)}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminReviews;
