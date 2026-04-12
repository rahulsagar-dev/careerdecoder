# 🎯 Career Decode — AI-Powered Career Intelligence Platform

> Your personal AI career advisor that analyzes skills, recommends careers, simulates interviews, and builds actionable roadmaps — all in one platform.

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ecf8e)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61dafb)](https://react.dev)

---

## 📋 Summary

**Career Decode** is a full-stack AI career assistant that helps students and professionals navigate their career journey. It combines real-time market intelligence, personalized skill gap analysis, adaptive interview simulation, and recruiter-level career reports into a single cohesive platform — powered by Google Gemini AI.

---

## ✨ Features

### 🤖 AI Career Recommendations
- Analyzes your skills, education, and interests
- Suggests best-fit careers with match scores
- Identifies missing skills and provides gap details

### 📊 Skill Gap Analysis
- Compares your current skills against industry requirements
- Computes a readiness score with weighted skill distribution
- Prioritizes learning based on market demand

### 🗺️ Learning Roadmap
- Generates dependency-aware, step-by-step learning paths
- Tracks progress with completion toggles
- Suggests portfolio projects aligned with career goals

### 📄 Resume Intelligence
- Parses uploaded resumes (PDF/DOCX) using AI
- Scores resume against ATS standards
- Identifies strengths, weaknesses, and actionable suggestions

### 🐙 GitHub Portfolio Analysis
- Analyzes public repositories for code quality and diversity
- Scores portfolio across commit consistency, tech diversity, and documentation
- Provides AI-driven improvement recommendations

### 🎙️ Adaptive Interview Simulator
- Multi-round AI interviewer with HR, Technical, and Behavioral modes
- Adapts difficulty dynamically (Easy → Medium → Hard) based on answers
- Tracks topics, detects weak areas, and asks intelligent follow-ups
- 5-dimension evaluation: Clarity, Depth, Problem Solving, Communication, Confidence

### 📈 Market Intelligence
- Context-aware market analysis for your target role
- Skill demand scores, competition level, and role growth rate
- Strategic recommendations (what to learn, what to avoid)
- Market position score comparing your skills vs market demand

### 🧠 Career Path Graph
- Interactive node-based visualization using React Flow
- Skill → Career → Project dependency mapping
- Lock/unlock logic based on mastered skills
- Optimized path suggestions (fastest path, highest impact)

### 📑 Career Report
- Recruiter-level AI-generated career readiness report
- Aggregates all platform data (skills, resume, GitHub, market)
- 3-tier action plan: Short-term, Mid-term, Long-term
- Final readiness score with weighted formula
- PDF export with clean layout

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                 Frontend                     │
│  React 18 + TypeScript + Tailwind + ShadCN  │
│  React Router · React Query · Recharts      │
│  React Flow (@xyflow/react)                 │
└──────────────────┬──────────────────────────┘
                   │ API calls
┌──────────────────▼──────────────────────────┐
│              Supabase Backend                │
│  Auth · PostgreSQL · Storage · Edge Funcs   │
└──────────────────┬──────────────────────────┘
                   │ AI requests
┌──────────────────▼──────────────────────────┐
│         Lovable AI Gateway                   │
│       Google Gemini 3 Flash Preview          │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS 3, ShadCN UI |
| State | TanStack React Query |
| Routing | React Router v6 |
| Charts | Recharts |
| Graph | @xyflow/react (React Flow) |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| AI | Google Gemini via Lovable AI Gateway |
| Edge Functions | Deno (Supabase Edge Functions) |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── layout/          # Navbar, Footer, DashboardLayout, ProtectedRoute
│   └── ui/              # ShadCN UI components
├── context/             # AuthContext
├── pages/               # All page components
│   ├── Landing.tsx
│   ├── Dashboard.tsx
│   ├── CareerRecommendations.tsx
│   ├── SkillAnalysisPage.tsx
│   ├── LearningRoadmapPage.tsx
│   ├── ResumeAnalysisPage.tsx
│   ├── GitHubAnalysisPage.tsx
│   ├── InterviewSimulatorPage.tsx
│   ├── MarketIntelligencePage.tsx
│   ├── CareerPathPage.tsx
│   ├── CareerReportPage.tsx
│   └── ...
├── services/            # API service layers
├── routes/              # App routing config
└── integrations/        # Supabase client + types

supabase/
├── functions/           # Deno Edge Functions
│   ├── generate-career-recommendations/
│   ├── generate-skill-analysis/
│   ├── generate-learning-roadmap/
│   ├── generate-project-suggestions/
│   ├── parse-resume/
│   ├── score-resume/
│   ├── analyze-github-profile/
│   ├── interview-chat/
│   ├── evaluate-interview/
│   ├── generate-market-insights/
│   └── generate-career-report/
└── migrations/          # Database migrations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase project (or Lovable Cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/career-decode.git
cd career-decode

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Edge functions require `LOVABLE_API_KEY` set in Supabase secrets.

---

## 🔑 How It Works

1. **Sign Up & Profile Setup** — Enter your skills, education, interests, and career goals
2. **AI Analysis** — The platform runs multiple AI analyses across your profile
3. **Get Recommendations** — Receive personalized career matches with fit scores
4. **Identify Gaps** — See exactly which skills you need and their priority
5. **Follow Roadmap** — Step-by-step learning path with progress tracking
6. **Practice Interviews** — Simulate real interviews with adaptive AI
7. **Track Market** — Stay updated on market demand for your target role
8. **Export Report** — Generate a recruiter-level career readiness report

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with ❤️ using <a href="https://lovable.dev">Lovable</a></p>
