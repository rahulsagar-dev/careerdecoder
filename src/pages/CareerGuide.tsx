import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, TrendingUp, IndianRupee, DollarSign, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { careerBySlug, careers } from "@/data/careers";

const CareerGuide = () => {
  const { slug = "" } = useParams();
  const career = careerBySlug(slug);

  if (!career) return <Navigate to="/careers" replace />;

  const related = careers.filter((c) => c.slug !== career.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${career.title} Career Guide 2026`,
    description: career.shortDescription,
    mainEntityOfPage: `https://careerdecoder.work/careers/${career.slug}`,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${career.title} Career Guide 2026 — Salary, Skills & Roadmap`}
        description={`${career.shortDescription} Salaries, top skills, day-to-day tasks, and a step-by-step path to become a ${career.title.toLowerCase()} in 2026.`}
        path={`/careers/${career.slug}`}
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-16 border-b">
          <div className="container max-w-4xl">
            <Link to="/careers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> All career guides
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              How to become a {career.title} in 2026
            </h1>
            <p className="text-lg text-muted-foreground mb-6">{career.overview}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><IndianRupee className="h-3 w-3" /> India (avg)</div>
                <div className="font-semibold">{career.avgSalaryIN}</div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><DollarSign className="h-3 w-3" /> US (avg)</div>
                <div className="font-semibold">{career.avgSalaryUS}</div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingUp className="h-3 w-3" /> Growth</div>
                <div className="font-semibold">{career.growth}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-4xl grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Top skills</h2>
              <ul className="space-y-2">
                {career.topSkills.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">A typical day</h2>
              <ul className="space-y-2">
                {career.dailyTasks.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">How to break in</h2>
            <ol className="space-y-3">
              {career.entryPath.map((step, i) => (
                <li key={step} className="flex gap-4 rounded-xl border bg-card p-4">
                  <span className="flex-none w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(260,84%,60%)] text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm md:text-base pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-8">
          <div className="container max-w-4xl grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Tools you'll use</h2>
              <div className="flex flex-wrap gap-2">
                {career.tools.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Related roles</h2>
              <div className="flex flex-wrap gap-2">
                {career.relatedRoles.map((r) => (
                  <span key={r} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-4xl">
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-[hsl(260,84%,60%)]/10 p-6 md:p-10 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Get a personalized roadmap to become a {career.title}</h3>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Career Decoder analyzes your current skills against real {career.title.toLowerCase()} job requirements and builds a step-by-step learning plan just for you — free.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90" asChild>
                  <Link to="/signup">Get my roadmap free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/skill-gap">Run skill gap analysis</Link>
                </Button>
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-14">
                <h3 className="text-lg font-semibold mb-4">Explore related careers</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {related.map((r) => (
                    <Link key={r.slug} to={`/careers/${r.slug}`} className="group rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">{r.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.shortDescription}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        Read <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CareerGuide;
