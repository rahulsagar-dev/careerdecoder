import { Construction } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const ComingSoon = () => (
  <DashboardLayout>
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Construction className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold text-foreground">🚧 Feature Under Construction</h2>
      <p className="text-muted-foreground mt-2">This feature is coming soon. Stay tuned!</p>
    </div>
  </DashboardLayout>
);

export default ComingSoon;
