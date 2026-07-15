import { Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import ProfileSetup from "@/pages/ProfileSetup";
import Profile from "@/pages/Profile";
import CareerRecommendations from "@/pages/CareerRecommendations";
import CareerDetails from "@/pages/CareerDetails";
import SkillAnalysisPage from "@/pages/SkillAnalysisPage";
import LearningRoadmapPage from "@/pages/LearningRoadmapPage";
import ResumeAnalysisPage from "@/pages/ResumeAnalysisPage";
import GitHubAnalysisPage from "@/pages/GitHubAnalysisPage";
import LinkedInAnalysisPage from "@/pages/LinkedInAnalysisPage";
import InterviewSimulatorPage from "@/pages/InterviewSimulatorPage";
import MarketIntelligencePage from "@/pages/MarketIntelligencePage";
import CareerPathPage from "@/pages/CareerPathPage";
import CareerReportPage from "@/pages/CareerReportPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import Support from "@/pages/Support";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Pricing from "@/pages/Pricing";
import Billing from "@/pages/Billing";
import PaymentSuccess from "@/pages/PaymentSuccess";
import LeaveReview from "@/pages/LeaveReview";
import AdminReviews from "@/pages/AdminReviews";
import AdminInbox from "@/pages/AdminInbox";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const AppRoutes = () => (
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
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
