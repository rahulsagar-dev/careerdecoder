import { Link } from "react-router-dom";
import { Brain, BarChart3, Map, FileText, Mic, UserPlus, Lightbulb, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReviewsMarquee from "@/components/ReviewsMarquee";

const features = [
  { icon: Brain, title: "AI Career Recommendations", desc: "Get personalized career paths powered by advanced AI algorithms tailored to your skills and aspirations." },
  { icon: BarChart3, title: "Skill Gap Analysis", desc: "Identify the skills you need to develop and close the gap between where you are and where you want to be." },
  { icon: Map, title: "Learning Roadmaps", desc: "Follow curated learning paths with courses, projects, and milestones to reach your career goals." },
  { icon: FileText, title: "Resume Intelligence", desc: "AI-powered resume analysis and suggestions to make your application stand out to recruiters." },
  { icon: Mic, title: "Interview Preparation", desc: "Practice with AI-driven mock interviews and get real-time feedback to boost your confidence." },
];

const steps = [
  { icon: UserPlus, num: "01", title: "Create Profile", desc: "Set up your profile with your skills, experience, and career goals." },
  { icon: Lightbulb, num: "02", title: "Get AI Insights", desc: "Receive personalized recommendations and actionable insights." },
  { icon: Route, num: "03", title: "Follow Roadmap", desc: "Execute your customized learning and career roadmap step by step." },
];

const Landing = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Decode Your Career{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">
              with AI
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
            Personalized career paths, skill analysis, and job-ready insights — all powered by artificial intelligence.
          </p>
          <div className="flex gap-4 justify-center md:justify-start">
            <Button size="lg" className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity text-base px-8" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Explore Features
            </Button>
          </div>
        </div>

        {/* Decorative graphic */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-[hsl(260,84%,60%)]/30 blur-3xl" />
            <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-primary/50 to-[hsl(260,84%,60%)]/50 blur-2xl animate-pulse" />
            <div className="absolute inset-16 rounded-full bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] opacity-80 flex items-center justify-center">
              <Brain className="text-primary-foreground" size={64} />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="py-20 bg-muted/50">
      <div className="container space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to navigate your career journey with confidence.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="border-0 shadow-md hover:shadow-lg transition-shadow rounded-xl">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="text-primary" size={24} />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="py-20">
      <div className="container space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Three simple steps to unlock your career potential.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-[hsl(260,84%,60%)] flex items-center justify-center">
                <s.icon className="text-primary-foreground" size={28} />
              </div>
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Step {s.num}</span>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <ReviewsMarquee />

    {/* CTA */}
    <section className="py-20 bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
      <div className="container text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">Start Building Your Future Today</h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto">Join thousands of professionals who are already decoding their career paths with AI.</p>
        <Button size="lg" variant="secondary" className="text-base px-8 font-semibold" asChild>
          <Link to="/signup">Create Free Account</Link>
        </Button>
      </div>
    </section>

    <Footer />
  </div>
);

export default Landing;
