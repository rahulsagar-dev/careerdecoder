import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, Bug, HelpCircle, ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";


const FAQS = [
  { q: "How do AI career recommendations work?", a: "We analyze your profile, skills, and goals, then use AI to match you with careers ranked by fit and growth potential." },
  { q: "Is my resume data secure?", a: "Yes. Files are stored privately with row-level security and only you can access them." },
  { q: "How accurate is the skill gap analysis?", a: "It compares your stated skills against the most common requirements for your target career using normalized matching." },
  { q: "Can I export my career report?", a: "Yes — open the Career Report page and use the export button to download a recruiter-ready PDF." },
  { q: "How do I update my goals?", a: "Go to Profile → Edit and update your target roles, then regenerate recommendations." },
  { q: "Do you support international users?", a: "Yes. Recommendations adapt to the location and market data you provide in your profile." },
];

const Support = () => {
  const { user } = useAuth();
  const [contactOpen, setContactOpen] = useState(false);
  const [bugOpen, setBugOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Support & Help — Career Decode"
        description="Get help with Career Decode. Contact us, report a bug, or browse frequently asked questions about AI career guidance."
        path="/support"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <main className="container max-w-4xl py-10 flex-1">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={user ? "/dashboard" : "/"}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>

        <div className="text-center space-y-2 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">How can we help?</h1>
          <p className="text-muted-foreground">Choose an option below and we'll get back to you.</p>
        </div>

        <h2 className="sr-only">Get support</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setContactOpen(true)}>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Contact Us</CardTitle>
              <CardDescription>General questions, account help, or feature requests.</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setBugOpen(true)}>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-2">
                <Bug className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle className="text-lg">Report a Bug</CardTitle>
              <CardDescription>Something broken? Tell us what happened.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-sm text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Or email us directly at{" "}
          <a href="mailto:support@careerdecode.app" className="text-primary hover:underline">support@careerdecode.app</a>
        </p>
      </div>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
      <BugReportDialog open={bugOpen} onOpenChange={setBugOpen} />
      <Footer />
    </div>
  );
};

/* ----------------------------- Contact Dialog ---------------------------- */

const ContactDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General Question");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.email) setEmail(user.email);
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user?.id ?? null,
        email,
        subject: subject.trim().slice(0, 200),
        category,
        message: message.trim().slice(0, 5000),
      });
      if (error) throw error;
      toast.success("We've received your message and will get back to you within 24-48 hours");
      onOpenChange(false);
      setSubject(""); setMessage(""); setCategory("General Question");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>We typically respond within 24-48 hours.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={loading}>
              <SelectTrigger id="contact-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="General Question">General Question</SelectItem>
                <SelectItem value="Account Issue">Account Issue</SelectItem>
                <SelectItem value="Feature Request">Feature Request</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input id="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea id="contact-message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} disabled={loading} />
            <p className="text-xs text-muted-foreground text-right">{message.length}/5000</p>
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ----------------------------- Bug Report Dialog ---------------------------- */

const BugReportDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [steps, setSteps] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in title and description");
      return;
    }
    setLoading(true);
    try {
      let screenshotUrl: string | null = null;

      if (screenshot && user) {
        const MAX = 5 * 1024 * 1024;
        const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
        if (screenshot.size > MAX) {
          toast.error("Screenshot must be 5MB or smaller");
          setLoading(false);
          return;
        }
        if (screenshot.type && !ALLOWED.includes(screenshot.type)) {
          toast.error("Only PNG, JPEG, WEBP or GIF images are allowed");
          setLoading(false);
          return;
        }
        const extFromName = screenshot.name.split(".").pop()?.toLowerCase() || "png";
        const allowedExts = ["png", "jpg", "jpeg", "webp", "gif"];
        const ext = allowedExts.includes(extFromName) ? extFromName : "png";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("bug-screenshots")
          .upload(path, screenshot, { contentType: screenshot.type || "image/png" });
        if (uploadErr) throw uploadErr;
        screenshotUrl = path;
      }

      const browserInfo = `${navigator.userAgent} | ${window.screen.width}x${window.screen.height} | ${navigator.language}`;

      const { error } = await supabase.from("bug_reports").insert({
        user_id: user?.id ?? null,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 5000),
        expected_behavior: expected.trim().slice(0, 2000) || null,
        steps_to_reproduce: steps.trim().slice(0, 3000) || null,
        severity,
        browser_info: browserInfo.slice(0, 500),
        page_url: window.location.href.slice(0, 500),
        screenshot_url: screenshotUrl,
      });
      if (error) throw error;

      toast.success("Bug report submitted — thank you for helping us improve!");
      onOpenChange(false);
      setTitle(""); setDescription(""); setExpected(""); setSteps(""); setSeverity("medium"); setScreenshot(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit bug report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>The more detail, the faster we can fix it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bug-title">Bug title *</Label>
            <Input id="bug-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} disabled={loading} placeholder="Short summary" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bug-desc">What happened? *</Label>
            <Textarea id="bug-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bug-expected">What did you expect?</Label>
            <Textarea id="bug-expected" rows={2} value={expected} onChange={(e) => setExpected(e.target.value)} maxLength={2000} disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bug-steps">Steps to reproduce (optional)</Label>
            <Textarea id="bug-steps" rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} maxLength={3000} disabled={loading} placeholder="1. Go to...\n2. Click...\n3. See error" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bug-severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity} disabled={loading}>
              <SelectTrigger id="bug-severity"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Screenshot (optional)</Label>
            {screenshot ? (
              <div className="flex items-center justify-between p-2 border rounded-md text-sm">
                <span className="truncate">{screenshot.name}</span>
                <button type="button" onClick={() => setScreenshot(null)} className="text-muted-foreground hover:text-destructive">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label htmlFor="bug-screenshot" className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer">
                <Upload size={16} /> Click to upload an image
                <input id="bug-screenshot" type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
              </label>
            )}
            {!user && screenshot && (
              <p className="text-xs text-destructive">Sign in to attach screenshots.</p>
            )}
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Bug Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Support;
