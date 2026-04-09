import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { interviewService, InterviewMessage } from "@/services/interviewService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import {
  Loader2, MessageSquare, Send, CheckCircle2, Brain, Users, Briefcase, Trophy, AlertTriangle, Target, Lightbulb,
} from "lucide-react";

const MODES = [
  { value: "HR", label: "HR Interview", icon: Users, description: "Behavioral & personality" },
  { value: "Technical", label: "Technical Interview", icon: Brain, description: "Deep concept questions" },
  { value: "Behavioral", label: "Behavioral Interview", icon: Briefcase, description: "Scenario-based" },
];

const InterviewSimulatorPage = () => {
  const [mode, setMode] = useState("Technical");
  const [role, setRole] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: any } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = async () => {
    if (!role.trim()) { toast.error("Please enter a target role"); return; }
    setStarting(true);
    try {
      const session = await interviewService.createSession(mode, role);
      setSessionId(session.id);
      setMessages([]);
      setResult(null);
      // Get first AI question
      const aiMsg = await interviewService.sendMessage(session.id, "Hello, I'm ready for the interview.", mode, role);
      setMessages([
        { sender: "user", message: "Hello, I'm ready for the interview." },
        { sender: "ai", message: aiMsg },
      ]);
      toast.success("Interview started!");
    } catch (e: any) {
      toast.error(e.message || "Failed to start interview");
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", message: userMsg }]);
    setSending(true);
    try {
      const aiMsg = await interviewService.sendMessage(sessionId, userMsg, mode, role);
      setMessages((prev) => [...prev, { sender: "ai", message: aiMsg }]);
    } catch (e: any) {
      toast.error(e.message || "Failed to get response");
    } finally {
      setSending(false);
    }
  };

  const finishInterview = async () => {
    if (!sessionId) return;
    setEvaluating(true);
    try {
      const evalResult = await interviewService.evaluateInterview(sessionId);
      setResult(evalResult);
      toast.success("Interview evaluated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to evaluate");
    } finally {
      setEvaluating(false);
    }
  };

  const resetInterview = () => {
    setSessionId(null);
    setMessages([]);
    setResult(null);
    setInput("");
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Interview Simulator</h1>
        <p className="text-muted-foreground mt-1">Practice interviews with AI-powered feedback</p>
      </div>

      {!sessionId ? (
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader>
            <CardTitle className="text-lg">Start a New Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODES.map((m) => (
                <div
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${mode === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                >
                  <m.icon className="h-6 w-6 text-primary mb-2" />
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Target Role</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Frontend Developer, Data Scientist..."
              />
            </div>
            <Button onClick={startInterview} disabled={starting} className="w-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
              {starting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting...</> : "Start Interview"}
            </Button>
          </CardContent>
        </Card>
      ) : result ? (
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm border">
            <CardHeader className="flex flex-row items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <CardTitle className="text-lg">Interview Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-primary">{result.score}</p>
                <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Clarity", value: result.feedback.clarity, weight: "40%" },
                  { label: "Depth", value: result.feedback.depth, weight: "30%" },
                  { label: "Relevance", value: result.feedback.relevance, weight: "20%" },
                  { label: "Confidence", value: result.feedback.confidence, weight: "10%" },
                ].map((metric) => (
                  <div key={metric.label} className="p-3 rounded-xl bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.label} ({metric.weight})</p>
                    <Progress value={metric.value} className="h-1.5 mt-2" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="font-semibold text-sm">Strengths</p>
                  </div>
                  <ul className="space-y-1.5">
                    {(result.feedback.strengths || []).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <p className="font-semibold text-sm">Weaknesses</p>
                  </div>
                  <ul className="space-y-1.5">
                    {(result.feedback.weaknesses || []).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">Improvements</p>
                  </div>
                  <ul className="space-y-1.5">
                    {(result.feedback.improvement_areas || []).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button onClick={resetInterview} className="w-full" variant="outline">Start New Interview</Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="rounded-2xl shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{mode} Interview</CardTitle>
                <p className="text-xs text-muted-foreground">Role: {role}</p>
              </div>
            </div>
            <Button
              onClick={finishInterview}
              disabled={evaluating || messages.filter((m) => m.sender === "user").length < 2}
              size="sm"
              className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]"
            >
              {evaluating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Evaluating...</> : "Finish Interview"}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={scrollRef} className="h-[400px] overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type your answer..."
                disabled={sending}
              />
              <Button onClick={sendMessage} disabled={sending || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default InterviewSimulatorPage;
