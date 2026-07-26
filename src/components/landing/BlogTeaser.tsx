import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { posts } from "@/data/blog";

const BlogTeaser = () => {
  const latest = [...posts]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  if (latest.length === 0) return null;

  return (
    <section className="py-16 bg-muted/50">
      <div className="container space-y-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">From the blog</h2>
            <p className="text-muted-foreground text-sm mt-1">Practical job-search guides written for the 2026 market.</p>
          </div>
          <Link to="/blog" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
            Read all posts <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {latest.map((p) => (
            <Link
              key={p.slug}
              to={`/blog/${p.slug}`}
              className="group rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all flex flex-col"
            >
              <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">{p.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={13} /> {p.readMinutes} min read
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogTeaser;
