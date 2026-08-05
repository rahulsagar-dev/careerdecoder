import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import FreeResumeTool from "@/components/free/FreeResumeTool";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free Resume Insights",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://careerdecoder.work/free/resume-insights",
  description:
    "Upload your resume and instantly see the skills it shows, your experience level, and the roles you match best. No signup required.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

const FreeResumeInsights = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Free Resume Insights Tool | Career Decoder"
      description="Upload your resume and see the skills recruiters actually read, your experience level, and your top matching roles. Free, no account needed."
      path="/free/resume-insights"
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
              What does your resume actually say about you?
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Upload your resume and see it the way a recruiter's software does — the skills it
              picks up, the experience level it reads, and the roles you're closest to landing.
            </p>
          </div>

          <FreeResumeTool variant="insights" />

          <div className="max-w-2xl mx-auto space-y-4 pt-8">
            <h2 className="text-xl font-bold">Why this is different from a resume template</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A template fixes how your resume looks. This tells you what it communicates. If the
              skills listed here aren't the ones you want to be hired for, your resume is selling
              the wrong story — and no amount of formatting will fix that.
            </p>
            <p className="text-sm text-muted-foreground">
              Also worth checking:{" "}
              <Link to="/free/ats-score" className="text-primary underline-offset-4 hover:underline">
                your free ATS score
              </Link>{" "}
              and{" "}
              <Link to="/careers" className="text-primary underline-offset-4 hover:underline">
                the career guides
              </Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default FreeResumeInsights;
