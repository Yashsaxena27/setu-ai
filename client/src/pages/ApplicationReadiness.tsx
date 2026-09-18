import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaExclamationTriangle, FaQuestionCircle, FaGlobe, FaBuilding, FaLandmark, FaUniversity } from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import Modal from "../components/ui/Modal";
import { prepareApplication } from "../services/applicationPrepareApi";

export default function ApplicationReadiness() {
  const { schemeId } = useParams<{ schemeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.schemeSnapshot?.scheme_name || "Scheme",
        url: window.location.href,
      });
    } else {
      alert("Sharing is not supported on this device.");
    }
  };

  // Fallback to location state if scheme data is needed immediately, but API is authoritative
  const schemeState = location.state;

  useEffect(() => {
    if (!schemeId) return;
    
    setLoading(true);
    prepareApplication(schemeId)
      .then((res) => {
        if (res.success) {
          setData(res.application);
        } else {
          setError("Failed to load application data.");
        }
      })
      .catch(() => {
        setError("An error occurred while fetching application data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [schemeId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
        <Header />
        <PageContainer>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-bold text-sm">Preparing application action plan...</p>
          </div>
        </PageContainer>
        <Footer />
        <BottomBar />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
        <Header />
        <PageContainer>
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Oops!</h2>
            <p className="text-slate-500">{error || "Application not found"}</p>
            <Button onClick={() => navigate("/results")}>Back to Results</Button>
          </div>
        </PageContainer>
        <Footer />
        <BottomBar />
      </main>
    );
  }


  const scheme = data.schemeSnapshot || {};
  const score = data.readinessScore || 0;
  const documents = data.documents || [];
  const readinessLabel = score >= 80 ? "READY" : score >= 50 ? "ALMOST READY" : "PREPARING";
  
  const readyDocsCount = documents.filter((d: any) => d.status === "ready").length;
  const totalDocsCount = documents.length;
  
  const missingDocs = documents.filter((d: any) => d.status === "missing");
  const firstMissingDoc = missingDocs.length > 0 ? missingDocs[0].name : "document";

  const isReady = score >= 80;

  // Build profile fields for display
  const applicant = data.applicantSnapshot || {};
  const profileFields = [
    { label: "Name", filled: !!applicant.name },
    { label: "Age", filled: !!applicant.age },
    { label: "State", filled: !!applicant.state },
    { label: "District", filled: !!applicant.district },
    { label: "Occupation", filled: !!applicant.occupation },
    { label: "Income", filled: !!applicant.income },
    { label: "Education", filled: !!applicant.education },
    { label: "Phone", filled: !!applicant.phone },
  ];

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

  const passedRules = data.passedRules || [];
  const eligibilityExplanation = data.eligibilityExplanation || "You meet the basic requirements for this scheme.";

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

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* HEADER BAR */}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/results")}
            >
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Results
            </Button>
            <div className="flex gap-2 items-center">
              <Button size="sm" variant="secondary" onClick={handleShare}>Share Scheme</Button>
              <Badge variant="accent">Application Action Plan</Badge>
            </div>
          </div>

          {/* SCHEME NAME CARD */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium rounded-2xl">
            <h1 className="font-serif text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">
              {scheme?.scheme_name || schemeState?.scheme_name || "Scheme Details"}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{scheme?.category || schemeState?.category || "Category"}</Badge>
              {scheme?.level && <Badge variant="neutral">{scheme.level}</Badge>}
            </div>
          </Card>

          {/* READINESS GAUGE */}
          <div className="flex flex-col items-center justify-center p-8">
            <div className="relative h-32 w-32 flex items-center justify-center bg-white rounded-full shadow-soft border border-[#0F172A]/5 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" className="stroke-slate-100 fill-transparent" strokeWidth="8" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  className={`${score >= 80 ? "stroke-[#22C55E]" : score >= 50 ? "stroke-[#F59E0B]" : "stroke-[#EF4444]"} fill-transparent transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - score / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-2xl font-extrabold text-[#0F172A]">{score}%</span>
            </div>
            <h3 className="font-bold text-slate-700 tracking-wider uppercase">{readinessLabel}</h3>
          </div>

          {/* ELIGIBILITY SECTION */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl">
            <SectionHeader title="✓ Eligibility Verified" />
            <p className="text-sm font-medium text-slate-600 mb-4">{eligibilityExplanation}</p>
            {passedRules.length > 0 && (
              <ul className="space-y-2 mt-4">
                {passedRules.map((rule: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <FaCheck className="text-green-500" /> {rule}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* DOCUMENTS SECTION */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <SectionHeader title="Documents" />
              <Badge variant="neutral">{readyDocsCount} of {totalDocsCount} ready</Badge>
            </div>
            {totalDocsCount === 0 ? (
              <p className="text-sm text-slate-500 font-medium">Required documents not available in verified data.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {getDocIcon(doc.status)}
                    <span className={`text-sm font-bold ${doc.status === 'ready' ? 'text-slate-800' : doc.status === 'missing' ? 'text-amber-700' : 'text-slate-600'}`}>
                      {doc.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* APPLICATION DETAILS SECTION */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl">
            <SectionHeader title="Applicant Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {profileFields?.map((field: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-600">{field.label}</span>
                  {field.filled ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaExclamationTriangle className="text-amber-500" />
                  )}
                </div>
              ))}
              {(!profileFields || profileFields.length === 0) && (
                <p className="text-sm text-slate-500">Profile data missing.</p>
              )}
            </div>
          </Card>

          {/* APPLICATION ROUTE SECTION */}
          <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-soft rounded-2xl">
            <SectionHeader title="Where to Apply" />
            {(!applicationMethods || applicationMethods.length === 0) ? (
              <p className="text-sm font-medium text-slate-500 mt-2">Application route not available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {applicationMethods.map((method: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border border-slate-100 bg-slate-50 rounded-xl">
                    <div className="mt-1">{getMethodIcon(method.type)}</div>
                    <div>
                      <h4 className="font-bold text-slate-800 capitalize">{method.type === 'csc' ? 'CSC' : method.type}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{method.description || 'Application channel'}</p>
                      {method.type === 'online' && method.link && (
                        <a href={method.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#14B8A6] mt-2 inline-block hover:underline">
                          Official Portal &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* NEXT STEP SECTION & BOTTOM ACTIONS */}
          <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/20 p-6 rounded-2xl text-center space-y-4">
            <h3 className="font-serif text-2xl font-bold text-[#0F172A]">
              {isReady ? "Your application is ready!" : `Get your ${firstMissingDoc}`}
            </h3>
            <p className="text-sm text-slate-600 font-medium">
              {isReady 
                ? "You have all the necessary documents and profile details to proceed."
                : "Complete your document checklist before generating the application package."}
            </p>
            <div className="flex flex-col gap-3 max-w-sm mx-auto mt-4">
              {isReady ? (
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/apply/${schemeId}/package`)}
                >
                  Prepare Application Package
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  variant="primary"
                  onClick={() => navigate(`/document-verification/${schemeId}`)}
                >
                  View Required Documents
                </Button>
              )}
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => navigate(`/scheme/${schemeId}`)}
              >
                View Scheme Details
              </Button>
              <Button 
                variant="secondary" 
                className="w-full text-indigo-600 bg-indigo-50 border-none"
                onClick={() => setShowHelpModal(true)}
              >
                I Need Help Applying
              </Button>
            </div>
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
                  <p className="text-xs text-slate-500 mt-1 font-medium">{method.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </PageContainer>
      <Footer />
      <BottomBar />
    </main>
  );
}
