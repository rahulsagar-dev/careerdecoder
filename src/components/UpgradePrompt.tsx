import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  feature: string;
  reason?: "limit_reached" | "pro_only" | string;
}

const UpgradePrompt = ({ open, onOpenChange, feature, reason }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          {reason === "pro_only" ? `${feature} is a Pro feature` : "You've hit your Free limit"}
        </DialogTitle>
        <DialogDescription>
          {reason === "pro_only"
            ? `Upgrade to Pro to unlock ${feature.toLowerCase()} and everything else.`
            : `You've used all your free ${feature.toLowerCase()} runs this month. Upgrade to Pro for unlimited access.`}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Maybe later</Button>
        <Button asChild className="bg-gradient-to-r from-indigo-500 to-blue-500">
          <Link to="/pricing">Upgrade to Pro</Link>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default UpgradePrompt;
