import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRe.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    setIsLoading(true);
    try {
      // Always attempt — never reveal whether the email exists.
      await authService.sendPasswordReset(email).catch(() => null);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-0">
        <CardHeader className="text-center space-y-1">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent mx-auto">
            Career Decoder
          </Link>
          <CardTitle className="text-xl">Forgot password?</CardTitle>
          <CardDescription>
            {sent ? "Check your inbox" : "Enter your email and we'll send a reset link"}
          </CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Reset Link"}
              </Button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </CardContent>
          </form>
        ) : (
          <CardContent className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Try a different email
            </Button>
            <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
