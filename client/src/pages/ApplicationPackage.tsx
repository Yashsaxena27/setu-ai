import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaExclamationTriangle, FaQuestionCircle, FaCopy, FaPrint, FaExternalLinkAlt, FaGlobe, FaBuilding, FaLandmark, FaUniversity } from "react-icons/fa";
import toast from "react-hot-toast";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import AITransparencyBadge from "../components/ui/AITransparencyBadge";
import Modal from "../components/ui/Modal";

import { prepareApplication } from "../services/applicationPrepareApi";
import { generateDraft } from "../services/draft";
import { startApplication } from "../services/applicationApi";

export default function ApplicationPackage() {
  const { schemeId } = useParams<{ schemeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [draftContent, setDraftContent] = useState<string>("");
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (!schemeId) return;
    
    setLoading(true);
    prepareApplication(schemeId)
      .then(async (res) => {
        if (res.success) {
           setData(res.application);
          if (res.application.generatedDraft) {
            setDraftContent(res.application.generatedDraft);
          } else {
            // Need to generate draft
            setGeneratingDraft(true);
            const profileStr = localStorage.getItem("profile");
            const profile = profileStr ? JSON.parse(profileStr) : res.application.applicantSnapshot || {};
            try {
              const draftRes = await generateDraft(profile, res.application.schemeSnapshot || {});
              if (draftRes.success) {
                setDraftContent(draftRes.draft);
              }
            } catch (err) {
              console.error(err);
            } finally {
              setGeneratingDraft(false);
            }
          }
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to prepare application package");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [schemeId]);

  if (loading || generatingDraft) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
        <Header />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-bold text-sm">Preparing your application package...</p>
          </div>
        </PageContainer>
        <Footer />
        <BottomBar />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
        <Header />
        <PageContainer>
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-600 font-bold">Could not load application package.</p>
            <Button onClick={() => navigate(`/apply/${schemeId}`)}>Back to Action Plan</Button>
          </div>
        </PageContainer>
      </main>
    );
  }

  const scheme = data.schemeSnapshot || {};
  const applicant = data.applicantSnapshot || {};
  const documents = data.documents || [];
  const passedRules = data.passedRules || [];
  const eligibilityExplanation = data.eligibilityExplanation || "You meet the basic requirements for this scheme.";

  // Build profile fields for display
  const profileFields = Object.entries(applicant)
    .filter(([_, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: String(value),
    }));

  // Build application methods for display
  const rawMethods = scheme.applicationMethods || [];
  const applicationMethods = rawMethods.map((m: string) => ({
    type: m,
    description: m === "online" ? "Apply through the official portal" 
      : m === "bank" ? (scheme.bankPurpose || "Bank-assisted application")
      : m === "csc" ? "Visit nearest Common Service Centre"
      : m === "government_office" ? (scheme.applicationOffice || "Visit the government office")
      : "Assisted application channel",
    link: m === "online" ? scheme.official_link : undefined,
  }));

  const handleCopyDraft = () => {
    if (!draftContent) return;
    navigator.clipboard.writeText(draftContent).then(() => {
      toast.success("Application draft copied!");
    }).catch(() => {
      toast.error("Failed to copy text");
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getDocIcon = (status: string) => {
    if (status === "ready") return <FaCheck className="text-green-500" />;
    if (status === "missing") return <FaExclamationTriangle className="text-amber-500" />;
    return <FaQuestionCircle className="text-gray-400" />;
  };

  const getMethodIcon = (methodType: string) => {
    if (methodType === "online") return <FaGlobe className="text-blue-500 text-xl" />;
    if (methodType === "bank") return <FaUniversity className="text-indigo-500 text-xl" />;
    if (methodType === "csc") return <FaBuilding className="text-teal-500 text-xl" />;
    return <FaLandmark className="text-slate-500 text-xl" />;
  };

  const onlineMethod = applicationMethods?.find((m: any) => m.type === "online" && m.link);

  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      await startApplication(schemeId!);
      toast.success("Application started!");
      navigate("/my-applications");
    } catch (err) {
      toast.error("Failed to start application");
      setIsStarting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-32 md:pb-24">
      <Header />
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* HEADER */}
          <div>
            <button 
              onClick={() => navigate(`/apply/${schemeId}`)}
              className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-4"
            >
              <FaArrowLeft className="mr-1.5 h-3 w-3" /> Back to Action Plan
            </button>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
              <div>
                <h1 className="font-serif text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Application Package
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">For: {scheme?.scheme_name || "Scheme Application"}</p>
              </div>
              <div className="bg-[#14B8A6]/10 px-4 py-2 rounded-xl border border-[#14B8A6]/20 self-start sm:self-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] block">Status</span>
                <span className="text-lg font-black text-[#0F172A]">{data.status || "Preparing"} <span className="text-[#14B8A6] ml-1">({data.readinessScore || 0}%)</span></span>
              </div>
            </div>
          </div>

          {/* SECTION 1 - APPLICANT */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl">
            <SectionHeader title="Applicant Information" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {profileFields?.filter((f: any) => f.filled).map((field: any, idx: number) => (
                <div key={idx} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{field.label}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-slate-800 truncate" title={field.value}>{field.value}</span>
                    <FaCheck className="text-green-500 h-3 w-3 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 2 - SCHEME */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl">
            <SectionHeader title="Scheme Details" />
            <div className="mt-4">
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">{scheme?.scheme_name}</h3>
              {scheme?.benefits && scheme.benefits.length > 0 && (
                <ul className="list-disc pl-5 space-y-1 mb-4">
                  {scheme.benefits.map((b: string, idx: number) => (
                    <li key={idx} className="text-sm text-slate-600 font-medium">{b}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {scheme?.official_link && (
                  <a href={scheme.official_link} target="_blank" rel="noreferrer" className="flex items-center text-[#14B8A6] font-bold hover:underline">
                    Official Source <FaExternalLinkAlt className="ml-1.5 h-3 w-3" />
                  </a>
                )}
                <span className="text-slate-400 font-bold">Last verified: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </Card>

          {/* SECTION 3 - WHY YOU QUALIFY */}
          <Card className="border border-[#14B8A6]/20 p-6 bg-[#14B8A6]/5 shadow-soft rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-serif text-xl font-bold text-[#0D9488]">Why You Qualify</h2>
              <AITransparencyBadge />
            </div>
            <div className="space-y-3">
              {passedRules?.map((rule: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                  <FaCheck className="text-[#0D9488] mt-1 flex-shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
              {(!passedRules || passedRules.length === 0) && (
                <p className="text-sm text-slate-600">{eligibilityExplanation}</p>
              )}
            </div>
          </Card>

          {/* SECTION 4 - DOCUMENT CHECKLIST */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl">
            <SectionHeader title="Document Checklist" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {documents?.map((doc: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {getDocIcon(doc.status)}
                  <span className="text-sm font-bold text-slate-700">{doc.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 5 - APPLICATION DRAFT */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl print:shadow-none print:border-none">
            <div className="flex justify-between items-center mb-2">
              <SectionHeader title="Application Draft" />
              <Button size="sm" variant="secondary" onClick={handleCopyDraft} className="print:hidden">
                <FaCopy className="mr-1.5 h-3 w-3" /> Copy
              </Button>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-4">Copy-paste ready draft for your application</p>
            {draftContent ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 whitespace-pre-wrap text-sm font-medium text-slate-700 font-mono leading-relaxed">
                {draftContent}
              </div>
            ) : (
              <div className="text-center py-6">
                <Button onClick={() => setGeneratingDraft(true)}>Generate Draft</Button>
              </div>
            )}
          </Card>

          {/* SECTION 6 - WHERE TO APPLY */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl print:hidden">
            <SectionHeader title="Where to Apply" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {applicationMethods?.map((method: any, idx: number) => (
                <div key={idx} className="flex items-start gap-4 p-4 border border-slate-100 bg-slate-50 rounded-xl">
                  <div className="mt-1">{getMethodIcon(method.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 capitalize">{method.type === 'csc' ? 'CSC' : method.type}</h4>
                    {method.type === 'online' && method.link ? (
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => window.open(method.link, '_blank')}
                      >
                        Apply Online <FaExternalLinkAlt className="ml-1.5 h-3 w-3" />
                      </Button>
                    ) : method.type === 'csc' ? (
                      <p className="text-xs text-slate-500 mt-1 font-medium">Visit nearest CSC</p>
                    ) : method.type === 'government_office' ? (
                      <p className="text-xs text-slate-500 mt-1 font-medium">{method.officeName || 'Government Office'}</p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1 font-medium">{method.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!applicationMethods || applicationMethods.length === 0) && (
                <p className="text-sm font-medium text-slate-500">Application methods not specified.</p>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
      
      {/* ACTIONS BAR (sticky bottom) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center sm:justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(`/apply/${schemeId}`)}>
            Back
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <FaPrint className="mr-1.5" /> Print / Save
          </Button>
          <Button variant="secondary" onClick={handleCopyDraft}>
            <FaCopy className="mr-1.5" /> Copy
          </Button>
          <Button variant="secondary" onClick={() => setShowHelpModal(true)}>
            I Need Help Applying
          </Button>
          {onlineMethod ? (
            <Button onClick={() => window.open(onlineMethod.link, '_blank')}>
              Apply Now <FaExternalLinkAlt className="ml-1.5 h-3 w-3" />
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={isStarting}>
              {isStarting ? "Starting..." : "Start Application"}
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Where to get help"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600 font-medium">
            You can get assistance with this application at the following centers:
          </p>
          {applicationMethods.map((method: any, idx: number) => (
            <div key={idx} className="flex items-start gap-4 p-4 border border-slate-100 bg-slate-50 rounded-xl">
              <div className="mt-1">{getMethodIcon(method.type)}</div>
              <div>
                <h4 className="font-bold text-slate-800 capitalize">{method.type === 'csc' ? 'CSC (Common Service Centre)' : method.type}</h4>
                <div className="text-xs text-slate-600 mt-2 font-medium space-y-1">
                  {method.type === 'csc' || method.type === 'bank' || method.type === 'government_office' ? (
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Take your required documents.</li>
                      <li>Show this printed Application Package.</li>
                      <li>Ask the official to help submit the scheme application.</li>
                      <li>Keep the acknowledgement/reference number safe.</li>
                    </ol>
                  ) : (
                    <p>{method.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Footer />
    </main>
  );
}
