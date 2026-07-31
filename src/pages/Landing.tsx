import { Link } from "react-router-dom";
import { Brain, BarChart3, Map, FileText, Mic, UserPlus, Lightbulb, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReviewsMarquee from "@/components/ReviewsMarquee";
import HeroPreview from "@/components/landing/HeroPreview";
import PopularCareers from "@/components/landing/PopularCareers";
import BlogTeaser from "@/components/landing/BlogTeaser";
import { SEO } from "@/components/SEO";
import { careers } from "@/data/careers";

const features = [
  { icon: FileText, title: "Resume Intelligence", desc: "Upload your resume and get an ATS score, keyword gaps, and line-by-line fixes recruiters actually respond to." },
  { icon: BarChart3, title: "Skill Gap Analysis", desc: "See exactly which skills you're missing for your target role — and which ones you already have covered." },
  { icon: Map, title: "Learning Roadmaps", desc: "A step-by-step plan with courses, projects, and milestones, ordered so each step builds on the last." },
  { icon: Mic, title: "AI Mock Interviews", desc: "Practice role-specific interviews with an adaptive AI and get scored feedback on every answer." },
  { icon: Brain, title: "Career Recommendations", desc: "Get matched to roles that fit your actual skills, with salary ranges for the Indian market." },
];

const heroLinks = careers.slice(0, 3);

const steps = [
  { icon: UserPlus, num: "01", title: "Create Profile", desc: "Add your skills, experience, and target role — takes about 30 seconds." },
  { icon: Lightbulb, num: "02", title: "Get AI Insights", desc: "Resume score, skill gaps, and career matches generated from your real data." },
  { icon: Route, num: "03", title: "Follow Roadmap", desc: "Work through your personalized plan and track progress as you go." },
];

const Landing = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Career Decoder — AI Resume Score, Skill Gaps & Interview Prep"
      description="Get an ATS resume score, a personalized skill-gap report, a learning roadmap, and AI mock interviews. Free forever plan, built for the Indian job market."
      path="/"
    />
    <Navbar />
    <main>

    {/* Hero */}
    <section className="relative overflow-hidden py-10 md:py-24">
      <div className="container flex flex-col md:flex-row items-center gap-10 md:gap-12">
        <div className="flex-1 space-y-5 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Free forever plan · No credit card required
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Know exactly why you're{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">
              not getting interviews
            </span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
            Upload your resume and get an ATS score, your missing skills, a learning roadmap, and AI mock interviews — in under two minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90 transition-opacity text-base px-8" asChild>
              <Link to="/free/ats-score">Check your ATS score free — no signup</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8" asChild>
              <Link to="/signup">Create free account</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Popular right now:{" "}
            {heroLinks.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && <span className="text-muted-foreground/50"> · </span>}
                <Link to={`/careers/${c.slug}`} className="text-primary underline-offset-4 hover:underline">
                  {c.title}
                </Link>
              </span>
            ))}
          </p>
          <p className="text-xs text-muted-foreground">
            Built for the Indian job market · ₹ pricing · UPI &amp; cards accepted
          </p>
        </div>

        <div className="flex-1 flex justify-center w-full">
          <HeroPreview />
        </div>
      </div>
    </section>

    {/* Features — placed directly after hero so scanners see what the product does */}
    <section id="features" className="py-16 md:py-20 bg-muted/50">
      <div className="container space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-4xl font-bold">Everything you need to get hired</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Five AI tools that replace a career coach, a resume writer, and an interview prep course.</p>
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

    {/* Highest-intent second click — right after features, above the fold on scroll */}
    <PopularCareers />

    {/* How It Works */}
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-4xl font-bold">How it works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Three steps from "no callbacks" to a clear plan.</p>
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

    {/* Trust block — stats and social proof together */}
    <section className="border-y border-border/60 py-8">
      <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          { stat: "5", label: "AI-powered tools" },
          { stat: "6-step", label: "Learning roadmaps" },
          { stat: "ATS-ready", label: "Resume scoring" },
          { stat: "100%", label: "Free to start" },
        ].map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] bg-clip-text text-transparent">{s.stat}</div>
            <div className="text-xs md:text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
    <ReviewsMarquee />

    <BlogTeaser />


    {/* CTA */}
    <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-[hsl(260,84%,60%)]">
      <div className="container text-center space-y-6">
        <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">Start building your future today</h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto">Join professionals decoding their career paths with AI. Free forever plan, no card required.</p>
        <Button size="lg" variant="secondary" className="text-base px-8 font-semibold" asChild>
          <Link to="/signup">Create Free Account</Link>
        </Button>
      </div>
    </section>

    </main>
    <Footer />
  </div>
);

export default Landing;
