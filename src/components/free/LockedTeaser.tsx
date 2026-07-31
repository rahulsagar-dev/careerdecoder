import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  items: string[];
  footnote?: string;
}

/** Blurred teaser for content that only exists behind a free account. */
const LockedTeaser = ({ title, items, footnote }: Props) => (
  <Card className="relative overflow-hidden rounded-2xl border-dashed">
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>

      <ul className="space-y-3 select-none pb-28" aria-hidden="true">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground blur-[5px]">{item}</li>
        ))}
      </ul>

      <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-background via-background/95 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-6 text-center space-y-3">
        <p className="text-sm font-medium">{footnote}</p>
        <Button asChild className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity">
          <Link to="/signup">
            <Sparkles className="h-4 w-4 mr-2" /> Create free account to unlock
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">Free forever plan · no credit card</p>
      </div>
    </CardContent>
  </Card>
);

export default LockedTeaser;
