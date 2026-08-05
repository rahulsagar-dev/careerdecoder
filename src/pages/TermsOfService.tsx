import { Link } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms", body: "By creating an account or using Career Decoder, you agree to these Terms of Service. If you do not agree, do not use the service." },
  { id: "description", title: "2. Description of Service", body: "Career Decoder provides AI-powered career guidance including recommendations, skill gap analysis, learning roadmaps, resume analysis, and mock interviews. Output is informational and not professional advice." },
  { id: "accounts", title: "3. User Accounts and Registration", body: "You must provide accurate registration information and keep your credentials secure. You are responsible for all activity under your account." },
  { id: "acceptable-use", title: "4. Acceptable Use Policy", body: "You agree not to: misuse the service, attempt to access other users' data, reverse-engineer the AI systems, submit illegal or infringing content, or use the platform to generate harmful or deceptive material." },
  { id: "ip", title: "5. Intellectual Property", body: "The Career Decoder brand, software, and AI outputs are owned by us or our licensors. You may use generated content for personal career purposes." },
  { id: "user-content", title: "6. User Content", body: "You retain ownership of content you submit (resume, profile, project data). You grant us a limited license to process it solely to provide the service." },
  { id: "liability", title: "7. Limitation of Liability", body: "To the maximum extent permitted by law, Career Decoder is not liable for indirect, incidental, or consequential damages, including lost opportunities or income." },
  { id: "warranties", title: "8. Disclaimer of Warranties", body: "The service is provided \"as is\" without warranties of any kind. AI outputs may be inaccurate or incomplete and should not be the sole basis for career decisions." },
  { id: "termination", title: "9. Termination", body: "We may suspend or terminate accounts that violate these terms. You can delete your account at any time from your profile settings." },
  { id: "governing-law", title: "10. Governing Law and Dispute Resolution", body: "These terms are governed by the laws of the jurisdiction in which Career Decoder operates. Disputes will be resolved through binding arbitration where permitted." },
  { id: "changes", title: "11. Changes to Terms", body: "We may update these terms. Material changes will be announced in-app, and continued use after changes constitutes acceptance." },
  { id: "contact", title: "12. Contact Information", body: "Questions about these terms? Email support@careerdecode.app or visit the Support page." },
];

const TermsOfService = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <SEO title="Terms of Service — Career Decoder" description="The terms governing your use of Career Decoder's AI-powered career guidance platform." path="/terms-of-service" />
    <main className="container max-w-3xl py-10 flex-1">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
      </Button>

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
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

export default TermsOfService;
