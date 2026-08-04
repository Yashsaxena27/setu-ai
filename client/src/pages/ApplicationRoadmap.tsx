import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaLock,
  FaRegFileAlt,
  FaUserEdit,
  FaUserCheck,
  FaCloudUploadAlt,
  FaDownload,
  FaExchangeAlt,
  FaHistory,
  FaRobot,
  FaWhatsapp,
  FaCopy,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import Select from "../components/ui/Select";
import EmptyState from "../components/ui/EmptyState";
import {
  getApplicationRoadmap,
  completeRoadmapStep,
  sendRoadmapWhatsApp,
  type ApplicationRoadmapRecord,
  type RoadmapStep,
} from "../services/applicationRoadmapApi";
import { createReminder } from "../services/reminder";

function CircularProgress({ percent }: { percent: number }) {
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-20 w-20 flex items-center justify-center bg-white rounded-full border border-slate-100 shadow-soft">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="40" cy="40" r={radius} className="stroke-slate-100 fill-transparent" strokeWidth={strokeWidth} />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-[#14B8A6] fill-transparent transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-black text-[#0F172A]">{percent}%</span>
    </div>
  );
}

export default function ApplicationRoadmap() {
  const { schemeId: urlSchemeId } = useParams<{ schemeId: string }>();
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);

  // States
  const [matchedSchemes, setMatchedSchemes] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>("");
  const [roadmap, setRoadmap] = useState<ApplicationRoadmapRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappPreview, setWhatsappPreview] = useState("");

  // Load matched schemes list
  useEffect(() => {
    const cached = localStorage.getItem("latestMatches");
    if (cached) {
      const schemes = JSON.parse(cached);
      setMatchedSchemes(schemes);
      if (urlSchemeId) {
        setSelectedSchemeId(urlSchemeId);
      } else if (schemes.length > 0) {
        setSelectedSchemeId(schemes[0]._id);
      }
    }
  }, [urlSchemeId]);

  // Load roadmap when scheme changes
  useEffect(() => {
    if (!selectedSchemeId) return;
    loadRoadmapData();
  }, [selectedSchemeId]);

  const loadRoadmapData = async () => {
    setLoading(true);
    try {
      const res = await getApplicationRoadmap(selectedSchemeId);
      setRoadmap(res.roadmap);
      // Auto-expand current active step
      setExpandedStepId(res.roadmap.current_step);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load application roadmap.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteManualStep = async (stepId: string) => {
    if (!selectedSchemeId) return;
    try {
      toast.loading("Updating roadmap checklist...", { id: "roadmap-step" });
      const res = await completeRoadmapStep(selectedSchemeId, stepId);
      setRoadmap(res.roadmap);
      toast.success("Progress checked off!", { id: "roadmap-step" });
    } catch (e: any) {
      toast.error(e.message || "Failed to complete step.", { id: "roadmap-step" });
    }
  };

  const handleNextActionClick = (step: RoadmapStep) => {
    // Dynamically direct citizen based on step requirements
    if (step.id === "step-1") {
      navigate("/profile");
    } else if (step.id === "step-2" || step.id === "step-3") {
      navigate(`/document-verification/${selectedSchemeId}`);
    } else if (step.id === "step-4" || step.id === "step-5") {
      // Find matching scheme item in cache
      const item = matchedSchemes.find((s) => s._id === selectedSchemeId);
      navigate(`/draft/${selectedSchemeId}`, { state: item });
    } else {
      // Expand manually checkable steps
      setExpandedStepId(step.id);
    }
  };

  const getStepIcon = (iconName: string, status: string) => {
    if (status === "Locked") return <FaLock className="text-slate-400" />;
    
    switch (iconName) {
      case "FaUserEdit":
        return <FaUserEdit className="text-[#14B8A6]" />;
      case "FaUserCheck":
        return <FaUserCheck className="text-[#14B8A6]" />;
      case "FaCloudUploadAlt":
        return <FaCloudUploadAlt className="text-[#14B8A6]" />;
      case "FaRegFileAlt":
        return <FaRegFileAlt className="text-[#14B8A6]" />;
      case "FaDownload":
        return <FaDownload className="text-[#14B8A6]" />;
      case "FaExchangeAlt":
        return <FaExchangeAlt className="text-[#14B8A6]" />;
      case "FaCheckCircle":
        return <FaCheckCircle className="text-[#14B8A6]" />;
      case "FaHistory":
        return <FaHistory className="text-[#14B8A6]" />;
      default:
        return <FaRegFileAlt className="text-[#14B8A6]" />;
    }
  };

  const getStepStatusDot = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />;
      case "Pending":
        return <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />;
      default:
        return <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />;
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case "Easy":
        return <Badge variant="success" size="sm">Easy</Badge>;
      case "Medium":
        return <Badge variant="warning" size="sm">Medium</Badge>;
      default:
        return <Badge variant="error" size="sm">Hard</Badge>;
    }
  };

  // WhatsApp Exporter
  const handleWhatsAppExport = async () => {
    if (!selectedSchemeId) return;
    try {
      toast.loading("Preparing WhatsApp notification...", { id: "wa-road" });
      const res = await sendRoadmapWhatsApp(selectedSchemeId);
      setWhatsappPreview(res.message);
      setWhatsappModalOpen(true);
      toast.success("Roadmap ready to send!", { id: "wa-road" });
    } catch (e) {
      toast.error("Failed to generate WhatsApp notification summary.", { id: "wa-road" });
    }
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappPreview);
    toast.success("WhatsApp message copied!");
    setWhatsappModalOpen(false);
  };

  const handleCreateAlert = async (step: RoadmapStep, period: "tomorrow" | "week") => {
    if (!selectedSchemeId || !roadmap) return;
    
    const targetDate = new Date();
    if (period === "tomorrow") {
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      targetDate.setDate(targetDate.getDate() + 7);
    }
    
    try {
      toast.loading(`Scheduling alert for ${period === "tomorrow" ? "Tomorrow" : "Next Week"}...`, { id: "rem-set" });
      await createReminder({
        schemeId: selectedSchemeId,
        schemeName: roadmap.schemeName,
        reminder_date: targetDate.toISOString(),
        notification_channel: "WhatsApp",
        status: "Pending",
      });
      toast.success(`Success! WhatsApp reminder set for ${targetDate.toLocaleDateString()}`, { id: "rem-set" });
    } catch (e) {
      toast.error("Failed to register reminder alert.", { id: "rem-set" });
    }
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    const el = document.getElementById("roadmap-report");
    if (!el) return;

    try {
      toast.loading("Creating roadmap PDF...", { id: "pdf-road" });
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FAF8F3",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Setu_AI_Roadmap_${roadmap?.schemeName.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF Downloaded!", { id: "pdf-road" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to create PDF document.", { id: "pdf-road" });
    }
  };

  const activeStep = roadmap?.steps.find((s) => s.id === roadmap.current_step);

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Action */}
          <div className="flex justify-between items-center">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
            </Button>
            <Badge variant="accent">Google Maps for Welfare Journeys</Badge>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-extrabold text-[#0F172A] tracking-tight">
              AI Personalized Application Roadmap
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Track progress, resolve locks, and follow our step-by-step submission checklists.
            </p>
          </div>

          {/* Scheme Selector */}
          <div className="max-w-md">
            <Select
              label="Track Scheme Application journey"
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
            >
              {matchedSchemes.length === 0 ? (
                <option value="">No matched schemes available</option>
              ) : (
                matchedSchemes.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.scheme_name}
                  </option>
                ))
              )}
            </Select>
          </div>

          {!selectedSchemeId ? (
            <EmptyState
              title="No Journey Loaded"
              description="Complete the profile matching wizard first to select matched welfare options."
              action={<Button onClick={() => navigate("/profile")}>Start Profile Wizard</Button>}
            />
          ) : loading ? (
            <div className="space-y-6 animate-pulse">
              <Card className="p-6 bg-white border border-slate-100 h-44" />
              <Card className="p-6 bg-white border border-slate-100 h-96" />
            </div>
          ) : !roadmap ? (
            <EmptyState
              title="Awaiting Journey Details"
              description="Failed to load your roadmap checklist details."
            />
          ) : (
            <div id="roadmap-report" className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
              
              {/* LEFT COLUMN: HERO SUMMARY & AI ASSISTANT PANEL */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Hero Summary Card */}
                <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium rounded-3xl flex items-center justify-between gap-6">
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Application Journey
                    </span>
                    <h2 className="font-serif text-xl font-extrabold text-[#0F172A] leading-tight">
                      {roadmap.completion_percentage === 100 ? "Ready to Submit!" : "Submission In Progress"}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 pt-2">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Est Remaining</span>
                        <span className="text-[#0F172A] font-extrabold text-sm">{roadmap.estimated_completion}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Approval Chance</span>
                        <span className="text-indigo-600 font-extrabold text-sm">{roadmap.successScore}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <CircularProgress percent={roadmap.completion_percentage} />
                </Card>

                {/* Next Best Action Widget */}
                {activeStep && (
                  <Card className="border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-6 rounded-3xl shadow-soft space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#0D9488] uppercase tracking-widest block">
                        Next Best Action
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#0F172A]">
                        {activeStep.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {activeStep.description}
                      </p>
                    </div>

                    <Button className="w-full" onClick={() => handleNextActionClick(activeStep)}>
                      Continue Journey: {activeStep.title}
                    </Button>
                  </Card>
                )}

                {/* AI Assistant Guidance */}
                {roadmap.aiGuidance && (
                  <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium space-y-3">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#14B8A6] flex items-center gap-1.5">
                      <FaRobot className="text-base" /> AI Caseworker Guidance
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {roadmap.aiGuidance}
                    </p>
                  </Card>
                )}

                {/* Export Options card */}
                <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium space-y-4">
                  <SectionHeader title="Export Options" />
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="secondary" onClick={handleWhatsAppExport} className="w-full justify-between">
                      <span>Send Summary to WhatsApp</span>
                      <FaWhatsapp className="text-emerald-500 text-lg" />
                    </Button>
                    <Button variant="secondary" onClick={handleDownloadPDF} className="w-full justify-between">
                      <span>Export Journey Report PDF</span>
                      <FaDownload className="text-slate-400 text-base" />
                    </Button>
                  </div>
                </Card>

              </div>

              {/* RIGHT COLUMN: INTERACTIVE ROADMAP TIMELINE */}
              <div className="lg:col-span-7 space-y-6">
                
                <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium rounded-3xl space-y-6">
                  <SectionHeader title="Welfare Roadmap Timeline" />

                  {/* Vertical Duolingo-style Roadmap Line */}
                  <div className="relative pl-6 border-l border-slate-100 ml-4 space-y-6">
                    
                    {roadmap.steps.map((step, idx) => {
                      const isExpanded = expandedStepId === step.id;
                      const isLocked = step.status === "Locked";
                      const isCompleted = step.status === "Completed";
                      const canManualCheck = !isLocked && !isCompleted && ["step-5", "step-6", "step-7", "step-8"].includes(step.id);

                      return (
                        <div key={step.id} className="relative space-y-3">
                          
                          {/* Left Circle status button */}
                          <div
                            onClick={() => !isLocked && setExpandedStepId(isExpanded ? null : step.id)}
                            className={`absolute -left-[45px] top-0 h-10 w-10 rounded-full border flex items-center justify-center cursor-pointer transition duration-150 ${
                              isCompleted
                                ? "bg-emerald-50 border-emerald-200 text-[#22C55E] shadow-soft"
                                : step.status === "Pending"
                                ? "bg-amber-50 border-amber-200 text-[#F59E0B] shadow-soft"
                                : "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                            }`}
                          >
                            {getStepIcon(step.icon, step.status)}
                          </div>

                          {/* Step summary details */}
                          <div className="pl-3 space-y-1">
                            <div className="flex justify-between items-center gap-3">
                              <span
                                onClick={() => !isLocked && setExpandedStepId(isExpanded ? null : step.id)}
                                className={`text-sm font-extrabold cursor-pointer hover:text-[#14B8A6] transition ${
                                  isLocked ? "text-slate-400 cursor-default hover:text-slate-400" : "text-[#0F172A]"
                                }`}
                              >
                                {step.title}
                              </span>
                              <div className="flex items-center gap-2">
                                {getDifficultyBadge(step.difficulty)}
                                <span className={`h-2.5 w-2.5 rounded-full ${
                                  isCompleted ? "bg-[#22C55E]" : step.status === "Pending" ? "bg-[#F59E0B]" : "bg-slate-200"
                                }`} />
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 font-semibold truncate max-w-sm">
                              {step.description}
                            </p>
                          </div>

                          {/* Expanded Step details panels */}
                          <AnimatePresence>
                            {isExpanded && !isLocked && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-3 border-l-2 border-[#14B8A6]/20 ml-2 pt-2 pb-4 space-y-4 overflow-hidden"
                              >
                                <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-500 font-medium">
                                  <p>Time Required: <span className="font-extrabold text-slate-700">{step.estimated_time}</span></p>
                                  <p>Cost: <span className="font-extrabold text-slate-700">{step.details.cost}</span></p>
                                  <p className="col-span-2">Government Desk: <span className="font-extrabold text-slate-700">{step.details.office}</span></p>
                                </div>

                                <div className="space-y-1.5 text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Caseworker Context</span>
                                  <p className="font-bold text-slate-700">{step.details.whyRequired}</p>
                                  <p className="mt-2 text-slate-500">{step.details.whereObtain}</p>
                                </div>

                                {step.details.reqDocuments.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Prerequisites checklist</span>
                                    <ul className="space-y-1 text-xs text-slate-500 font-medium">
                                      {step.details.reqDocuments.map((d, index) => (
                                        <li key={index} className="flex items-center gap-1.5">
                                          <span className="text-emerald-500">•</span>
                                          {d}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Resources panel links */}
                                <div className="flex flex-wrap gap-2.5 pt-2">
                                  {step.resources.website && (
                                    <a href={step.resources.website} target="_blank" rel="noreferrer">
                                      <Button size="xs" variant="secondary" className="flex items-center gap-1">
                                        <FaExternalLinkAlt size={10} /> Visit Portal
                                      </Button>
                                    </a>
                                  )}
                                  {step.resources.helpline && (
                                    <a href={`tel:${step.resources.helpline}`}>
                                      <Button size="xs" variant="secondary" className="flex items-center gap-1">
                                        <FaPhoneAlt size={10} /> Help: {step.resources.helpline}
                                      </Button>
                                    </a>
                                  )}
                                  {step.resources.mapLocation && (
                                    <a href={step.resources.mapLocation} target="_blank" rel="noreferrer">
                                      <Button size="xs" variant="secondary" className="flex items-center gap-1">
                                        <FaMapMarkerAlt size={10} /> View Desk Map
                                      </Button>
                                    </a>
                                  )}
                                </div>

                                {/* Quick Reminders */}
                                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Schedule Alert:</span>
                                  <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={() => handleCreateAlert(step, "tomorrow")}
                                  >
                                    Tomorrow
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="secondary"
                                    onClick={() => handleCreateAlert(step, "week")}
                                  >
                                    Next Week
                                  </Button>
                                </div>

                                {/* Manual Checkoff trigger */}
                                {canManualCheck && (
                                  <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        onChange={() => handleCompleteManualStep(step.id)}
                                        className="h-4 w-4 text-[#14B8A6] focus:ring-[#14B8A6]/20 border-slate-300 rounded cursor-pointer"
                                      />
                                      <span>I have completed this action (check to mark done)</span>
                                    </label>
                                  </div>
                                )}

                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      );
                    })}

                  </div>
                </Card>

              </div>

            </div>
          )}

        </div>
      </PageContainer>

      {/* WhatsApp simulated Preview Modal */}
      <AnimatePresence>
        {whatsappModalOpen && (
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#0F172A]/10 rounded-3xl p-6 max-w-md w-full shadow-premium space-y-4"
            >
              <h3 className="font-serif text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <FaWhatsapp className="text-emerald-500" /> WhatsApp Message Summary
              </h3>
              
              <div className="bg-[#FAF8F3] border border-slate-100 p-4 rounded-2xl max-h-72 overflow-y-auto font-mono text-[10px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                {whatsappPreview}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => setWhatsappModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleCopyWhatsApp} className="flex items-center gap-1.5">
                  <FaCopy /> Copy & Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      <BottomBar />
    </main>
  );
}
