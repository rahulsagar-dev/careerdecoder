# 🎯 Career Decode — AI-Powered Career Intelligence Platform

> Your personal AI career advisor that analyzes skills, recommends careers, simulates interviews, and builds actionable roadmaps — all in one platform.

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%203%20Flash-4285f4)](https://deepmind.google/technologies/gemini/)

---

## 📋 What is Career Decode?

**Career Decode** is a full-stack AI career intelligence platform that helps students and professionals navigate their career journey with data-driven insights. It combines real-time market intelligence, personalized skill gap analysis, adaptive interview simulation, and recruiter-level career reports into a single cohesive platform — powered by Google Gemini AI.

Whether you're a student figuring out your first role, a professional planning a career switch, or someone preparing for interviews — Career Decode gives you a structured, AI-guided path forward.

---

## ✨ Features

### 🤖 AI Career Recommendations
- Analyzes your skills, education, experience, and interests
- Generates 5–7 best-fit career matches with weighted match scores (0–100)
- Identifies missing skills and provides detailed gap analysis for each role
- Career details page with role description, salary insights, and growth trajectory

### 📊 Skill Gap Analysis
- Compares your current skills against industry requirements for target careers
- Computes a **readiness score** (0–100) based on weighted skill distribution
- **Missing Skills** — categorized by priority (High / Medium / Low) with impact weights
- **Current Skills** — validated against role requirements with match percentage
- **Skill Distribution** — visual breakdown by category (Technical, Soft, Domain, Tools)
- Synonym-aware skill matching (e.g., "Data Visualization" ↔ "Tableau", "Python" ↔ "py")

### 🗺️ Learning Roadmap
- Generates **dependency-aware**, step-by-step learning paths (6–12 steps)
- Each step includes: skill, resources, estimated time, and prerequisite dependencies
- Progress tracking with completion toggles and percentage indicators
- Kahn's algorithm-based topological sorting for logical learning progression
- Suggests portfolio projects aligned with your career goals

### 📄 Resume Intelligence
- Upload resumes in **PDF** or **DOCX** format
- AI-powered parsing extracts: skills, experience, education, projects, certifications
- **ATS Score** (0–100) based on keyword alignment, formatting, and content quality
- Strengths, weaknesses, and actionable improvement suggestions
- AI-generated rewrite suggestions for weak sections
- Resume history stored per user for comparison over time

### 🐙 GitHub Portfolio Analysis
- Analyzes public repositories via GitHub REST API
- Scores portfolio across:
  - **Commit Consistency** — frequency and cadence of commits
  - **Tech Diversity** — variety of languages and frameworks used
  - **Documentation Quality** — README presence, code comments, wiki usage
  - **Project Complexity** — lines of code, file structure, architecture patterns
- Overall **Portfolio Score** (0–100) with improvement recommendations

### 🎙️ Adaptive Interview Simulator
- **Multi-round AI interviewer** with three modes:
  - **HR Round** — behavioral questions, company fit, soft skills
  - **Technical Round** — coding concepts, system design, problem-solving
  - **Behavioral Round** — situational judgment, leadership, teamwork
- **Adaptive difficulty** — Easy → Medium → Hard based on answer quality
- Intelligent follow-ups based on previous responses
- 5-dimension evaluation: **Clarity**, **Depth**, **Problem Solving**, **Communication**, **Confidence**
- Session history with scores and performance trends

### 📈 Market Intelligence
- Real-time market analysis for your target role
- **Skill Demand Score** — how in-demand your skills are in the current market
- **Competition Level** — estimated competition for the role
- **Growth Rate** — projected growth trajectory for the career
- **Market Position Score** — compares your skills vs. market demand
- Strategic recommendations: what to learn, what to avoid, and emerging trends

### 🧠 Career Path Graph
- **Interactive node-based visualization** using React Flow (@xyflow/react)
- Visual mapping of: Skills → Careers → Projects → Learning Steps
- **Lock/unlock logic** — nodes unlock based on mastered skills
- **Path optimization** — fastest path and highest-impact path suggestions
- Career switching visualization showing transferable skills

### 📑 Career Readiness Report
- **Recruiter-level AI-generated report** aggregating all platform data
- 5-dimension assessment: **Skills**, **Experience**, **Projects**, **Market Fit**, **Interview Readiness**
- **3-tier Action Plan**:
  - Short-term (0–3 months) — quick wins and foundational skills
  - Mid-term (3–6 months) — core competency building
  - Long-term (6–12 months) — advanced specialization and portfolio growth
- **Final Readiness Score** (0–100) with weighted formula
- **PDF Export** with clean, professional layout

### 📊 Analytics Dashboard
- Track your career development progress over time
- Interview performance trends (line charts)
- Skill distribution pie charts
- Roadmap completion progress bars
- Aggregated stats: Readiness %, Roadmap %, Interview Count, Average Score

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 18)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │  Components │  │   Hooks & Services  │  │
│  │  (22 pages) │  │  (ShadCN UI)│  │  (React Query)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                    TypeScript + Tailwind CSS 3                │
└──────────────────────────┬────────────────────────────────────┘
                           │ HTTP / REST / Auth (JWT)
┌──────────────────────────▼────────────────────────────────────┐
│                    Supabase Backend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │ PostgreSQL  │  │   Storage Buckets   │  │
│  │  (GoTrue)   │  │  (12 tables)│  │  (resumes, assets)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Edge Functions (Deno Runtime)              │  │
│  │  11 AI-powered functions · JSON tool calling · Gemini   │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────────┘
                           │ Lovable AI Gateway
┌──────────────────────────▼────────────────────────────────────┐
│                   Google Gemini 3 Flash                       │
│              JSON-mode structured generation                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, Vite 5 | UI framework, type safety, fast builds |
| **Styling** | Tailwind CSS 3, ShadCN UI | Utility-first CSS, accessible components |
| **State** | TanStack React Query | Server state caching, synchronization |
| **Routing** | React Router v6 | Client-side routing, protected routes |
| **Charts** | Recharts | Responsive charts (Line, Bar, Pie, Donut) |
| **Graph** | @xyflow/react (React Flow) | Interactive node-based career path visualization |
| **Backend** | Supabase | Auth, PostgreSQL DB, Storage, Realtime |
| **AI** | Google Gemini 3 Flash via Lovable AI Gateway | Structured JSON generation for all features |
| **Edge Functions** | Deno (Supabase Edge Functions) | Serverless AI inference and data processing |
| **Testing** | Vitest, Playwright, Testing Library | Unit, E2E, and component testing |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── layout/              # Navbar, Footer, DashboardLayout, ProtectedRoute
│   └── ui/                  # ShadCN UI components (50+ accessible components)
├── context/                 # AuthContext — global auth state
├── hooks/                   # Custom React hooks
├── pages/                   # 22 page components (one per route)
│   ├── Landing.tsx          # Marketing landing page
│   ├── Login.tsx / Signup.tsx / ForgotPassword.tsx / ResetPassword.tsx
│   ├── ProfileSetup.tsx     # Mandatory 5-step onboarding wizard
│   ├── Dashboard.tsx        # Central hub with navigation cards
│   ├── CareerRecommendations.tsx
│   ├── CareerDetails.tsx
│   ├── SkillAnalysisPage.tsx
│   ├── LearningRoadmapPage.tsx
│   ├── ResumeAnalysisPage.tsx
│   ├── GitHubAnalysisPage.tsx
│   ├── InterviewSimulatorPage.tsx
│   ├── MarketIntelligencePage.tsx
│   ├── CareerPathPage.tsx
│   ├── CareerReportPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── Profile.tsx
│   └── NotFound.tsx
├── services/                # API service layers
│   ├── careerService.ts     # Career recommendations, skill analysis
│   ├── roadmapService.ts    # Learning roadmaps, progress tracking
│   ├── resumeService.ts     # Resume upload, parsing, scoring
│   ├── githubService.ts     # GitHub profile analysis
│   ├── interviewService.ts  # Interview simulation, evaluation
│   ├── marketService.ts     # Market intelligence insights
│   └── reportService.ts     # Career report generation
├── routes/
│   └── AppRoutes.tsx        # Route definitions with auth guards
├── integrations/
│   ├── supabase/client.ts   # Supabase client initialization
│   └── supabase/types.ts    # Database TypeScript types
├── lib/
│   └── utils.ts             # Utility functions (cn, etc.)
└── main.tsx / App.tsx         # Entry points

supabase/
├── functions/               # 11 Deno Edge Functions
│   ├── generate-career-recommendations/    # AI career matching
│   ├── generate-skill-analysis/            # Skill gap computation
│   ├── generate-learning-roadmap/          # Roadmap generation
│   ├── generate-project-suggestions/       # Portfolio project ideas
│   ├── parse-resume/                       # Resume text extraction
│   ├── score-resume/                       # ATS scoring + suggestions
│   ├── analyze-github-profile/              # GitHub repo analysis
│   ├── interview-chat/                    # Interview Q&A generation
│   ├── evaluate-interview/                # Interview scoring (5 dims)
│   ├── generate-market-insights/           # Market demand analysis
│   └── generate-career-report/              # Final report generation
├── migrations/              # Database schema migrations
└── config.toml              # Supabase project configuration
```

---

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User profile + onboarding data | `id` (PK), `skills` (JSONB), `education`, `interests`, `career_goals`, `experience_level` |
| `career_recommendations` | AI-generated career matches | `user_id`, `careers` (JSONB array with scores), `created_at` |
| `skill_analysis` | Skill gap analysis results | `user_id`, `target_career`, `readiness_score`, `missing_skills`, `current_skills`, `skill_distribution` |
| `learning_roadmaps` | Generated learning paths | `user_id`, `career`, `steps` (JSONB), `progress`, `completed_steps`, `total_steps` |
| `roadmap_steps` | Individual step tracking | `roadmap_id`, `step_index`, `skill`, `completed`, `completed_at` |
| `resume_analysis` | Parsed resume + scores | `user_id`, `file_path`, `parsed_data` (JSONB), `ats_score`, `strengths`, `weaknesses`, `suggestions` |
| `github_analysis` | GitHub portfolio scores | `user_id`, `username`, `repos` (JSONB), `portfolio_score`, `metrics` (JSONB) |
| `interview_sessions` | Interview session records | `user_id`, `mode`, `difficulty`, `score`, `evaluation` (JSONB), `messages` (JSONB) |
| `interview_messages` | Per-message interview log | `session_id`, `role`, `content`, `topic`, `created_at` |
| `market_data` | Market intelligence cache | `user_id`, `target_role`, `insights` (JSONB), `demand_score`, `competition_level` |
| `project_suggestions` | AI project recommendations | `user_id`, `career`, `projects` (JSONB array with difficulty tiers) |
| `repo_analysis` | Per-repository analysis data | `github_analysis_id`, `repo_name`, `metrics` (JSONB) |

### Security
- **Row Level Security (RLS)** enabled on all user-centric tables
- Policies scoped to `auth.uid()` — users can only access their own data
- Edge functions use `service_role` key for administrative operations

---

## 🔌 Edge Functions (API)

| Function | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `generate-career-recommendations` | `POST` | Generate career matches | `{ skills, education, interests, experience }` | `{ careers: [...] }` |
| `generate-skill-analysis` | `POST` | Analyze skill gaps | `{ user_id, target_career }` | `{ readiness_score, missing_skills, current_skills }` |
| `generate-learning-roadmap` | `POST` | Create learning path | `{ user_id, career, target_skills }` | `{ steps: [...], progress }` |
| `generate-project-suggestions` | `POST` | Suggest portfolio projects | `{ user_id, career }` | `{ projects: [...] }` |
| `parse-resume` | `POST` | Extract resume content | `{ file_path }` (from storage) | `{ parsed_data: {...} }` |
| `score-resume` | `POST` | ATS scoring + feedback | `{ parsed_data }` | `{ ats_score, strengths, weaknesses, suggestions }` |
| `analyze-github-profile` | `POST` | Analyze GitHub repos | `{ username }` | `{ portfolio_score, repos, metrics }` |
| `interview-chat` | `POST` | Generate interview Q&A | `{ session_id, mode, difficulty, history }` | `{ question, topic, follow_up }` |
| `evaluate-interview` | `POST` | Score interview session | `{ session_id, messages }` | `{ score, clarity, depth, problem_solving, communication, confidence }` |
| `generate-market-insights` | `POST` | Market analysis | `{ target_role, skills }` | `{ demand_score, competition, growth_rate, recommendations }` |
| `generate-career-report` | `POST` | Generate final report | `{ user_id }` | `{ report: {...}, readiness_score, action_plan }` |

All functions use **Google Gemini 3 Flash** via the Lovable AI Gateway with **JSON-mode structured generation** for consistent, parseable outputs.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (recommended: 20 LTS)
- **npm** or **bun** (bun recommended for faster installs)
- A **Supabase** project (free tier works)
- A **Lovable** account (for AI Gateway access)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/career-decode.git
cd career-decode

# Install dependencies
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080` (or the port shown in your terminal).

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Edge Functions Secrets** (set in Supabase Dashboard → Project Settings → Secrets):
- `LOVABLE_API_KEY` — Your Lovable AI Gateway key (required for all AI functions)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for edge functions

### Supabase Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Link your project**:
   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   ```
3. **Run migrations** to create tables:
   ```bash
   npx supabase db push
   ```
4. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy
   ```
5. **Create Storage Bucket** `resumes` for resume uploads (public: false)
6. **Set RLS policies** for all tables (see migrations for examples)

---

## 🔑 How It Works (User Flow)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Sign Up   │────▶│ Profile     │────▶│  AI Analysis    │
│  (Email/    │     │ Setup       │     │  Pipeline       │
│   Social)   │     │ (5 Steps)   │     │                 │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                  │
                       ┌──────────────────────────┼──────────────────────────┐
                       ▼                          ▼                          ▼
              ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
              │  Career     │            │  Skill Gap  │            │  Resume     │
              │Recommendations            │  Analysis   │            │  Parse      │
              └──────┬──────┘            └──────┬──────┘            └──────┬──────┘
                     │                          │                          │
                     ▼                          ▼                          ▼
              ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
              │  Career     │            │  Learning   │            │  GitHub     │
              │  Details    │            │  Roadmap    │            │  Analysis   │
              └─────────────┘            └──────┬──────┘            └─────────────┘
                                                │
                       ┌────────────────────────┼────────────────────────┐
                       ▼                        ▼                        ▼
              ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
              │  Interview  │          │  Market     │          │  Career     │
              │  Simulator  │          │ Intelligence│          │  Path Graph │
              └─────────────┘          └─────────────┘          └──────┬──────┘
                                                                      │
                                                                      ▼
                                                               ┌─────────────┐
                                                               │  Career     │
                                                               │  Report     │
                                                               │  (PDF Exp)  │
                                                               └─────────────┘
```

**Step-by-step:**
1. **Sign Up** — Create account with email/password or social login
2. **Profile Setup** — Complete 5-step wizard: Basic Info → Education → Skills → Experience → Goals
3. **AI Analysis** — Platform runs parallel AI analyses across your profile
4. **Get Recommendations** — Receive personalized career matches with fit scores
5. **Identify Gaps** — See exactly which skills you need and their priority
6. **Follow Roadmap** — Step-by-step learning path with progress tracking
7. **Practice Interviews** — Simulate real interviews with adaptive AI
8. **Track Market** — Stay updated on market demand for your target role
9. **Visualize Path** — Explore interactive career path graphs
10. **Export Report** — Generate a recruiter-level career readiness PDF report

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests (Playwright)
npx playwright test
```

---

## 📸 Screenshots

> *Screenshots to be added. The platform includes:*
> - Dashboard with navigation cards
> - Career recommendation cards with match scores
> - Skill gap analysis with priority-tiered missing skills
> - Interactive learning roadmap with progress tracking
> - Resume upload + ATS scoring interface
> - GitHub portfolio analysis dashboard
> - Interview simulator chat interface
> - Market intelligence charts
> - Career path graph visualization
> - Analytics dashboard with Recharts
> - Career report PDF export

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow **TypeScript** strict mode
- Use **Tailwind CSS** utilities (no custom CSS)
- Use **ShadCN UI** components where possible
- Add **tests** for new features
- Ensure **RLS policies** are updated for new tables
- Document new **Edge Functions** in this README

---

## 🔒 Security

- **JWT Authentication** via Supabase Auth
- **Row Level Security (RLS)** on all user tables
- **No sensitive data** stored in client-side storage (localStorage only stores auth tokens)
- **Server-side AI processing** — no AI keys exposed to frontend
- **Secure file uploads** — resumes stored in private Supabase Storage buckets
- **Input validation** with Zod schemas on all forms
- **Rate limiting** on Edge Functions via Supabase

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) — AI-powered full-stack development
- Powered by [Supabase](https://supabase.com) — Open-source Firebase alternative
- AI by [Google Gemini](https://deepmind.google/technologies/gemini/) — Multimodal AI model
- UI by [ShadCN UI](https://ui.shadcn.com) — Beautiful, accessible React components

---

<p align="center">
  Built with ❤️ using <a href="https://lovable.dev">Lovable</a> + <a href="https://supabase.com">Supabase</a> + <a href="https://deepmind.google/technologies/gemini/">Gemini AI</a>
</p>
