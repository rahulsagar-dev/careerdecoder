import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import FreeResumeTool from "@/components/free/FreeResumeTool";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free ATS Resume Score Checker",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://careerdecoder.work/free/ats-score",
  description:
    "Upload your resume and get a free ATS score with formatting, keyword and impact breakdowns. No signup required.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

const FreeAtsScore = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Free ATS Resume Score Checker — No Signup | Career Decoder"
      description="Check how your resume scores against applicant tracking systems. Instant ATS score, formatting and keyword breakdown, plus fixes. Free, no account needed."
      path="/free/ats-score"
      jsonLd={jsonLd}
    />
    <Navbar />
    <main className="flex-1">
      <section className="py-10 md:py-16">
        <div className="container space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Free · No signup · Results in ~20 seconds
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Free ATS resume score checker
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Most resumes are rejected by software before a human ever reads them. Upload yours and
              see exactly how an applicant tracking system scores it — formatting, keywords, and impact.
            </p>
          </div>

          <FreeResumeTool variant="ats" />

          <div className="max-w-2xl mx-auto space-y-4 pt-8">
            <h2 className="text-xl font-bold">What the ATS score means</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your score combines three things: whether an ATS can cleanly parse your layout,
              how well your wording matches the keywords recruiters filter on, and whether your
              bullet points show measurable impact instead of job descriptions. Anything under 60
              usually means your resume is being filtered out before a recruiter opens it.
            </p>
            <p className="text-sm text-muted-foreground">
              Want the deeper version?{" "}
              <Link to="/free/resume-insights" className="text-primary underline-offset-4 hover:underline">
                Get free resume insights
              </Link>{" "}
              or{" "}
              <Link to="/blog/how-ats-scoring-works" className="text-primary underline-offset-4 hover:underline">
                read how ATS scoring works
              </Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default FreeAtsScore;
