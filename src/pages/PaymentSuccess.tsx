import { Link } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-9 h-9 text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Welcome to Pro! <Sparkles className="inline w-5 h-5 text-indigo-500" /></h1>
      <p className="text-muted-foreground mb-6">
        Your payment was successful. Your Pro features are being activated — you'll have full access within a minute.
      </p>
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full bg-gradient-to-r from-indigo-500 to-blue-500">
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline" className="w-full"><Link to="/billing">View billing details</Link></Button>
      </div>
    </div>
  </div>
);

export default PaymentSuccess;
