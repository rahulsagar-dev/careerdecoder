import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { interviewService, InterviewChatResponse } from "@/services/interviewService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import { handleFeatureError } from "@/services/featureGate";
import ReactMarkdown from "react-markdown";
import {
  Loader2, MessageSquare, Send, CheckCircle2, Brain, Users, Briefcase, Trophy,
  AlertTriangle, Lightbulb, XCircle, ClipboardList, ArrowUp, ArrowDown, Minus, Lock, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

const MODES = [
  { value: "HR", label: "HR Interview", icon: Users, description: "Behavioral & personality" },
  { value: "Technical", label: "Technical Interview", icon: Brain, description: "Deep concept questions" },
  { value: "Behavioral", label: "Behavioral Interview", icon: Briefcase, description: "Scenario-based" },
];

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/10 text-green-700 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-700 border-red-500/20",
};

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
  const [difficulty, setDifficulty] = useState("easy");
  const [questionNum, setQuestionNum] = useState(0);
  const [currentTopic, setCurrentTopic] = useState("");
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
      setDifficulty("easy");
      setQuestionNum(0);
      const aiResponse = await interviewService.sendMessage(session.id, "Hello, I'm ready for the interview.", mode, role);
      setMessages([
        { sender: "user", message: "Hello, I'm ready for the interview." },
        { sender: "ai", message: aiResponse.message },
      ]);
      setDifficulty(aiResponse.difficulty_level);
      setQuestionNum(aiResponse.question_number);
      setCurrentTopic(aiResponse.topic);
      toast.success("Interview started!");
    } catch (e: any) {
      handleFeatureError(e, "Failed to start interview");
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
      const aiResponse = await interviewService.sendMessage(sessionId, userMsg, mode, role);
      setMessages((prev) => [...prev, { sender: "ai", message: aiResponse.message }]);
      setDifficulty(aiResponse.difficulty_level);
      setQuestionNum(aiResponse.question_number);
      setCurrentTopic(aiResponse.topic);
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
    setDifficulty("easy");
    setQuestionNum(0);
    setCurrentTopic("");
  };

  const feedbackMetrics = result ? [
    { label: "Clarity", value: result.feedback.clarity, weight: "25%", icon: CheckCircle2 },
    { label: "Technical Depth", value: result.feedback.technical_depth, weight: "25%", icon: Brain },
    { label: "Problem Solving", value: result.feedback.problem_solving, weight: "20%", icon: Lightbulb },
    { label: "Communication", value: result.feedback.communication, weight: "15%", icon: MessageSquare },
    { label: "Confidence", value: result.feedback.confidence, weight: "15%", icon: Trophy },
  ] : [];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Interview Simulator</h1>
        <p className="text-muted-foreground mt-1">Practice interviews with adaptive AI feedback</p>
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
          {/* Score */}
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

              {/* 5-dimension breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {feedbackMetrics.map((metric) => (
                  <div key={metric.label} className="p-3 rounded-xl bg-muted/50 text-center">
                    <metric.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-[10px] text-muted-foreground/60">({metric.weight})</p>
                    <Progress value={metric.value} className="h-1.5 mt-2" />
                  </div>
                ))}
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Missed Concepts */}
              {result.feedback.missed_concepts?.length > 0 && (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <p className="font-semibold text-sm">Missed Concepts</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.feedback.missed_concepts.map((c: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs border-destructive/30 text-destructive">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Plan */}
              {result.feedback.improvement_plan?.length > 0 && (
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">Improvement Plan</p>
                  </div>
                  <ol className="space-y-2">
                    {result.feedback.improvement_plan.map((step: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="font-bold text-primary min-w-[20px]">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

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
            <div className="flex items-center gap-2">
              {/* Live indicators */}
              <Badge variant="outline" className={`text-[10px] ${difficultyColors[difficulty] || ""}`}>
                {difficulty === "easy" ? <ArrowDown className="h-3 w-3 mr-1" /> :
                 difficulty === "hard" ? <ArrowUp className="h-3 w-3 mr-1" /> :
                 <Minus className="h-3 w-3 mr-1" />}
                {difficulty}
              </Badge>
              <Badge variant="outline" className="text-[10px]">Q{questionNum}</Badge>
              {currentTopic && (
                <Badge variant="secondary" className="text-[10px] max-w-[120px] truncate">
                  {currentTopic}
                </Badge>
              )}
              <Button
                onClick={finishInterview}
                disabled={evaluating || messages.filter((m) => m.sender === "user").length < 3}
                size="sm"
                className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]"
              >
                {evaluating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Evaluating...</> : "Finish Interview"}
              </Button>
            </div>
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
                    {msg.sender === "ai" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.message
                    )}
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
