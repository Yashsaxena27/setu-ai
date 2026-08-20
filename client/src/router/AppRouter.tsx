import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import CustomCursor from "../components/effects/CustomCursor";
import ScrollProgress from "../components/effects/ScrollProgress";
import WhatsAppWidget from "../components/widgets/WhatsAppWidget";
import CommandPalette from "../components/ui/CommandPalette";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import OfflineBanner from "../components/ui/OfflineBanner";
import DemoModeBanner from "../components/ui/DemoModeBanner";
import { DemoModeProvider } from "../context/DemoModeContext";

// Core critical pages (Direct load)
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Consent from "../pages/Consent";
import Profile from "../pages/Profile";
import Results from "../pages/Results";
import SchemeDetail from "../pages/SchemeDetail";
import ApplicationDraft from "../pages/ApplicationDraft";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRoute from "../components/auth/AdminRoute";

// Lazy-loaded secondary modules (Code splitting for fast bundle performance)
const EligibilitySimulator = lazy(() => import("../pages/EligibilitySimulator"));
const DocumentVerification = lazy(() => import("../pages/DocumentVerification"));
const ApplicationRoadmap = lazy(() => import("../pages/ApplicationRoadmap"));
const CompareSchemes = lazy(() => import("../pages/CompareSchemes"));
const SchemeUpdates = lazy(() => import("../pages/SchemeUpdates"));
const Family = lazy(() => import("../pages/Family"));
const Chat = lazy(() => import("../pages/Chat"));
const AdminPortal = lazy(() => import("../pages/AdminPortal"));
const Reminders = lazy(() => import("../pages/Reminders"));
const Settings = lazy(() => import("../pages/Settings"));

const RouteSuspenseFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3" role="status">
    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-semibold text-slate-500">Loading module...</p>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <>
      {/* Film grain noise overlay */}
      <div className="grain-overlay" />

      {/* Top scroll progress bar */}
      <ScrollProgress />

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Demo Mode Top Banner */}
      <DemoModeBanner />

      {/* Interactive custom cursor */}
      <CustomCursor />

      {/* Persistent WhatsApp Widget */}
      <WhatsAppWidget />

      {/* Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette />

      {/* Page transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Suspense fallback={<RouteSuspenseFallback />}>
            <Routes location={location}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/simulator" element={<EligibilitySimulator />} />
              <Route path="/eligibility-simulator" element={<EligibilitySimulator />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/consent" element={<Consent />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/results" element={<Results />} />
                <Route path="/scheme/:id" element={<SchemeDetail />} />
                <Route path="/draft/:id" element={<ApplicationDraft />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/compare" element={<CompareSchemes />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/document-verification" element={<DocumentVerification />} />
                <Route path="/document-verification/:schemeId" element={<DocumentVerification />} />
                <Route path="/application-roadmap" element={<ApplicationRoadmap />} />
                <Route path="/application-roadmap/:schemeId" element={<ApplicationRoadmap />} />
                <Route path="/scheme-updates" element={<SchemeUpdates />} />
                <Route path="/family" element={<Family />} />
                <Route path="/chat" element={<Chat />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPortal />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function AppRouter() {
  return (
    <ErrorBoundary>
      <DemoModeProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </DemoModeProvider>
    </ErrorBoundary>
  );
}