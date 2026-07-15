import { Link } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";

const SECTIONS = [
  { id: "introduction", title: "1. Introduction", body: "Career Decode (\"we\", \"us\") operates an AI-powered career guidance platform. This Privacy Policy explains what data we collect, how we use it, and the choices you have." },
  { id: "information-we-collect", title: "2. Information We Collect", body: "We collect account information (name, email), profile information you submit (skills, experience, goals), uploaded files such as resumes, usage data (pages visited, features used), and technical data (browser, device, IP)." },
  { id: "how-we-use", title: "3. How We Use Your Information", body: "To provide and personalize the service, generate AI recommendations, communicate updates and security notices, prevent abuse, and improve the product." },
  { id: "data-sharing", title: "4. Data Sharing and Third Parties", body: "We share data only with service providers needed to run the product: Supabase (authentication, database, storage), our AI Gateway (model inference for recommendations), and analytics tools you have opted into. We never sell your personal data." },
  { id: "data-retention", title: "5. Data Retention", body: "We retain your information as long as your account is active. You can request deletion at any time; backups are purged on a rolling schedule." },
  { id: "your-rights", title: "6. Your Rights", body: "Depending on your jurisdiction (e.g., GDPR, CCPA), you have rights to access, correct, delete, export, or restrict processing of your personal data. Contact us to exercise these rights." },
  { id: "security", title: "7. Security Measures", body: "We use encryption in transit (TLS), authenticated row-level security on the database, signed storage URLs, and least-privilege access controls for our team. No system is 100% secure." },
  { id: "children", title: "8. Children's Privacy", body: "Career Decode is not directed to children under 16, and we do not knowingly collect personal data from them. If you believe we have, contact us so we can delete it." },
  { id: "changes", title: "9. Changes to This Policy", body: "We may update this policy as the product evolves. We will post the new version here and update the \"Last Updated\" date." },
  { id: "contact", title: "10. Contact Information", body: "Questions about privacy? Email support@careerdecode.app or visit the Support page." },
];

const PrivacyPolicy = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SEO title="Privacy Policy — Career Decode" description="How Career Decode collects, uses, and protects your personal data." path="/privacy-policy" />
    <main className="container max-w-3xl py-10 flex-1">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
      </Button>

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Last Updated: June 28, 2026</p>

      <nav aria-label="Table of contents" className="rounded-lg border bg-muted/40 p-4 mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contents</p>
        <ul className="space-y-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-sm text-primary hover:underline">{s.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <article className="prose prose-sm max-w-none space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </section>
        ))}
      </article>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
