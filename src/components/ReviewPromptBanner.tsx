import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { reviewService } from "@/services/reviewService";
import { Button } from "@/components/ui/button";

const KEY = "cd_review_prompt_dismissed";

const ReviewPromptBanner = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(KEY)) return;
    reviewService.getMine(user.id).then((mine) => {
      if (!mine) setShow(true);
    }).catch(() => {});
  }, [user]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div className="relative rounded-2xl border bg-gradient-to-r from-primary/10 to-[hsl(260,84%,60%)]/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(260,84%,60%)] flex items-center justify-center shrink-0">
        <Star className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-semibold">Enjoying Career Decoder?</p>
        <p className="text-sm text-muted-foreground">Leave a quick review — it takes 30 seconds and helps others.</p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm" className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
          <Link to="/leave-review" onClick={dismiss}>Sure</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>Maybe later</Button>
      </div>
      <button aria-label="Dismiss" onClick={dismiss} className="absolute top-2 right-2 sm:hidden text-muted-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ReviewPromptBanner;
