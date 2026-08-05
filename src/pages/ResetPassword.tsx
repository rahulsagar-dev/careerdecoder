import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Recovery links arrive with #type=recovery in the URL hash.
    // Supabase auto-exchanges the token and emits a PASSWORD_RECOVERY event.
    const hash = window.location.hash;
    const isRecovery = hash.includes("type=recovery");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setTokenInvalid(false);
        setChecking(false);
      }
    });

    // If no recovery hash & no existing session, the link is invalid/expired.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isRecovery && !session) {
        setTokenInvalid(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setIsLoading(true);
    try {
      await authService.updatePassword(password);
      toast.success("Password updated! Please log in.");
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      const msg = error.message || "Failed to reset password";
      toast.error(msg);
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("expired")) {
        setTokenInvalid(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
        <CardHeader className="text-center space-y-1">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent mx-auto">
            Career Decoder
          </Link>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            {tokenInvalid ? "This reset link is invalid or has expired" : "Enter your new password below"}
          </CardDescription>
        </CardHeader>
        {tokenInvalid ? (
          <CardContent className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">
              Reset links expire after a short time for security. Request a new one to continue.
            </p>
            <Button asChild className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
              <Link to="/forgot-password">Request new reset link</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input id="password" type={showPwd ? "text" : "password"} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1} aria-label={showPwd ? "Hide password" : "Show password"}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1} aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</> : "Reset Password"}
              </Button>
            </CardContent>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
