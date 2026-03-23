

# Career Decode — Phase 1 Implementation Plan

## Overview
Build the frontend foundation for "Career Decode", an AI-powered career platform. Phase 1 covers the landing page, auth UI pages, navigation, and routing — all frontend-only with no backend logic.

## Design System
- **Colors**: Indigo/blue gradient primary, light gray/white backgrounds
- **Style**: Rounded-xl cards, soft shadows, gradient buttons, clean modern font (Inter)
- **Responsive**: Mobile-first design throughout

## Pages & Components

### 1. Layout Components
- **Navbar**: Sticky top bar with "Career Decode" logo, nav links (Home, Features scroll anchor, Login button, Signup primary button), mobile hamburger menu
- **Footer**: Minimal footer with About, Contact, Privacy links
- **ProtectedRoute**: Placeholder wrapper that simply renders children

### 2. Landing Page (`/`)
- **Hero Section**: Large headline "Decode Your Career with AI", subtext, two CTA buttons (Get Started → /signup, Explore Features → scroll), decorative gradient graphic on right
- **Features Section**: 5 feature cards with icons — AI Career Recommendations, Skill Gap Analysis, Learning Roadmaps, Resume Intelligence, Interview Preparation
- **How It Works**: 3-step horizontal layout — Create Profile → Get AI Insights → Follow Roadmap
- **CTA Section**: "Start building your future today" with signup button
- **Footer**: Rendered at bottom

### 3. Auth Pages (UI only, controlled inputs, no real logic)
- **Login** (`/login`): Email + Password fields, Forgot Password link, Login button, link to Signup
- **Signup** (`/signup`): Full Name, Email, Password, Confirm Password, Create Account button, link to Login
- **Forgot Password** (`/forgot-password`): Email field, Send Reset Link button
- **Reset Password** (`/reset-password`): New Password + Confirm Password, Reset Password button

### 4. Routing
- `AppRoutes.tsx` with React Router: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, catch-all 404

### 5. File Structure
```
src/components/layout/Navbar.tsx
src/components/layout/Footer.tsx
src/components/layout/ProtectedRoute.tsx
src/pages/Landing.tsx
src/pages/Login.tsx
src/pages/Signup.tsx
src/pages/ForgotPassword.tsx
src/pages/ResetPassword.tsx
src/routes/AppRoutes.tsx
```

All forms use React state (controlled inputs) with no validation logic or API calls — ready for backend integration in Phase 2.

