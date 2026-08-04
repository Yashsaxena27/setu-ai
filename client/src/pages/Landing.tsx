import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import {
  FaChevronDown,
  FaCheckCircle,
  FaUserCheck,
  FaMobileAlt,
  FaSearch,
  FaArrowDown,
  FaWhatsapp,
  FaPlayCircle,
  FaShieldAlt,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import { useDemoMode } from "../context/DemoModeContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import AnimatedBridge from "../components/effects/AnimatedBridge";
import HeroDashboard3D from "../components/effects/HeroDashboard3D";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { BridgeIcon } from "../components/ui/BridgeLogo";
import Reveal from "../components/effects/Reveal";
import TiltCard from "../components/effects/TiltCard";
import PipelineSection from "../components/ui/PipelineSection";
import MagneticButton from "../components/effects/MagneticButton";
import ImpactCounter from "../components/ui/ImpactCounter";

const HERO_WORDS = ["welfare", "schemes", "subsidies", "benefits", "support"];

export default function Landing() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [wordIndex, setWordIndex] = useState(0);

  const { user } = useAuth();
  const { enableDemoMode } = useDemoMode();
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    setHasProfile(!!localStorage.getItem("profile"));
  }, []);

  // How-it-works section scroll progress for line fill
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsRef,
    offset: ["start end", "center center"],
  });
  const lineScaleX = useSpring(stepsProgress, { stiffness: 100, damping: 20 });

  // Synonym cycle interval
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { value: "86+", label: "Verified Schemes", desc: "Monitored directly from government repositories" },
    { value: "Hybrid", label: "AI Matcher", desc: "Combines strict filtering with NLP models" },
    { value: "< 1s", label: "Match Time", desc: "Vector search checks your eligibility instantly" },
    { value: "Active", label: "WhatsApp Ready", desc: "Receive notifications and drafts directly" },
  ];

  const faqs = [
    {
      q: "How does Setu AI verify my eligibility?",
      a: "Setu AI parses official eligibility parameters (such as age, location, and income limits) and uses vector embedding searches to compare your profile details against official scheme guidelines, ensuring a highly accurate match.",
    },
    {
      q: "Is my personal data secure?",
      a: "Yes. Your privacy is our highest priority. We store data securely, never sell it, and encrypt all sensitive profile details. You can review our Consent Screen or delete your profile entirely at any time.",
    },
    {
      q: "Can I apply directly through Setu AI?",
      a: "Setu AI generates a customized application draft with a checklist of required documents. We provide direct official links to complete the formal application on official government portals.",
    },
    {
      q: "What types of government schemes are supported?",
      a: "We index central and state government schemes across education scholarships, agricultural subsidies, health benefits, entrepreneurial loans, and financial aid categories.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-16 md:pb-0">
      <Header />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-[1440px] px-5 pt-12 pb-6 md:px-14 lg:pt-24 lg:pb-12 overflow-hidden">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:items-center">
          
          {/* Left Column: Heading & CTAs */}
          <div className="w-full space-y-6">
              <Reveal direction="down" delayOffset={0}>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#14B8A6]/10 px-3.5 py-1 border border-[#14B8A6]/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488]">
                    🇮🇳 National Citizen Welfare Infrastructure
                  </span>
                </div>
              </Reveal>

              <Reveal direction="up" delayOffset={0.1}>
                <h1 className="font-serif text-5xl font-extrabold tracking-tight text-[#0F172A] sm:text-6xl lg:text-7xl leading-[1.1]">
                  Bridging Citizens <br />
                  to the{" "}
                  <span className="inline-block min-w-[200px] text-[#14B8A6]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={HERO_WORDS[wordIndex]}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="highlight-underline"
                      >
                        {HERO_WORDS[wordIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>{" "}
                  <br />
                  They Deserve
                </h1>
              </Reveal>

              <Reveal direction="up" delayOffset={0.2}>
                <p className="max-w-xl text-base text-slate-500 font-medium leading-relaxed sm:text-lg">
                  Setu AI cuts through bureaucratic complexity. Instantly discover, verify, and draft applications for government schemes tailored to your exact profile.
                </p>
              </Reveal>

              <Reveal direction="up" delayOffset={0.3}>
                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <MagneticButton>
                      <Button onClick={() => navigate("/consent")} size="lg" className="!rounded-full shadow-md">
                        Find my schemes &rarr;
                      </Button>
                    </MagneticButton>

                    <Button
                      onClick={() => {
                        enableDemoMode();
                        navigate("/results");
                      }}
                      variant="secondary"
                      size="lg"
                      className="!rounded-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-bold transition flex items-center gap-2"
                    >
                      <FaPlayCircle className="text-amber-600 text-lg" /> Quick Demo Mode (Kamla Devi)
                    </Button>

                    <Button 
                      onClick={() => window.dispatchEvent(new Event("open-whatsapp-widget"))}
                      variant="ghost" 
                      size="lg"
                      className="!rounded-full !border-[#0F172A]/20 !text-[#0F172A] hover:!border-[#14B8A6] hover:!text-[#14B8A6] hover:!bg-[#14B8A6]/5 transition-colors duration-300 flex items-center gap-2 bg-transparent border"
                    >
                      <FaWhatsapp className="text-lg text-emerald-600" /> WhatsApp
                    </Button>
                  </div>

                  {/* Trust badges row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 text-[#0D9488]">
                      <FaShieldAlt className="h-3 w-3" /> DPDP Act 2023 Compliant
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>Zero Data Resale</span>
                    <span className="text-slate-300">•</span>
                    <span>Direct Government Links</span>
                    <span className="text-slate-300">•</span>
                    <span>256-bit Encrypted</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right Column: Animated Bridge Illustration */}
            <div className="relative w-full mt-12 lg:mt-0">
              <Reveal direction="left" delayOffset={0.4}>
                <AnimatedBridge />
              </Reveal>
            </div>
          </div>

          {/* Scroll Cue Indicator */}
          <div className="flex justify-center pt-12 sm:pt-16">
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#14B8A6] transition group"
            >
              <span>Scroll to explore</span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <FaArrowDown className="text-[#14B8A6]" />
              </motion.div>
            </a>
          </div>
        </section>

      <PageContainer>
        {/* Statistics Section (ImpactCounter) */}
        <section className="pt-8 pb-8 border-y border-[#0F172A]/5 bg-white/50 rounded-3xl px-6 mt-4 mb-8 shadow-soft">
          <ImpactCounter />
        </section>

        <PipelineSection />

        {/* Problem & Solution Bento Grid */}
        <section id="features" className="pt-10 pb-12 space-y-12 scroll-mt-24">
          <Reveal direction="down">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[#14B8A6]">WHAT YOU GET</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-[1.15]">
                Discovery is easy.<br />
                <span className="text-[#0D9488] italic font-medium highlight-underline">Applying is the hard part.</span>
              </h2>
              <p className="max-w-xl text-base text-[#0F172A]/70 font-medium leading-relaxed pt-2">
                Setu closes the gap other platforms leave open — from "you're eligible" to a filled, submittable draft.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Grid Item 1 - Large Spanning with Tilt */}
            <div className="md:col-span-2">
              <Reveal index={0} direction="up">
                <TiltCard>
                  <Card className="h-full flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <Badge variant="accent">Core Technology</Badge>
                      <h3 className="font-serif text-2xl font-bold text-[#0F172A]">
                        RAG-powered Hybrid Eligibility Engine
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                        Setu AI compares profile metrics against complex legal documents. Combining vector searches with strict constraint filters avoids incorrect suggestions.
                      </p>
                    </div>
                    <div className="bg-[#FAF8F3] p-4 rounded-xl border border-[#0F172A]/5 flex items-center justify-between gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-2 text-[#0D9488]">
                        <FaUserCheck className="h-4 w-4" />
                        No False Matches
                      </span>
                      <span className="text-slate-400">Verifying 12 key factors dynamically</span>
                    </div>
                  </Card>
                </TiltCard>
              </Reveal>
            </div>

            {/* Grid Item 2 */}
            <Reveal index={1} direction="up">
              <TiltCard>
                <Card className="h-full flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <Badge variant="success">Productivity</Badge>
                    <h3 className="font-serif text-xl font-bold text-[#0F172A]">
                      Official Document Checks
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      Matches automatically calculate what paperwork you need to prepare, bypassing local inquiry visits.
                    </p>
                  </div>
                  <div className="text-xs text-[#0F172A]/60 font-bold">
                    • Aadhaar • Income Cert. • Land Records
                  </div>
                </Card>
              </TiltCard>
            </Reveal>

            {/* Grid Item 3 */}
            <Reveal index={2} direction="up">
              <TiltCard>
                <Card className="h-full flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <Badge variant="warning">Accessibility</Badge>
                    <h3 className="font-serif text-xl font-bold text-[#0F172A]">
                      Eligibility Simulator
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      Simulate major life events—like changes in jobs, income, or graduation status—to see scheme adjustments.
                    </p>
                  </div>
                  <Button onClick={() => navigate("/eligibility-simulator")} variant="ghost" size="sm" className="w-full justify-start p-0">
                    Run Simulation →
                  </Button>
                </Card>
              </TiltCard>
            </Reveal>

            {/* Grid Item 4 - Spanning with Tilt */}
            <div className="md:col-span-2">
              <Reveal index={3} direction="up">
                <TiltCard>
                  <Card className="h-full flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <Badge variant="info">Communication</Badge>
                      <h3 className="font-serif text-2xl font-bold text-[#0F172A]">
                        AI Application Drafts & WhatsApp Delivery
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                        Get high-quality application drafts in a Google Docs style editor. Export immediately to PDF or sync matches over WhatsApp.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-[#FAF8F3] px-3 py-1.5 rounded-lg border border-[#0F172A]/5 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <FaMobileAlt /> Native Delivery
                      </span>
                      <span className="bg-[#FAF8F3] px-3 py-1.5 rounded-lg border border-[#0F172A]/5 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <FaCheckCircle className="text-[#22C55E]" /> PDF Ready
                      </span>
                    </div>
                  </Card>
                </TiltCard>
              </Reveal>
            </div>
          </div>
        </section>

        {/* How Setu Works */}
        <section ref={stepsRef} className="py-12 space-y-12">
          <Reveal direction="down">
            <div className="flex flex-col items-center text-center space-y-4 mb-16 relative">
              <span className="text-xs font-bold uppercase tracking-widest text-[#14B8A6]">HOW IT WORKS</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-[1.15]">
                Simple Three Step Discovery
              </h2>

              <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                We guide you from profiling to draft preparation with absolute clarity.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
            {/* Background line driven by scroll transform */}
            <div className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-slate-200/60 -z-10 overflow-hidden">
              <motion.div
                className="h-full bg-[#14B8A6] origin-left"
                style={{ scaleX: lineScaleX }}
              />
            </div>

            {/* Step 1 */}
            <Reveal index={0} direction="up">
              <TiltCard>
                <Card className="text-center p-8 space-y-4 flex flex-col items-center h-full">
                  <div className="h-12 w-12 rounded-full bg-[#14B8A6]/10 text-[#0D9488] font-bold text-xl flex items-center justify-center border border-[#14B8A6]/20">
                    1
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#0F172A]">Complete Your Profile</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Answer structured steps: income, location, occupation, and health status. We protect your privacy at every stage.
                  </p>
                </Card>
              </TiltCard>
            </Reveal>

            {/* Step 2 */}
            <Reveal index={1} direction="up">
              <TiltCard>
                <Card className="text-center p-8 space-y-4 flex flex-col items-center h-full">
                  <div className="h-12 w-12 rounded-full bg-[#14B8A6]/10 text-[#0D9488] font-bold text-xl flex items-center justify-center border border-[#14B8A6]/20">
                    2
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#0F172A]">AI Match & Review</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Our hybrid RAG model matches you against federal guidelines, yielding a checklist of qualified schemes.
                  </p>
                </Card>
              </TiltCard>
            </Reveal>

            {/* Step 3 */}
            <Reveal index={2} direction="up">
              <TiltCard>
                <Card className="text-center p-8 space-y-4 flex flex-col items-center h-full">
                  <div className="h-12 w-12 rounded-full bg-[#14B8A6]/10 text-[#0D9488] font-bold text-xl flex items-center justify-center border border-[#14B8A6]/20">
                    3
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#0F172A]">Prepare Application</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Download a clean, pre-filled application draft PDF and proceed directly to official web links to submit.
                  </p>
                </Card>
              </TiltCard>
            </Reveal>
          </div>
        </section>

        {/* Dynamic Search Box Previews with Ambient Blob */}
        <section className="py-16">
          <Reveal direction="up">
            <div className="rounded-3xl bg-[#0F172A] p-8 sm:p-12 text-white relative overflow-hidden shadow-premium">
              {/* Ambient Blob */}
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-radial from-[#14B8A6]/30 via-[#F59E0B]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
                <BridgeIcon className="h-[240px] w-[240px]" />
              </div>
              
              <div className="relative z-10 max-w-2xl space-y-6">
                <Badge variant="accent">Instant AI Search</Badge>
                <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Instantly check your eligibility
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                  Describe your current situation in simple words (e.g. "I am a student from rural UP looking for laptop subsidies") and we will analyze matches instantly.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Example: Female college student from Delhi..."
                    data-hover-target="true"
                    className="flex-1 px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#14B8A6] focus:bg-white/10 font-medium text-sm"
                  />
                  <MagneticButton>
                    <Button onClick={() => navigate("/consent")} variant="accent">
                      <FaSearch className="mr-2" /> Match Schemes
                    </Button>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 3D Animated Dynamic Dashboard */}
        {user && hasProfile && (
          <section className="pb-16 sm:pb-24">
            <Reveal direction="up">
              <div className="w-full">
                <HeroDashboard3D />
              </div>
            </Reveal>
          </section>
        )}

        {/* Built Responsibly Section */}
        <section id="trust" className="py-8 space-y-12 scroll-mt-32">
          <Reveal direction="down">
            <div className="text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6]">Built Responsibly</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#0F172A] leading-tight">
                Sensitive data. <br />
                <span className="italic text-[#14B8A6] font-serif font-medium">Handled seriously.</span>
              </h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base max-w-2xl mx-auto">
                Income, disability status, occupation — this is exactly the data that deserves the most care, grounded in India's DPDP Act.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Reveal index={0} direction="up">
              <Card className="p-6 space-y-4 h-full transition-colors duration-300 hover:border-[#14B8A6] hover:bg-[#F0FDFA]/30">
                <span className="text-xs font-bold text-[#94A3B8]">01</span>
                <h3 className="font-serif text-lg font-bold text-[#0F172A]">Data minimization</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Only fields actually used in matching are collected — nothing "just in case."
                </p>
              </Card>
            </Reveal>

            <Reveal index={1} direction="up">
              <Card className="p-6 space-y-4 h-full transition-colors duration-300 hover:border-[#14B8A6] hover:bg-[#F0FDFA]/30">
                <span className="text-xs font-bold text-[#94A3B8]">02</span>
                <h3 className="font-serif text-lg font-bold text-[#0F172A]">Explicit consent</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  A checked box, not a pre-checked default. No profile form proceeds without it.
                </p>
              </Card>
            </Reveal>

            <Reveal index={2} direction="up">
              <Card className="p-6 space-y-4 h-full transition-colors duration-300 hover:border-[#14B8A6] hover:bg-[#F0FDFA]/30">
                <span className="text-xs font-bold text-[#94A3B8]">03</span>
                <h3 className="font-serif text-lg font-bold text-[#0F172A]">Real right to deletion</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  "Delete my data" triggers an actual hard delete — not a cosmetic screen.
                </p>
              </Card>
            </Reveal>

            <Reveal index={3} direction="up">
              <Card className="p-6 space-y-4 h-full transition-colors duration-300 hover:border-[#14B8A6] hover:bg-[#F0FDFA]/30">
                <span className="text-xs font-bold text-[#94A3B8]">04</span>
                <h3 className="font-serif text-lg font-bold text-[#0F172A]">Prompt-injection safe</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  User text is always data, never instruction — sandboxed in every LLM call.
                </p>
              </Card>
            </Reveal>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="pt-16 pb-0 max-w-4xl mx-auto space-y-8">
          <Reveal direction="down">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-4xl font-extrabold text-[#0F172A]">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                Answers regarding match parameters, security, and document verification.
              </p>
            </div>
          </Reveal>

          <Reveal direction="up" delayOffset={0.1}>
            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className="border-b border-[#0F172A]/5">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      data-hover-target="true"
                      className="w-full py-5 flex items-center justify-between text-left font-serif text-lg font-bold text-[#0F172A] hover:text-[#14B8A6] transition duration-150 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <FaChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#14B8A6]" : "text-slate-400"
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="pb-5 text-sm text-slate-500 font-medium leading-relaxed">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>
      </PageContainer>

      <Footer />
      <BottomBar />
    </main>
  );
}