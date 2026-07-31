import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Landing from "@/pages/Landing";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Everything except the landing page is code-split so first paint on `/`
// doesn't have to download the dashboard, charts, graph and admin bundles.
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ProfileSetup = lazy(() => import("@/pages/ProfileSetup"));
const Profile = lazy(() => import("@/pages/Profile"));
const CareerRecommendations = lazy(() => import("@/pages/CareerRecommendations"));
const CareerDetails = lazy(() => import("@/pages/CareerDetails"));
const SkillAnalysisPage = lazy(() => import("@/pages/SkillAnalysisPage"));
const LearningRoadmapPage = lazy(() => import("@/pages/LearningRoadmapPage"));
const ResumeAnalysisPage = lazy(() => import("@/pages/ResumeAnalysisPage"));
const GitHubAnalysisPage = lazy(() => import("@/pages/GitHubAnalysisPage"));
const LinkedInAnalysisPage = lazy(() => import("@/pages/LinkedInAnalysisPage"));
const InterviewSimulatorPage = lazy(() => import("@/pages/InterviewSimulatorPage"));
const MarketIntelligencePage = lazy(() => import("@/pages/MarketIntelligencePage"));
const CareerPathPage = lazy(() => import("@/pages/CareerPathPage"));
const CareerReportPage = lazy(() => import("@/pages/CareerReportPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const Support = lazy(() => import("@/pages/Support"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Billing = lazy(() => import("@/pages/Billing"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const LeaveReview = lazy(() => import("@/pages/LeaveReview"));
const AdminReviews = lazy(() => import("@/pages/AdminReviews"));
const AdminInbox = lazy(() => import("@/pages/AdminInbox"));
const AdminPromoCodes = lazy(() => import("@/pages/AdminPromoCodes"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Careers = lazy(() => import("@/pages/Careers"));
const CareerGuide = lazy(() => import("@/pages/CareerGuide"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const FreeAtsScore = lazy(() => import("@/pages/FreeAtsScore"));
const FreeResumeInsights = lazy(() => import("@/pages/FreeResumeInsights"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/support" element={<Support />} />
      <Route path="/help" element={<Support />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/careers/:slug" element={<CareerGuide />} />
      <Route path="/free/ats-score" element={<FreeAtsScore />} />
      <Route path="/free/resume-insights" element={<FreeResumeInsights />} />
      <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      <Route path="/profile/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/career-recommendations" element={<ProtectedRoute><CareerRecommendations /></ProtectedRoute>} />
      <Route path="/career-details/:id" element={<ProtectedRoute><CareerDetails /></ProtectedRoute>} />
      <Route path="/skill-analysis" element={<ProtectedRoute><SkillAnalysisPage /></ProtectedRoute>} />
      <Route path="/skill-gap" element={<ProtectedRoute><SkillAnalysisPage /></ProtectedRoute>} />
      <Route path="/learning-roadmap" element={<ProtectedRoute><LearningRoadmapPage /></ProtectedRoute>} />
      <Route path="/resume-analysis" element={<ProtectedRoute><ResumeAnalysisPage /></ProtectedRoute>} />
      <Route path="/github-analysis" element={<ProtectedRoute><GitHubAnalysisPage /></ProtectedRoute>} />
      <Route path="/linkedin-analysis" element={<ProtectedRoute><LinkedInAnalysisPage /></ProtectedRoute>} />
      <Route path="/interview-simulator" element={<ProtectedRoute><InterviewSimulatorPage /></ProtectedRoute>} />
      <Route path="/market-intelligence" element={<ProtectedRoute><MarketIntelligencePage /></ProtectedRoute>} />
      <Route path="/career-path" element={<ProtectedRoute><CareerPathPage /></ProtectedRoute>} />
      <Route path="/career-report" element={<ProtectedRoute><CareerReportPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/leave-review" element={<ProtectedRoute><LeaveReview /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
      <Route path="/admin/inbox" element={<ProtectedRoute><AdminInbox /></ProtectedRoute>} />
      <Route path="/admin/promo-codes" element={<ProtectedRoute><AdminPromoCodes /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
