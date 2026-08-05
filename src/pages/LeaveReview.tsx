import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { reviewService, Review, shortDisplayName } from "@/services/reviewService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const MAX = 300;

const LeaveReview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [mine, profileRes] = await Promise.all([
          reviewService.getMine(user.id),
          supabase.from("profiles").select("full_name, career_goal, degree").eq("id", user.id).maybeSingle(),
        ]);
        if (mine) {
          setExisting(mine);
          setRating(mine.rating);
          setQuote(mine.quote);
          setName(mine.name);
          setRole(mine.role ?? "");
        } else {
          const p = profileRes.data as { full_name?: string; career_goal?: string; degree?: string } | null;
          setName(p?.full_name ? shortDisplayName(p.full_name) : "");
          setRole(p?.career_goal || p?.degree || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (rating < 1) return toast.error("Please pick a star rating");
    if (!quote.trim()) return toast.error("Please write a short review");
    if (!name.trim()) return toast.error("Please enter a display name");
    setSubmitting(true);
    try {
      await reviewService.submit({
        user_id: user.id,
        name: name.trim(),
        role: role.trim() || null,
        rating,
        quote: quote.trim().slice(0, MAX),
      });
      toast.success("Thanks! Your review is now live.");
      const mine = await reviewService.getMine(user.id);
      setExisting(mine);
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBanner = ({ r }: { r: Review }) => {
    const map = {
      pending: { icon: Clock, cls: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30", label: "Pending approval" },
      approved: { icon: CheckCircle2, cls: "text-green-600 bg-green-500/10 border-green-500/30", label: "Live on the site" },
      rejected: { icon: XCircle, cls: "text-red-600 bg-red-500/10 border-red-500/30", label: "Not approved" },
    }[r.status];
    const Icon = map.icon;
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${map.cls}`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium">Your review is {map.label.toLowerCase()}.</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Leave a Review</h1>
          <p className="text-muted-foreground mt-1">Share your experience with Career Decoder.</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : existing && !editing ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <StatusBanner r={existing} />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < existing.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-sm">"{existing.quote}"</p>
              <p className="text-xs text-muted-foreground">
                — {existing.name}{existing.role ? `, ${existing.role}` : ""}
              </p>
              <Button variant="outline" onClick={() => setEditing(true)}>Edit review</Button>
              <p className="text-xs text-muted-foreground">Editing will reset it to pending approval.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`${n} stars`}
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          (hover || rating) >= n ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="quote">Your review</Label>
                <Textarea
                  id="quote"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value.slice(0, MAX))}
                  rows={4}
                  placeholder="What did you like? How did it help you?"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{quote.length}/{MAX}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="role">Role / Title</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. CS Student" className="mt-1.5" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={submit} disabled={submitting} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
                  {submitting ? "Submitting…" : existing ? "Update review" : "Submit review"}
                </Button>
                {existing && (
                  <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LeaveReview;
