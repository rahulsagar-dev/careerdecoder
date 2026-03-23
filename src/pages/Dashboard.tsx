import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="container max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-xl border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">
              Dashboard
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground">
              Welcome, <span className="font-semibold">{user?.user_metadata?.full_name || user?.email}</span>!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This is your dashboard. More features coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
