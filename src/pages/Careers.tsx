import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { careers } from "@/data/careers";

const Careers = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Career Guides — Salaries, Skills & Roadmaps | Career Decoder"
      description="Explore in-depth guides for the top tech careers in 2026 — salary ranges, required skills, day-to-day tasks, and how to break in."
      path="/careers"
    />
    <Navbar />
    <main className="flex-1">
      <section className="py-16 md:py-20 border-b">
        <div className="container max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Career Guides</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Salary ranges, required skills, and a step-by-step path into the tech roles hiring in 2026.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container max-w-5xl grid md:grid-cols-2 gap-4">
          {careers.map((c) => (
            <Link
              key={c.slug}
              to={`/careers/${c.slug}`}
              className="group rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">{c.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">{c.shortDescription}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <TrendingUp className="h-3 w-3 text-primary" /> {c.growth}
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Read guide <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Careers;
