import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  FaPlay,
  FaUndo,
  FaBriefcase,
  FaGraduationCap,
  FaArrowDown,
  FaArrowUp,
  FaArrowLeft,
  FaInfoCircle,
  FaPlus,
  FaMinus,
  FaDownload,
  FaShareAlt,
  FaCopy,
  FaRing,
  FaBaby,
  FaTractor,
  FaUserCircle,
} from "react-icons/fa";

import { simulateEligibility } from "../services/simulatorApi";
import { getProfile } from "../services/profileApi";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import Reveal from "../components/effects/Reveal";
import { ALL_INDIAN_STATES } from "../data/indiaLocations";
import { getFamilyProfile, type FamilyMemberRecord } from "../services/familyApi";

// Helper components
const ToggleSwitch = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100/50">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#0F172A]/70">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
          checked ? "bg-[#14B8A6]" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

export default function EligibilitySimulator() {
  const navigate = useNavigate();

  // Baseline database user profile
  const [originalProfile, setOriginalProfile] = useState<any>({
    name: "Guest Citizen",
    age: "30",
    gender: "Male",
    state: "Delhi",
    district: "New Delhi",
    occupation: "Student",
    income: "150000",
    education: "Undergraduate",
    disability: "No",
    language: "English",
    phone: "9876543210",
  });

  // Simulated virtual profile state (starts copy of original)
  const [simulatedProfile, setSimulatedProfile] = useState<any>({
    name: "Guest Citizen",
    age: "30",
    gender: "Male",
    state: "Delhi",
    district: "New Delhi",
    occupation: "Student",
    income: "150000",
    education: "Undergraduate",
    disability: "No",
    language: "English",
    phone: "9876543210",
    // Expanded simulation flags
    maritalStatus: "Single",
    children: "0",
    farmer: false,
    student: true,
    businessOwner: false,
    employmentStatus: "Student",
  });

  const [results, setResults] = useState<any>({
    gained: [],
    lost: [],
    unchanged: [],
    summary: {
      summaryText: "",
      largestBenefit: null,
      mostImportantScheme: "",
      suggestedDocuments: [],
      nextAction: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [originalMatchesCount, setOriginalMatchesCount] = useState(0);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberRecord[]>([]);

  const loadProfileData = async () => {
    try {
      const savedLocal = localStorage.getItem("profile");
      let profileData: any = null;
      if (savedLocal) {
        profileData = JSON.parse(savedLocal);
      } else {
        profileData = await getProfile();
      }

      if (profileData && profileData.age) {
        const profile = {
          ...profileData,
          maritalStatus: profileData.maritalStatus || profileData.marital_status || "Single",
          children: String(profileData.children || profileData.numberOfChildren || "0"),
          farmer: profileData.farmer || profileData.occupation?.toLowerCase().includes("farmer") || false,
          student: profileData.student || profileData.occupation?.toLowerCase().includes("student") || false,
          businessOwner: profileData.businessOwner || profileData.occupation?.toLowerCase().includes("business") || profileData.occupation?.toLowerCase().includes("self employed") || false,
          employmentStatus: profileData.employmentStatus || (profileData.occupation?.toLowerCase().includes("unemployed") ? "Unemployed" : "Employed"),
        };
        setOriginalProfile(profile);
        setSimulatedProfile(profile);
      }
    } catch (err) {
      console.warn("Could not load original profile, fallback to guest default", err);
    }
  };

  useEffect(() => {
    loadProfileData();

    async function loadFamily() {
      try {
        const res = await getFamilyProfile();
        setFamilyMembers(res.members);
      } catch (e) {
        console.warn("Failed to load family profiles", e);
      }
    }
    loadFamily();
  }, []);

  const handleSelectMember = (memberId: string) => {
    if (memberId === "self") {
      loadProfileData();
      toast.success("Loaded your baseline profile!");
    } else {
      const member = familyMembers.find((m) => m._id === memberId);
      if (member) {
        const profile = {
          name: member.name,
          age: String(member.age),
          gender: member.gender,
          state: member.state,
          district: member.district || "",
          occupation: member.occupation || "Other",
          income: String(member.income),
          education: member.education || "None",
          disability: member.disability ? "Yes" : "No",
          language: member.language || "English",
          phone: member.phone || "",
          maritalStatus: member.maritalStatus || "Single",
          children: "0",
          farmer: member.farmer,
          student: member.studentStatus,
          businessOwner: member.occupation?.toLowerCase().includes("business") || false,
          employmentStatus: member.employmentStatus || "Employed",
        };
        setOriginalProfile(profile);
        setSimulatedProfile(profile);
        toast.success(`Loaded ${member.name}'s profile parameters!`);
      }
    }
  };

  // Fetch initial profile matches count for comparison baseline chart
  useEffect(() => {
    async function fetchBaselineMatches() {
      try {
        // Run simulator on original vs original to get the matches count baseline
        const data = await simulateEligibility(originalProfile, originalProfile);
        setOriginalMatchesCount((data.unchanged?.length || 0) + (data.lost?.length || 0));
      } catch (e) {
        console.warn("Failed baseline matches fetch:", e);
      }
    }
    if (originalProfile.age) {
      fetchBaselineMatches();
    }
  }, [originalProfile]);

  async function runSimulation() {
    try {
      setLoading(true);
      const data = await simulateEligibility(originalProfile, simulatedProfile);
      setResults(data);
      setHasSimulated(true);
      toast.success("Simulation complete! Review your results below.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to run simulation");
    } finally {
      setLoading(false);
    }
  }

  const resetSimulation = () => {
    setSimulatedProfile(originalProfile);
    setResults({
      gained: [],
      lost: [],
      unchanged: [],
      summary: {
        summaryText: "",
        largestBenefit: null,
        mostImportantScheme: "",
        suggestedDocuments: [],
        nextAction: "",
      },
    });
    setHasSimulated(false);
    toast.success("Simulated profile reset to original parameters.");
  };

  const handlePresetTrigger = (presetType: string) => {
    setSimulatedProfile((prev: any) => {
      const updated = { ...prev };
      switch (presetType) {
        case "married":
          updated.maritalStatus = "Married";
          toast.success("Preset: Married status applied.");
          break;
        case "child":
          updated.children = String(Number(prev.children || "0") + 1);
          toast.success(`Preset: Dependents increased to ${updated.children} children.`);
          break;
        case "graduate":
          updated.education = "Graduate";
          updated.student = false;
          updated.employmentStatus = "Employed";
          toast.success("Preset: Graduated and employed applied.");
          break;
        case "farmer":
          updated.farmer = true;
          updated.occupation = "Farmer";
          toast.success("Preset: Agricultural farmer status applied.");
          break;
        case "unemployed":
          updated.occupation = "Unemployed";
          updated.employmentStatus = "Unemployed";
          updated.student = false;
          updated.businessOwner = false;
          toast.success("Preset: Unemployment status applied.");
          break;
        case "income_inc":
          updated.income = String(Number(prev.income || 0) + 150000);
          toast.success(`Preset: Income increased to ₹${Number(updated.income).toLocaleString()}.`);
          break;
        case "income_dec":
          updated.income = String(Math.max(0, Number(prev.income || 0) - 100000));
          toast.success(`Preset: Income decreased to ₹${Number(updated.income).toLocaleString()}.`);
          break;
        case "senior":
          updated.age = "60";
          toast.success("Preset: Age increased to 60 (Senior Citizen).");
          break;
        case "disabled":
          updated.disability = "Yes";
          toast.success("Preset: Disability status marked Yes.");
          break;
        case "move":
          updated.state = prev.state === "Delhi" ? "Uttar Pradesh" : "Delhi";
          toast.success(`Preset: Moved location to ${updated.state}.`);
          break;
        default:
          break;
      }
      return updated;
    });
  };

  // Export handlers
  const exportToPDF = async () => {
    const element = document.getElementById("simulation-report");
    if (!element) return;

    try {
      toast.loading("Generating PDF Report...", { id: "pdf-loader" });
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FAF8F3",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width
      const pageHeight = 297; // A4 height
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

      pdf.save("Setu_AI_Eligibility_Simulation_Report.pdf");
      toast.success("PDF Downloaded!", { id: "pdf-loader" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF.", { id: "pdf-loader" });
    }
  };

  const copyResultsText = () => {
    const { gained, lost, unchanged, summary } = results;
    let txt = `Setu AI Simulation Report\n`;
    txt += `===================================\n`;
    txt += `Summary: ${summary.summaryText || "No changes recorded."}\n\n`;
    txt += `Simulated Profile parameters:\n`;
    txt += `- Age: ${simulatedProfile.age} yrs\n`;
    txt += `- State: ${simulatedProfile.state}\n`;
    txt += `- Income: ₹${Number(simulatedProfile.income || 0).toLocaleString()}\n`;
    txt += `- Occupation: ${simulatedProfile.occupation}\n`;
    txt += `- Education: ${simulatedProfile.education}\n`;
    txt += `- Disability: ${simulatedProfile.disability}\n\n`;

    txt += `NEW ELIGIBLE SCHEMES (+${gained.length}):\n`;
    gained.forEach((s: any, idx: number) => {
      txt += `${idx + 1}. ${s.scheme_name} - ${s.reason}\n`;
      if (s.aiExplanation) txt += `   AI Explanation: ${s.aiExplanation}\n`;
    });
    txt += `\nLOST ELIGIBLE SCHEMES (-${lost.length}):\n`;
    lost.forEach((s: any, idx: number) => {
      txt += `${idx + 1}. ${s.scheme_name} - Reason: ${s.reason}\n`;
    });
    txt += `\nUNCHANGED SCHEMES (=${unchanged.length}):\n`;
    unchanged.forEach((s: any, idx: number) => {
      txt += `${idx + 1}. ${s.scheme_name}\n`;
    });

    navigator.clipboard.writeText(txt);
    toast.success("Results summary copied to clipboard!");
  };

  const shareSimulation = async () => {
    try {
      const text = `I just simulated future life events using Setu AI! If my profile changes to: Age ${
        simulatedProfile.age
      }, Income ₹${Number(simulatedProfile.income).toLocaleString()}, I become eligible for ${
        results.gained?.length || 0
      } new schemes worth thousands in benefits. Test yours today!`;
      if (navigator.share) {
        await navigator.share({
          title: "Setu AI Welfare Sandbox Simulation",
          text: text,
          url: window.location.href,
        });
      } else {
        copyResultsText();
      }
    } catch (e) {
      console.warn("Share API not supported or aborted:", e);
    }
  };

  // Compile visual analytics counts
  const afterCount = (results.unchanged?.length || 0) + (results.gained?.length || 0);
  const beforeCount = originalMatchesCount || (results.unchanged?.length || 0) + (results.lost?.length || 0);
  const gainedCount = results.gained?.length || 0;
  const lostCount = results.lost?.length || 0;

  // Chart category counts
  const categoriesList = [
    "Education",
    "Agriculture",
    "Health",
    "Women",
    "Employment",
    "Housing",
    "Pension",
  ];
  const allMatchesList = [...(results.unchanged || []), ...(results.gained || [])];

  const getCategoryMatchesCount = (catName: string) => {
    return allMatchesList.filter((scheme: any) => {
      const sc = (scheme.category || "").toLowerCase();
      const cn = catName.toLowerCase();
      if (cn === "agriculture") {
        return sc.includes("agri") || sc.includes("farm") || sc.includes("kisan") || sc.includes("crop");
      }
      if (cn === "health") {
        return sc.includes("health") || sc.includes("medical") || sc.includes("insur");
      }
      if (cn === "pension") {
        return sc.includes("pension") || sc.includes("senior") || sc.includes("old age");
      }
      return sc.includes(cn);
    }).length;
  };

  const maxCatCount = Math.max(...categoriesList.map((c) => getCategoryMatchesCount(c)), 1);

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-16 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Action */}
          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back
            </Button>
            <Badge variant="accent">Welfare Sandbox Simulator</Badge>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-extrabold text-[#0F172A] tracking-tight">
              AI Eligibility Simulator
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Explore future life situations and instantly discover how your government scheme eligibility changes.
            </p>
          </div>

          {/* Grid Layout: Sandbox Controls & Output Results */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            
            {/* LEFT SIDE: CONTROLS & PROFILE */}
            <div className="lg:col-span-5 space-y-6">
              {/* Select Family Member */}
              {familyMembers.length > 0 && (
                <Card className="border border-[#0F172A]/5 p-5 bg-white shadow-soft rounded-3xl space-y-3">
                  <Select
                    label="Select Family Member Profile to Simulate"
                    defaultValue="self"
                    onChange={(e) => handleSelectMember(e.target.value)}
                  >
                    <option value="self">Self Profile (My Saved Profile)</option>
                    {familyMembers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.relationship})
                      </option>
                    ))}
                  </Select>
                </Card>
              )}

              {/* Original Profile Summary Card */}
              <Reveal direction="right">
                <Card className="border border-[#0F172A]/5 p-6 shadow-premium relative bg-white overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <Badge variant="accent" size="sm">Using your saved profile</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <FaUserCircle className="text-slate-400 h-8 w-8" />
                    <div>
                      <h4 className="font-serif text-sm font-extrabold text-[#0F172A]">
                        {originalProfile.name || "Citizen Saved Profile"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Baseline Profile Reference
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3">
                    <p>Age: <span className="font-extrabold text-[#0F172A]">{originalProfile.age} yrs</span></p>
                    <p>State: <span className="font-extrabold text-[#0F172A]">{originalProfile.state}</span></p>
                    <p>Income: <span className="font-extrabold text-[#0F172A]">₹{Number(originalProfile.income || 0).toLocaleString()}</span></p>
                    <p>Occupation: <span className="font-extrabold text-[#0F172A]">{originalProfile.occupation}</span></p>
                    <p>Education: <span className="font-extrabold text-[#0F172A]">{originalProfile.education}</span></p>
                    <p>Disability: <span className="font-extrabold text-[#0F172A]">{originalProfile.disability}</span></p>
                  </div>
                </Card>
              </Reveal>

              {/* Scenario Builder sandbox */}
              <Card className="border border-[#0F172A]/5 p-6 shadow-premium bg-white space-y-6">
                <SectionHeader title="Create Simulation" />

                {/* Preset cards */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ⚡ Preset Quick Scenarios
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pb-1 pr-1 scrollbar-thin">
                    <button
                      onClick={() => handlePresetTrigger("married")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-pink-100 bg-pink-50/30 text-xs font-semibold text-pink-700 hover:bg-pink-50 transition cursor-pointer"
                    >
                      <FaRing className="text-pink-500 shrink-0" /> Married
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("child")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-100 bg-indigo-50/30 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                    >
                      <FaBaby className="text-indigo-500 shrink-0" /> Have Child
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("graduate")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-teal-100 bg-teal-50/30 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                    >
                      <FaGraduationCap className="text-teal-500 shrink-0" /> Graduate
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("farmer")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-green-100 bg-green-50/30 text-xs font-semibold text-green-700 hover:bg-green-50 transition cursor-pointer"
                    >
                      <FaTractor className="text-green-500 shrink-0" /> Farmer
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("unemployed")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 bg-red-50/30 text-xs font-semibold text-red-700 hover:bg-red-50 transition cursor-pointer"
                    >
                      <FaBriefcase className="text-red-500 shrink-0" /> Lose Job
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("income_inc")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-100 bg-emerald-50/30 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                    >
                      <FaArrowUp className="text-emerald-500 shrink-0" /> Income Increase
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("income_dec")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-100 bg-amber-50/30 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                    >
                      <FaArrowDown className="text-amber-500 shrink-0" /> Income Decrease
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("senior")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-100 bg-blue-50/30 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                    >
                      👴 Turn 60
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("disabled")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      ♿ Disabled
                    </button>
                    <button
                      onClick={() => handlePresetTrigger("move")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-100 bg-orange-50/30 text-xs font-semibold text-orange-700 hover:bg-orange-50 transition cursor-pointer"
                    >
                      🏠 Move State
                    </button>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  
                  {/* Income Slider + Number Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A]/70">
                      Hypothetical Income (₹ / year)
                    </label>
                    <div className="flex gap-4 items-center">
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="10000"
                        value={simulatedProfile.income}
                        onChange={(e) =>
                          setSimulatedProfile({ ...simulatedProfile, income: e.target.value })
                        }
                        className="flex-1 accent-[#14B8A6] cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        value={simulatedProfile.income}
                        onChange={(e) =>
                          setSimulatedProfile({ ...simulatedProfile, income: e.target.value })
                        }
                        className="w-28 rounded-xl border border-[#0F172A]/10 bg-[#FAF8F3]/50 px-3 py-1.5 text-xs font-bold text-[#0F172A] outline-hidden focus:ring-4 focus:ring-[#14B8A6]/20 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Age Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#0F172A]/70">
                        Hypothetical Age
                      </label>
                      <span className="text-xs font-bold text-[#14B8A6]">{simulatedProfile.age} years old</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="110"
                      value={simulatedProfile.age}
                      onChange={(e) =>
                        setSimulatedProfile({ ...simulatedProfile, age: e.target.value })
                      }
                      className="w-full accent-[#14B8A6] cursor-pointer"
                    />
                  </div>

                  <Select
                    label="Occupation"
                    value={simulatedProfile.occupation}
                    onChange={(e) =>
                      setSimulatedProfile({ ...simulatedProfile, occupation: e.target.value })
                    }
                  >
                    <option value="Student">Student</option>
                    <option value="Farmer">Farmer</option>
                    <option value="Woman">Woman</option>
                    <option value="Homemaker">Homemaker</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Private Employee">Private Employee</option>
                    <option value="Government Employee">Government Employee</option>
                    <option value="Business">Business</option>
                    <option value="Self Employed">Self Employed</option>
                    <option value="Labour">Labour</option>
                    <option value="Retired">Retired</option>
                    <option value="Other">Other</option>
                  </Select>

                  <Select
                    label="State applicability"
                    value={simulatedProfile.state}
                    onChange={(e) =>
                      setSimulatedProfile({ ...simulatedProfile, state: e.target.value })
                    }
                  >
                    {ALL_INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Education Level"
                    value={simulatedProfile.education}
                    onChange={(e) =>
                      setSimulatedProfile({ ...simulatedProfile, education: e.target.value })
                    }
                  >
                    <option value="School">School</option>
                    <option value="High School">High School</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Post Graduate">Post Graduate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Other">Other</option>
                  </Select>

                  <Select
                    label="Marital Status"
                    value={simulatedProfile.maritalStatus}
                    onChange={(e) =>
                      setSimulatedProfile({ ...simulatedProfile, maritalStatus: e.target.value })
                    }
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </Select>

                  {/* Stepper for Children */}
                  <div className="flex items-center justify-between border-b border-slate-100/50 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#0F172A]/70">
                      Number of Children
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSimulatedProfile({
                            ...simulatedProfile,
                            children: String(Math.max(0, Number(simulatedProfile.children || 0) - 1)),
                          })
                        }
                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"
                      >
                        <FaMinus size={10} />
                      </button>
                      <span className="text-sm font-extrabold w-6 text-center text-[#0F172A]">
                        {simulatedProfile.children || "0"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSimulatedProfile({
                            ...simulatedProfile,
                            children: String(Number(simulatedProfile.children || 0) + 1),
                          })
                        }
                        className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                  </div>

                  <Select
                    label="Employment Status"
                    value={simulatedProfile.employmentStatus}
                    onChange={(e) =>
                      setSimulatedProfile({ ...simulatedProfile, employmentStatus: e.target.value })
                    }
                  >
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                  </Select>

                  {/* Toggles */}
                  <ToggleSwitch
                    label="Disability Indicator"
                    checked={simulatedProfile.disability === "Yes"}
                    onChange={(val) =>
                      setSimulatedProfile({ ...simulatedProfile, disability: val ? "Yes" : "No" })
                    }
                  />

                  <ToggleSwitch
                    label="Engaged in Farming"
                    checked={simulatedProfile.farmer}
                    onChange={(val) => setSimulatedProfile({ ...simulatedProfile, farmer: val })}
                  />

                  <ToggleSwitch
                    label="Active Student Status"
                    checked={simulatedProfile.student}
                    onChange={(val) => setSimulatedProfile({ ...simulatedProfile, student: val })}
                  />

                  <ToggleSwitch
                    label="Business Owner / MSME"
                    checked={simulatedProfile.businessOwner}
                    onChange={(val) => setSimulatedProfile({ ...simulatedProfile, businessOwner: val })}
                  />

                </div>

                {/* Submit Actions */}
                <div className="flex gap-3 border-t border-slate-100 pt-6">
                  <Button onClick={resetSimulation} variant="secondary" className="flex-1">
                    <FaUndo className="mr-1.5" /> Reset
                  </Button>
                  <Button onClick={runSimulation} loading={loading} className="flex-1">
                    <FaPlay className="mr-1.5" /> Simulate
                  </Button>
                </div>
              </Card>

            </div>

            {/* RIGHT SIDE: RESULTS PRESENTATION */}
            <div className="lg:col-span-7 space-y-6">
              
              {!hasSimulated && !loading ? (
                <EmptyState
                  title="Welfare Sandbox Engine Ready"
                  description="Customize the hypothetical citizen parameters in the sandbox controls on the left, then click 'Simulate Eligibility' to calculate matching deltas."
                  icon={<FaInfoCircle className="h-8 w-8" />}
                />
              ) : loading ? (
                <div className="space-y-6 animate-pulse">
                  {/* Loading Skeletons */}
                  <Card className="p-6 bg-white border border-[#0F172A]/5 space-y-4">
                    <div className="h-4 bg-slate-200 rounded-sm w-1/3" />
                    <div className="h-8 bg-slate-200 rounded-sm w-3/4" />
                    <div className="h-12 bg-slate-200 rounded-sm w-full" />
                  </Card>
                  <Card className="p-6 bg-white border border-[#0F172A]/5 space-y-4">
                    <div className="h-4 bg-slate-200 rounded-sm w-1/2" />
                    <div className="h-20 bg-slate-200 rounded-sm w-full" />
                  </Card>
                </div>
              ) : (
                <div id="simulation-report" className="space-y-6">
                  
                  {/* EXPORT Sticky Control Bar */}
                  <Card className="border border-[#0F172A]/5 p-4 bg-white shadow-soft flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-ping" />
                      Simulation Rendered
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={copyResultsText}>
                        <FaCopy className="mr-1.5" /> Copy
                      </Button>
                      <Button size="sm" variant="secondary" onClick={shareSimulation}>
                        <FaShareAlt className="mr-1.5" /> Share
                      </Button>
                      <Button size="sm" onClick={exportToPDF}>
                        <FaDownload className="mr-1.5" /> PDF
                      </Button>
                    </div>
                  </Card>

                  {/* Summary Insights AI Card */}
                  <Card className="border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-6 rounded-2xl shadow-soft space-y-4">
                    <div className="space-y-2">
                      <Badge variant="accent">AI Simulation Analysis</Badge>
                      <p className="font-serif text-lg font-bold text-[#0F172A] leading-snug">
                        {results.summary?.summaryText}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#14B8A6]/10 text-xs font-semibold text-slate-700">
                      {results.summary?.largestBenefit && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Largest Benefit Unlocked</p>
                          <p className="text-sm font-extrabold text-[#0D9488]">{results.summary.largestBenefit.schemeName}</p>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">{results.summary.largestBenefit.benefitText}</p>
                        </div>
                      )}
                      {results.summary?.mostImportantScheme && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Most Important Scheme</p>
                          <p className="text-sm font-extrabold text-[#0F172A]">{results.summary.mostImportantScheme}</p>
                        </div>
                      )}
                    </div>

                    {results.summary?.suggestedDocuments?.length > 0 && (
                      <div className="pt-3 border-t border-[#14B8A6]/10 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Suggested Documents Checklist</p>
                        <div className="flex flex-wrap gap-1.5">
                          {results.summary.suggestedDocuments.map((doc: string) => (
                            <Badge key={doc} variant="secondary" size="sm">
                              ✓ {doc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#14B8A6]/10 text-xs text-slate-600 font-medium">
                      <span className="font-bold text-[#0F172A]">Recommended Next Step:</span>{" "}
                      {results.summary?.nextAction}
                    </div>
                  </Card>

                  {/* VISUAL ANALYTICS */}
                  <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium space-y-6">
                    <SectionHeader title="Simulation Metrics" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                      
                      {/* Metric 1: Counts baseline comparison bar chart */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
                          Matched Schemes Shift
                        </h4>
                        <div className="flex justify-around items-end h-36 pt-4 border-b border-slate-100">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-black text-slate-600">{beforeCount}</span>
                            <motion.div
                              className="w-12 bg-slate-200 rounded-t-lg"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(beforeCount * 12, 100)}px` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-1">Before</span>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-sm font-black text-[#14B8A6]">{afterCount}</span>
                            <motion.div
                              className="w-12 bg-[#14B8A6] rounded-t-lg shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.min(afterCount * 12, 100)}px` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0D9488] mt-1">After</span>
                          </div>
                        </div>
                      </div>

                      {/* Metric 2: Gained vs Lost progress block */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Deltas Breakdown
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span className="text-[#22C55E]">New Eligible: +{gainedCount}</span>
                            <span className="text-[#EF4444]">Removed: -{lostCount}</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                            <motion.div
                              className="bg-[#22C55E] h-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  gainedCount + lostCount > 0
                                    ? (gainedCount / (gainedCount + lostCount)) * 100
                                    : 0
                                }%`,
                              }}
                              transition={{ duration: 0.6 }}
                            />
                            <motion.div
                              className="bg-[#EF4444] h-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  gainedCount + lostCount > 0
                                    ? (lostCount / (gainedCount + lostCount)) * 100
                                    : 0
                                }%`,
                              }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold leading-normal">
                            Unlocks (green) vs restrictions (red) based on your updated parameters.
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Metric 3: Category distribution list */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Category Distribution (Simulated)
                      </h4>
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {categoriesList.map((cat) => {
                          const count = getCategoryMatchesCount(cat);
                          const pct = count > 0 ? (count / maxCatCount) * 100 : 0;
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>{cat}</span>
                                <span>{count} Schemes</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  className="bg-[#14B8A6] h-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6 }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>

                  {/* DELTAS RESULTS */}
                  <div className="space-y-8">
                    
                    {/* SECTION 1: NEW ELIGIBLE */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-[#22C55E]" /> Newly Eligible Schemes
                        </h3>
                        <Badge variant="success">+{results.gained?.length || 0} NEW</Badge>
                      </div>

                      {results.gained?.length === 0 ? (
                        <Card className="border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 font-semibold bg-white rounded-2xl">
                          No additional schemes qualified under these simulated changes.
                        </Card>
                      ) : (
                        <div className="space-y-4 pl-3 border-l-2 border-[#22C55E]/30">
                          {results.gained.map((s: any) => (
                            <Card key={s._id} className="border border-[#22C55E]/15 bg-white p-5 rounded-2xl shadow-soft hover:shadow-premium transition duration-150 space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    {s.category}
                                  </span>
                                  <h4 className="font-serif text-base font-bold text-[#0F172A] tracking-tight">
                                    {s.scheme_name}
                                  </h4>
                                </div>
                                <Badge variant="success">NEW</Badge>
                              </div>

                              {/* COMPARISON VIEW */}
                              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                                <span>Not Eligible</span>
                                <span>➔</span>
                                <span className="text-[#22C55E]">Eligible</span>
                              </div>

                              {/* Structural Reason */}
                              <div className="text-xs font-semibold text-slate-600 bg-emerald-50/20 border border-[#22C55E]/10 rounded-xl p-3">
                                <span className="font-extrabold text-[#0D9488] uppercase text-[9px] tracking-wider block mb-1">Qualifying Factor</span>
                                {s.reason}
                              </div>

                              {/* AI Explanation why it matches */}
                              {s.aiExplanation && (
                                <div className="bg-[#14B8A6]/5 border border-[#14B8A6]/10 rounded-xl p-4">
                                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] mb-1.5 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 bg-[#14B8A6] rounded-full" />
                                    AI Delta Analysis
                                  </h5>
                                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    {s.aiExplanation}
                                  </p>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: LOST ELIGIBILITY */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-[#EF4444]" /> Lost Eligibility
                        </h3>
                        <Badge variant="error">-{results.lost?.length || 0} REMOVED</Badge>
                      </div>

                      {results.lost?.length === 0 ? (
                        <Card className="border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 font-semibold bg-white rounded-2xl">
                          No previously qualified schemes were restricted under these changes.
                        </Card>
                      ) : (
                        <div className="space-y-4 pl-3 border-l-2 border-[#EF4444]/30">
                          {results.lost.map((s: any) => (
                            <Card key={s._id} className="border border-[#EF4444]/15 bg-white p-5 rounded-2xl shadow-soft hover:shadow-premium transition duration-150 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    {s.category}
                                  </span>
                                  <h4 className="font-serif text-base font-bold text-[#0F172A] tracking-tight">
                                    {s.scheme_name}
                                  </h4>
                                </div>
                                <Badge variant="error">REMOVED</Badge>
                              </div>

                              {/* COMPARISON VIEW */}
                              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                                <span className="text-[#22C55E]">Eligible</span>
                                <span>➔</span>
                                <span className="text-[#EF4444]">Not Eligible</span>
                              </div>

                              {/* Structural Reason */}
                              <div className="text-xs font-semibold text-slate-600 bg-red-50/20 border border-[#EF4444]/10 rounded-xl p-3">
                                <span className="font-extrabold text-[#EF4444] uppercase text-[9px] tracking-wider block mb-1">Ineligibility Factor</span>
                                {s.reason}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION 3: STILL ELIGIBLE */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-slate-400" /> Still Eligible Schemes
                        </h3>
                        <Badge variant="secondary">={results.unchanged?.length || 0} UNCHANGED</Badge>
                      </div>

                      {results.unchanged?.length === 0 ? (
                        <Card className="border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 font-semibold bg-white rounded-2xl">
                          No matches remained unchanged.
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {results.unchanged.map((s: any) => (
                            <Card key={s._id} className="border border-slate-100 bg-white p-4 rounded-xl shadow-soft">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                                {s.category}
                              </span>
                              <h4 className="font-serif text-sm font-bold text-[#0F172A] mt-0.5">
                                {s.scheme_name}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                                {s.summary_text || s.summary || "Parameters fit the baseline eligibility parameters."}
                              </p>
                              
                              {/* COMPARISON VIEW */}
                              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-[#0D9488] bg-[#14B8A6]/5 px-2 py-1 rounded-md w-fit border border-[#14B8A6]/10 mt-3">
                                <span>Eligible</span>
                                <span>➔</span>
                                <span>Eligible</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      </PageContainer>

      <Footer />
      <BottomBar />
    </main>
  );
}