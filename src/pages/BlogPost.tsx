import { Link, useParams, Navigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FreeToolCta from "@/components/free/FreeToolCta";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { postBySlug, posts } from "@/data/blog";

const BlogPost = () => {
  const { slug = "" } = useParams();
  const post = postBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;

  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Career Decoder" },
    publisher: { "@type": "Organization", name: "Career Decoder" },
    mainEntityOfPage: `https://careerdecoder.work/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${post.title} | Career Decoder`}
        description={post.description}
        path={`/blog/${post.slug}`}
        jsonLd={jsonLd}
      />
      <Navbar />
      <main className="flex-1">
        <article className="py-12 md:py-16">
          <div className="container max-w-3xl">
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" /> All articles
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readMinutes} min read</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{post.description}</p>

            <FreeToolCta className="mb-8" />



            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>

            <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 to-[hsl(260,84%,60%)]/10 p-6 md:p-8 text-center">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Ready to put this into practice?</h3>
              <p className="text-muted-foreground mb-4">Career Decoder gives you the AI tools to act on what you just read — free forever plan.</p>
              <Button size="lg" className="bg-gradient-to-r from-primary to-[hsl(260,84%,60%)] hover:opacity-90" asChild>
                <Link to={post.cta.to}>{post.cta.label}</Link>
              </Button>
            </div>

            {related.length > 0 && (
              <div className="mt-16">
                <h3 className="text-lg font-semibold mb-4">Keep reading</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {related.map((r) => (
                    <Link key={r.slug} to={`/blog/${r.slug}`} className="group rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">{r.title}</h4>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        Read <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
