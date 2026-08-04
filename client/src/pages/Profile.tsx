import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaArrowLeft, FaLock, FaCloudDownloadAlt, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import toast from "react-hot-toast";

import { saveProfile, getProfile } from "../services/profileApi";
import {
  connectDigiLocker,
  getDigiLockerDocuments,
  importDigiLockerDocument,
  type DigiLockerDoc
} from "../services/digiLockerApi";
import { getMatches } from "../services/match";

import ProgressBar from "../components/Profile/ProgressBar";
import StepIndicator from "../components/Profile/StepIndicator";
import BasicInfo from "../components/Profile/steps/BasicInfo";
import LocationInfo from "../components/Profile/steps/LocationInfo";
import OccupationInfo from "../components/Profile/steps/OccupationInfo";
import EducationInfo from "../components/Profile/steps/EducationInfo";
import ContactInfo from "../components/Profile/steps/ContactInfo";
import Review from "../components/Profile/steps/Review";

import { validateStep } from "../utils/validation";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const demoProfiles = {
  farmer: {
    name: "Ramesh Kumar",
    age: "42",
    gender: "Male",
    state: "Uttar Pradesh",
    district: "Lucknow",
    occupation: "Farmer",
    income: "180000",
    education: "High School",
    disability: "No",
    language: "Hindi",
    phone: "9876543210",
    rawText: "I am a small farmer seeking agricultural subsidies, crop insurance, farming equipment support, and fertilizer benefits.",
  },
  student: {
    name: "Priya Sharma",
    age: "20",
    gender: "Female",
    state: "Delhi",
    district: "New Delhi",
    occupation: "Student",
    income: "250000",
    education: "Graduate",
    disability: "No",
    language: "English",
    phone: "9876543211",
    rawText: "I am a student looking for higher education scholarships, tuition assistance, and learning fellowships.",
  },
  women: {
    name: "Sunita Devi",
    age: "29",
    gender: "Female",
    state: "Uttar Pradesh",
    district: "Lucknow",
    occupation: "Woman",
    income: "120000",
    education: "High School",
    disability: "No",
    language: "Hindi",
    phone: "9876543212",
    rawText: "I am a woman seeking social welfare benefits, self-help group loans, and family safety schemes.",
  },
};

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  const backPath = location.state?.from || "/dashboard";
  const backLabel = location.state?.label || "Dashboard";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalSteps = 6;

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    state: "",
    district: "",
    occupation: "",
    income: "",
    education: "",
    disability: "",
    language: "",
    phone: "",
    rawText: "",
  });

  // DigiLocker Modal States
  const [dlModalOpen, setDlModalOpen] = useState(false);
  const [dlStep, setDlStep] = useState(1); // 1: Consent, 2: Document Select, 3: Diff Comparison
  const [dlDocs, setDlDocs] = useState<DigiLockerDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [diffFields, setDiffFields] = useState<string[]>([]);
  const [dlConnecting, setDlConnecting] = useState(false);

  const handleConnectDL = async () => {
    setDlConnecting(true);
    try {
      const res = await connectDigiLocker();
      toast.success(res.message);
      
      // Load docs list
      const docsRes = await getDigiLockerDocuments();
      setDlDocs(docsRes.documents);
      if (docsRes.documents.length > 0) {
        setSelectedDocId(docsRes.documents[0].id);
      }
      setDlStep(2);
    } catch (e: any) {
      toast.error(e.message || "Failed to connect to DigiLocker portal.");
    } finally {
      setDlConnecting(false);
    }
  };

  const handleImportDoc = async () => {
    if (!selectedDocId) {
      toast.error("Please select a document to import.");
      return;
    }
    setDlConnecting(true);
    try {
      const res = await importDigiLockerDocument(selectedDocId);
      toast.success(res.message);
      setExtractedData(res.extracted);
      setDiffFields(res.diffFields);
      setDlStep(3);
    } catch (e: any) {
      toast.error(e.message || "Failed to import and analyze document.");
    } finally {
      setDlConnecting(false);
    }
  };

  const handleMergeData = () => {
    if (!extractedData) return;

    setFormData((prev) => {
      let calculatedAge = prev.age;
      if (extractedData.dob) {
        const birthYear = new Date(extractedData.dob).getFullYear();
        calculatedAge = String(new Date().getFullYear() - birthYear);
      }

      return {
        ...prev,
        name: extractedData.name || prev.name,
        age: calculatedAge || prev.age,
        gender: extractedData.gender || prev.gender,
        state: extractedData.state || prev.state,
        district: extractedData.district || prev.district,
        occupation: extractedData.occupation || prev.occupation,
        income: extractedData.income || prev.income,
        disability: extractedData.disability || prev.disability,
      };
    });

    setDlModalOpen(false);
    setStep(6); // Jump straight to Review page
    toast.success("Profile parameters auto-filled with verified credentials! Review below.");
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile();
        if (!profile) return;
        setFormData({
          name: profile.name || "",
          age: profile.age || "",
          gender: profile.gender || "",
          state: profile.state || "",
          district: profile.district || "",
          occupation: profile.occupation || "",
          income: profile.income || "",
          education: profile.education || "",
          disability: profile.disability || "",
          language: profile.language || "",
          phone: profile.phone || "",
          rawText: profile.rawText || "",
        });
        
        if (profile.age && profile.state && profile.occupation) {
          setStep(6);
        } else {
          setStep(1);
        }
      } catch {
        // Ignore if no saved profile exists
      }
    }
    loadProfile();
  }, []);

  const loadDemoProfile = (type: keyof typeof demoProfiles) => {
    setFormData(demoProfiles[type]);
    setStep(6);
  };

  const nextStep = () => {
    if (!validateStep(step, formData)) {
      alert("Please complete all required fields.");
      return;
    }
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step, formData)) {
      alert("Please complete all required fields.");
      return;
    }

    setLoading(true);
    try {
      await saveProfile(formData);
      localStorage.setItem("profile", JSON.stringify(formData));
      const result = await getMatches(formData);
      localStorage.setItem("latestMatches", JSON.stringify(result.matches || []));
      localStorage.removeItem("reasoningShown");
      navigate("/results", {
        state: {
          matches: result.matches,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-16 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-xl mx-auto space-y-8">
          
          {/* Header Action */}
          <div className="flex items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(backPath)}
            >
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to {backLabel}
            </Button>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center">
            <Badge variant="accent">Welfare Eligibility Setup</Badge>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
              Citizen Profile Wizard
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Provide your details to match with schemes you qualify for.
            </p>
          </div>

          {/* Quick Demo Selector */}
          <Card className="border border-[#0F172A]/5 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              🚀 Try a Demo Profile template
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loadDemoProfile("farmer")}
                className="px-3 py-2.5 rounded-xl border border-[#22C55E]/10 bg-[#22C55E]/5 text-xs font-semibold text-[#22C55E] hover:bg-[#22C55E]/10 transition duration-150 cursor-pointer"
              >
                👨‍🌾 Farmer
              </button>
              <button
                type="button"
                onClick={() => loadDemoProfile("student")}
                className="px-3 py-2.5 rounded-xl border border-[#14B8A6]/10 bg-[#14B8A6]/5 text-xs font-semibold text-[#14B8A6] hover:bg-[#14B8A6]/10 transition duration-150 cursor-pointer"
              >
                👩 Student
              </button>
              <button
                type="button"
                onClick={() => loadDemoProfile("women")}
                className="px-3 py-2.5 rounded-xl border border-[#F59E0B]/10 bg-[#F59E0B]/5 text-xs font-semibold text-[#D97706] hover:bg-[#F59E0B]/10 transition duration-150 cursor-pointer"
              >
                👩‍🦰 Women
              </button>
            </div>
            <p className="mt-2.5 text-[10px] text-slate-400 font-semibold leading-normal">
              Clicking a template automatically fills all credentials and jumps directly to the Review screen.
            </p>
          </Card>

          {/* DigiLocker Auto-Build Profile */}
          <Card className="border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-5 shadow-soft rounded-3xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-[#14B8A6]/10 rounded-2xl text-[#14B8A6]">
                <FaLock size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-sm font-extrabold text-[#0F172A]">
                  Auto-Build Profile via DigiLocker
                </h4>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Connect your verified government DigiLocker to auto-fill your profile in 30 seconds instead of manual entries.
                </p>
              </div>
            </div>
            
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setDlStep(1);
                setDlModalOpen(true);
              }}
            >
              <FaCloudDownloadAlt className="mr-2 h-4 w-4" /> Import From DigiLocker
            </Button>
          </Card>

          {/* Form Wizard Wrapper */}
          <Card className="border border-[#0F172A]/5 p-8 shadow-premium space-y-6">
            <div>
              <StepIndicator current={step} total={totalSteps} />
              {step < totalSteps && (
                <div className="mt-4">
                  <ProgressBar current={step} total={totalSteps} />
                </div>
              )}
            </div>

            <div className="py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {step === 1 && (
                    <BasicInfo formData={formData} setFormData={setFormData} />
                  )}
                  {step === 2 && (
                    <LocationInfo formData={formData} setFormData={setFormData} />
                  )}
                  {step === 3 && (
                    <OccupationInfo formData={formData} setFormData={setFormData} />
                  )}
                  {step === 4 && (
                    <EducationInfo formData={formData} setFormData={setFormData} />
                  )}
                  {step === 5 && (
                    <ContactInfo formData={formData} setFormData={setFormData} />
                  )}
                  {step === 6 && (
                    <Review formData={formData} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-between gap-4 border-t border-slate-100 pt-6">
              {step === totalSteps ? (
                <Button
                  onClick={() => setStep(1)}
                  variant="secondary"
                  className="flex-1"
                >
                  Update Profile
                </Button>
              ) : step > 1 ? (
                <Button
                  onClick={prevStep}
                  variant="secondary"
                  className="flex-1"
                >
                  Back
                </Button>
              ) : (
                <div className="flex-1" />
              )}

              <Button
                onClick={step === totalSteps ? handleSubmit : nextStep}
                disabled={loading || !validateStep(step, formData)}
                className="flex-1"
                loading={loading && step === totalSteps}
              >
                {step === totalSteps ? "Find Schemes" : "Continue"}
              </Button>
            </div>
          </Card>

        </div>

        {/* DigiLocker Wizard Modal */}
        {dlModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full bg-white border border-slate-100 shadow-premium p-6 rounded-3xl space-y-6 relative">
              <button
                onClick={() => setDlModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-extrabold text-sm"
              >
                ✕
              </button>

              {dlStep === 1 && (
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center mx-auto">
                    <FaLock size={20} />
                  </div>
                  <h3 className="font-serif text-lg font-extrabold text-[#0F172A]">
                    DigiLocker Consent Approval
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Setu AI is requesting secure, read-only permissions to connect your DigiLocker vault. This permits us to automatically fetch your identity documents to build a verified profile.
                  </p>
                  <div className="pt-2">
                    <Button
                      onClick={handleConnectDL}
                      loading={dlConnecting}
                      className="w-full"
                    >
                      Agree & Connect DigiLocker
                    </Button>
                  </div>
                </div>
              )}

              {dlStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-extrabold text-[#0F172A]">
                    Select Government Certificate
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    We found these verified certificates in your DigiLocker. Select one to analyze and parse:
                  </p>
                  <div className="space-y-2">
                    {dlDocs.map((doc) => (
                      <label
                        key={doc.id}
                        className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition ${
                          selectedDocId === doc.id
                            ? "border-[#14B8A6] bg-[#14B8A6]/5"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedDoc"
                          checked={selectedDocId === doc.id}
                          onChange={() => setSelectedDocId(doc.id)}
                          className="text-[#14B8A6] focus:ring-[#14B8A6]"
                        />
                        <div className="text-xs font-bold text-slate-700">
                          <p>{doc.type}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">ID: {doc.doc_number}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="pt-2 flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setDlStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleImportDoc}
                      loading={dlConnecting}
                      className="flex-1"
                    >
                      Extract Info
                    </Button>
                  </div>
                </div>
              )}

              {dlStep === 3 && extractedData && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-extrabold text-[#0F172A]">
                    Verify Extracted Credentials
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    We ran an AI extraction checks. Review the parsed values before merging to your Setu AI profile:
                  </p>

                  <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden max-h-56 overflow-y-auto no-scrollbar">
                    {Object.keys(extractedData).map((key) => {
                      const val = extractedData[key];
                      if (val === null || val === undefined || typeof val === "object" || typeof val === "boolean") return null;
                      const isDiff = diffFields.includes(key);
                      return (
                        <div key={key} className="p-3 flex justify-between gap-4 text-xs font-semibold">
                          <span className="text-slate-400 capitalize">{key}</span>
                          <div className="text-right">
                            <p className="text-slate-700">{String(val)}</p>
                            {isDiff && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-bold mt-0.5">
                                <FaExclamationTriangle size={6} /> Differs
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => setDlStep(2)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleMergeData}
                      className="flex-1 animate-pulse"
                    >
                      Merge & Review
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </PageContainer>

      <Footer />
      <BottomBar />
    </main>
  );
}