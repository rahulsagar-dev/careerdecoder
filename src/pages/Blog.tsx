import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { posts } from "@/data/blog";

const Blog = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Career Decoder Blog",
    url: "https://careerdecoder.work/blog",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `https://careerdecoder.work/blog/${p.slug}`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Career Decoder Blog — Career, Resume & Interview Guides"
        description="Actionable guides on resumes, ATS scoring, skill gaps, interview prep, and career switching — written for 2026 job seekers."
        path="/blog"
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-20 border-b">
          <div className="container max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">The Career Decoder Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Practical, data-backed guides on landing your next role — from ATS scoring to AI interview prep.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container max-w-4xl space-y-4">
            {posts.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="group block rounded-2xl border bg-card p-6 md:p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(p.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readMinutes} min read</span>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">{p.title}</h2>
                <p className="text-muted-foreground mb-4">{p.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
