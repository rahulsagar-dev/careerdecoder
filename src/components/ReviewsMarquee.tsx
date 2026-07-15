import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reviewService, Review } from "@/services/reviewService";
import { Button } from "@/components/ui/button";

const MIN_FOR_DISPLAY = 6;
const AVATAR_COLORS = [
  "from-primary to-[hsl(260,84%,60%)]",
  "from-[hsl(200,84%,55%)] to-[hsl(260,84%,60%)]",
  "from-[hsl(340,82%,58%)] to-[hsl(24,90%,58%)]",
  "from-[hsl(150,60%,45%)] to-[hsl(190,70%,50%)]",
  "from-[hsl(45,90%,55%)] to-[hsl(20,85%,55%)]",
];

const hashIdx = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % AVATAR_COLORS.length;
};

const ReviewCard = ({ r }: { r: Review }) => (
  <div className="shrink-0 w-[320px] md:w-[360px] mx-3 rounded-2xl border bg-card shadow-sm p-5 flex flex-col gap-3">
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
    <p className="text-sm text-foreground/90 leading-relaxed line-clamp-6 min-h-[6rem]">
      "{r.quote}"
    </p>
    <div className="flex items-center gap-3 mt-auto pt-2">
      <div
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[hashIdx(r.user_id)]} text-white text-sm font-semibold flex items-center justify-center shrink-0`}
      >
        {r.avatar_initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{r.name}</p>
        {r.role && <p className="text-xs text-muted-foreground truncate">{r.role}</p>}
      </div>
    </div>
  </div>
);

const Row = ({ reviews, direction, duration }: { reviews: Review[]; direction: "left" | "right"; duration: number }) => {
  const loop = [...reviews, ...reviews];
  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className="flex w-max"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
          animationPlayState: "running",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {loop.map((r, i) => (
          <ReviewCard key={`${r.id}-${i}`} r={r} />
        ))}
      </div>
    </div>
  );
};

const ReviewsMarquee = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    reviewService
      .getApproved()
      .then((r) => mounted && setReviews(r))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    const channel = supabase
      .channel("reviews-public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: "status=eq.approved" },
        () => {
          reviewService.getApproved().then((r) => mounted && setReviews(r)).catch(() => {});
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return null;
  if (reviews.length < MIN_FOR_DISPLAY) return null;

  const useTwoRows = reviews.length >= 8;
  const mid = Math.ceil(reviews.length / 2);
  const rowA = useTwoRows ? reviews.slice(0, mid) : reviews;
  const rowB = useTwoRows ? reviews.slice(mid) : [];
  const duration = Math.min(60, Math.max(40, reviews.length * 6));

  return (
    <section className="py-20 bg-background">
      <style>{`
        @keyframes marquee-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
      <div className="container space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">What Our Users Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real feedback from people using Career Decode to shape their future.
          </p>
        </div>
        <div className="space-y-4">
          <Row reviews={rowA} direction="left" duration={duration} />
          {useTwoRows && <Row reviews={rowB} direction="right" duration={duration + 6} />}
        </div>
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/leave-review">Share your experience</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReviewsMarquee;
