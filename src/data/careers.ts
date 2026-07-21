export interface CareerData {
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
  avgSalaryIN: string;
  avgSalaryUS: string;
  growth: string;
  topSkills: string[];
  dailyTasks: string[];
  entryPath: string[];
  tools: string[];
  relatedRoles: string[];
}

export const careers: CareerData[] = [
  {
    slug: "data-analyst",
    title: "Data Analyst",
    shortDescription: "Turn raw data into decisions with SQL, Python, and visualization tools.",
    overview:
      "Data Analysts are the connective tissue between raw business data and the humans who need to make decisions with it. In 2026, the role blends SQL fluency, business intuition, and increasingly, comfort with the modern data stack (dbt, BigQuery/Snowflake, Looker/Tableau).",
    avgSalaryIN: "₹6L – ₹18L",
    avgSalaryUS: "$70k – $115k",
    growth: "23% projected growth (2024–2030)",
    topSkills: ["SQL (advanced)", "Python (pandas)", "Statistics", "Data visualization", "dbt", "Cloud warehouses"],
    dailyTasks: [
      "Write ad-hoc SQL for stakeholders",
      "Build and maintain dashboards",
      "Design A/B tests and interpret results",
      "Model data in dbt",
      "Present findings to non-technical audiences",
    ],
    entryPath: [
      "Learn SQL to an advanced level (window functions, CTEs)",
      "Pick up Python with pandas",
      "Build 3 portfolio projects on real datasets",
      "Learn one BI tool deeply (Tableau or Looker)",
      "Learn statistics fundamentals and A/B testing",
    ],
    tools: ["PostgreSQL", "BigQuery", "Snowflake", "Tableau", "Looker", "dbt", "Python", "Excel"],
    relatedRoles: ["Business Analyst", "Data Scientist", "Analytics Engineer", "Product Analyst"],
  },
  {
    slug: "software-engineer",
    title: "Software Engineer",
    shortDescription: "Design, build, and ship software systems used by real users at scale.",
    overview:
      "Software Engineer remains the highest-volume tech role in 2026. The bar has risen — pure coding is table stakes; system design, code review, and product judgment separate juniors from mid-level hires.",
    avgSalaryIN: "₹8L – ₹35L",
    avgSalaryUS: "$95k – $180k",
    growth: "22% projected growth (2024–2030)",
    topSkills: ["Data structures & algorithms", "System design", "One backend language", "Git & CI/CD", "Databases", "Testing"],
    dailyTasks: [
      "Design and implement features",
      "Review teammates' pull requests",
      "Debug production incidents",
      "Refactor legacy code",
      "Participate in system design discussions",
    ],
    entryPath: [
      "Master one language deeply (Python, Go, or TypeScript)",
      "Solve 150+ DSA problems",
      "Ship 2 full-stack projects to production",
      "Learn Git, testing, and CI fundamentals",
      "Study one system design book (Designing Data-Intensive Applications)",
    ],
    tools: ["VS Code", "Git", "Docker", "Kubernetes", "PostgreSQL", "Redis", "AWS/GCP"],
    relatedRoles: ["Backend Engineer", "Frontend Engineer", "Full-Stack Engineer", "DevOps Engineer"],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    shortDescription: "Own the 'what' and 'why' of a product — from research to launch to iteration.",
    overview:
      "Product Managers in 2026 are expected to be equal parts strategist, communicator, and data analyst. AI-native products have raised the bar on prototyping speed — PMs who can ship a working demo themselves have a significant edge.",
    avgSalaryIN: "₹15L – ₹45L",
    avgSalaryUS: "$110k – $200k",
    growth: "19% projected growth (2024–2030)",
    topSkills: ["User research", "Data analysis (SQL)", "Prioritization frameworks", "Writing PRDs", "Roadmapping", "Stakeholder communication"],
    dailyTasks: [
      "Interview users and synthesize insights",
      "Write PRDs and specs",
      "Prioritize the backlog with engineering",
      "Analyze product metrics",
      "Align stakeholders on roadmap",
    ],
    entryPath: [
      "Build depth in one domain (e.g. fintech, dev tools)",
      "Learn SQL for product analytics",
      "Ship a side project end-to-end",
      "Practice writing PRDs — 5 real ones",
      "Study frameworks: Jobs-to-be-Done, RICE, North Star",
    ],
    tools: ["Notion", "Linear", "Figma", "Amplitude", "Mixpanel", "SQL"],
    relatedRoles: ["Growth PM", "Technical PM", "Product Marketing", "Program Manager"],
  },
  {
    slug: "ux-designer",
    title: "UX Designer",
    shortDescription: "Design the interfaces and flows that make products actually usable.",
    overview:
      "UX Designers in 2026 combine visual design chops with research rigor. Companies increasingly expect designers to own prototypes end-to-end, not just deliver static Figma files.",
    avgSalaryIN: "₹6L – ₹22L",
    avgSalaryUS: "$85k – $140k",
    growth: "13% projected growth (2024–2030)",
    topSkills: ["Figma", "Interaction design", "User research", "Prototyping", "Design systems", "Accessibility"],
    dailyTasks: [
      "Design new feature flows",
      "Run usability tests",
      "Maintain the design system",
      "Collaborate with engineers on implementation",
      "Present designs to stakeholders",
    ],
    entryPath: [
      "Master Figma deeply",
      "Build a 5-project case-study portfolio",
      "Learn one design system methodology",
      "Study accessibility (WCAG 2.2)",
      "Practice user interviews",
    ],
    tools: ["Figma", "FigJam", "Maze", "Notion", "ProtoPie"],
    relatedRoles: ["UI Designer", "Product Designer", "UX Researcher", "Design Systems Engineer"],
  },
  {
    slug: "data-scientist",
    title: "Data Scientist",
    shortDescription: "Apply statistics and ML to answer product and business questions.",
    overview:
      "Data Scientist in 2026 has bifurcated: 'analytics DS' (closer to analyst + experimentation) and 'ML DS' (closer to ML engineer). Know which flavor you want before applying.",
    avgSalaryIN: "₹10L – ₹30L",
    avgSalaryUS: "$105k – $170k",
    growth: "35% projected growth (2024–2030)",
    topSkills: ["Python", "Statistics", "SQL", "Machine learning", "Experimentation", "Communication"],
    dailyTasks: [
      "Design and analyze experiments",
      "Build predictive models",
      "Deep-dive into ambiguous business questions",
      "Communicate results to leadership",
      "Maintain feature pipelines",
    ],
    entryPath: [
      "Master statistics and probability",
      "Learn Python (pandas, scikit-learn)",
      "Build 3 ML projects with real deployment",
      "Study experimentation deeply",
      "Learn one deep learning framework (PyTorch)",
    ],
    tools: ["Python", "SQL", "PyTorch", "scikit-learn", "Jupyter", "MLflow"],
    relatedRoles: ["ML Engineer", "Applied Scientist", "Analytics Engineer", "Research Scientist"],
  },
  {
    slug: "devops-engineer",
    title: "DevOps Engineer",
    shortDescription: "Build the infrastructure and pipelines that let product teams ship safely.",
    overview:
      "DevOps in 2026 is really Platform Engineering — internal developer platforms, GitOps, observability, and cost control. The role rewards depth in one cloud and breadth across the deployment lifecycle.",
    avgSalaryIN: "₹10L – ₹30L",
    avgSalaryUS: "$100k – $170k",
    growth: "21% projected growth (2024–2030)",
    topSkills: ["Linux", "Kubernetes", "Terraform", "CI/CD", "One major cloud (AWS/GCP/Azure)", "Observability"],
    dailyTasks: [
      "Maintain CI/CD pipelines",
      "Write infrastructure-as-code",
      "Respond to production incidents",
      "Optimize cloud costs",
      "Build internal developer tools",
    ],
    entryPath: [
      "Master Linux and networking basics",
      "Get one cloud certification (AWS SAA is the common start)",
      "Learn Terraform and Kubernetes",
      "Build a personal home lab / project cluster",
      "Study SRE principles (Google SRE book)",
    ],
    tools: ["AWS", "Kubernetes", "Terraform", "GitHub Actions", "Datadog", "Grafana"],
    relatedRoles: ["Site Reliability Engineer", "Platform Engineer", "Cloud Engineer", "Security Engineer"],
  },
  {
    slug: "frontend-engineer",
    title: "Frontend Engineer",
    shortDescription: "Build the user interfaces people actually touch, click, and complain about.",
    overview:
      "Frontend in 2026 is more specialized than ever — React remains dominant, but the depth expected (performance, accessibility, animation, state management) has grown significantly.",
    avgSalaryIN: "₹6L – ₹28L",
    avgSalaryUS: "$85k – $155k",
    growth: "17% projected growth (2024–2030)",
    topSkills: ["React", "TypeScript", "CSS", "Web performance", "Accessibility", "Testing"],
    dailyTasks: [
      "Build UI components",
      "Debug cross-browser issues",
      "Optimize bundle size and Core Web Vitals",
      "Collaborate with designers",
      "Write component tests",
    ],
    entryPath: [
      "Master HTML, CSS, and JavaScript fundamentals first",
      "Learn React deeply (hooks, patterns, rendering)",
      "Add TypeScript",
      "Build 3 production-quality projects",
      "Study Web Vitals and accessibility",
    ],
    tools: ["React", "Next.js", "TypeScript", "Vite", "Tailwind", "Playwright"],
    relatedRoles: ["Full-Stack Engineer", "UI Engineer", "Design Engineer", "Mobile Engineer"],
  },
  {
    slug: "ml-engineer",
    title: "Machine Learning Engineer",
    shortDescription: "Take ML models from a notebook to reliable, scalable production systems.",
    overview:
      "ML Engineer sits at the intersection of software engineering and applied ML. In 2026, LLM ops (evals, fine-tuning, RAG pipelines) has become as important as classical ML deployment.",
    avgSalaryIN: "₹14L – ₹45L",
    avgSalaryUS: "$120k – $220k",
    growth: "40% projected growth (2024–2030)",
    topSkills: ["Python", "PyTorch/TensorFlow", "MLOps", "System design", "SQL", "LLM tooling"],
    dailyTasks: [
      "Deploy and monitor models",
      "Build data and feature pipelines",
      "Optimize inference latency and cost",
      "Run offline and online evaluations",
      "Collaborate with data scientists on productionization",
    ],
    entryPath: [
      "Be a strong software engineer first",
      "Learn PyTorch and one deployment stack",
      "Ship a model to production end-to-end",
      "Learn MLOps (MLflow, Ray, Kubeflow)",
      "Study LLM engineering (evals, RAG, fine-tuning)",
    ],
    tools: ["Python", "PyTorch", "Ray", "MLflow", "Kubernetes", "vLLM"],
    relatedRoles: ["Data Scientist", "Applied Scientist", "AI Engineer", "Backend Engineer"],
  },
];

export const careerBySlug = (slug: string) => careers.find((c) => c.slug === slug);
