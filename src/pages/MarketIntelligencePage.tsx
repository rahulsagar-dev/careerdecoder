import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { marketService, MarketData } from "@/services/marketService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import { Loader2, TrendingUp, DollarSign, BarChart3, Lightbulb, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";

const demandColors: Record<string, string> = {
  High: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Low: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const MarketIntelligencePage = () => {
  const [role, setRole] = useState("");
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!role.trim()) { toast.error("Enter a role"); return; }
    setGenerating(true);
    try {
      const result = await marketService.generateInsights(role.trim());
      setData(result);
      toast.success("Market insights generated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Market Intelligence</h1>
        <p className="text-muted-foreground mt-1">AI-powered market analysis for any role</p>
      </div>

      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter a role (e.g., Frontend Developer, ML Engineer...)"
              onKeyDown={(e) => e.key === "Enter" && generate()}
              className="flex-1"
            />
            <Button onClick={generate} disabled={generating} className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] shrink-0">
              {generating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...</> : <><Search className="h-4 w-4 mr-2" /> Analyze</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Salary Range</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">{data.salary_range}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Demand Level</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`text-sm px-3 py-1 ${demandColors[data.demand_level] || ""}`}>
                  {data.demand_level}
                </Badge>
              </CardContent>
            </Card>
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Role</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">{data.role}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-sm border">
            <CardHeader className="flex flex-row items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Trending Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(data.trending_skills || []).map((skill) => (
                  <Badge key={skill} variant="secondary" className="rounded-lg px-3 py-1">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border">
            <CardHeader className="flex flex-row items-center gap-3">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Market Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{data.insights}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MarketIntelligencePage;
