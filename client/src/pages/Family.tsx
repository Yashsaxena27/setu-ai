import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  FaArrowLeft,
  FaUserPlus,
  FaTrash,
  FaEdit,
  FaRobot,
  FaCopy,
  FaDownload,
  FaFileAlt,
} from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import {
  getFamilyProfile,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getHouseholdAnalysis,
  type FamilyMemberRecord,
  type HouseholdOverview,
  type HouseholdAnalysisRecord,
} from "../services/familyApi";

export default function Family() {
  const navigate = useNavigate();

  // States
  const [members, setMembers] = useState<FamilyMemberRecord[]>([]);
  const [overview, setOverview] = useState<HouseholdOverview | null>(null);
  const [analysis, setAnalysis] = useState<HouseholdAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formGender, setFormGender] = useState("Male");
  const [formRelationship, setFormRelationship] = useState("Daughter");
  const [formOccupation, setFormOccupation] = useState("Student");
  const [formIncome, setFormIncome] = useState("");
  const [formEducation, setFormEducation] = useState("High School");
  const [formState, setFormState] = useState("Uttar Pradesh");
  const [formDisability, setFormDisability] = useState(false);
  const [formFarmer, setFormFarmer] = useState(false);
  const [formStudent, setFormStudent] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getFamilyProfile();
      setMembers(res.members);
      setOverview(res.overview);

      const analRes = await getHouseholdAnalysis();
      setAnalysis(analRes.analysis);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load family profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormAge("");
    setFormGender("Male");
    setFormRelationship("Son");
    setFormOccupation("Student");
    setFormIncome("");
    setFormEducation("High School");
    setFormState("Uttar Pradesh");
    setFormDisability(false);
    setFormFarmer(false);
    setFormStudent(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (m: FamilyMemberRecord) => {
    setEditingId(m._id);
    setFormName(m.name);
    setFormAge(String(m.age));
    setFormGender(m.gender);
    setFormRelationship(m.relationship);
    setFormOccupation(m.occupation || "Other");
    setFormIncome(String(m.income));
    setFormEducation(m.education || "None");
    setFormState(m.state);
    setFormDisability(m.disability);
    setFormFarmer(m.farmer);
    setFormStudent(m.studentStatus);
    setModalOpen(true);
  };

  const handleCopyUserProfile = () => {
    // Fills form with user profile values cached in local storage
    const cached = localStorage.getItem("userProfile");
    if (cached) {
      const p = JSON.parse(cached);
      setFormName(p.name || "Self Profile");
      setFormAge(String(p.age || 30));
      setFormGender(p.gender || "Male");
      setFormRelationship("Other");
      setFormOccupation(p.occupation || "Other");
      setFormIncome(String(p.income || 150000));
      setFormEducation(p.education || "None");
      setFormState(p.state || "Uttar Pradesh");
      setFormDisability(p.disability || false);
      setFormFarmer(p.farmer || false);
      setFormStudent(p.studentStatus || false);
      toast.success("Profile values copied!");
    } else {
      toast.error("No active user profile cached in settings yet.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this family member?")) return;
    try {
      toast.loading("Removing member profile...", { id: "del-mem" });
      await deleteFamilyMember(id);
      toast.success("Family member removed!", { id: "del-mem" });
      loadData();
    } catch (e) {
      toast.error("Failed to remove member.", { id: "del-mem" });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAge || !formIncome) {
      toast.error("Please fill in name, age, and income details.");
      return;
    }

    const payload = {
      name: formName,
      age: parseInt(formAge),
      gender: formGender,
      relationship: formRelationship as any,
      occupation: formOccupation,
      income: parseInt(formIncome),
      education: formEducation,
      state: formState,
      disability: formDisability,
      farmer: formFarmer,
      studentStatus: formStudent,
    };

    try {
      toast.loading("Saving family member details...", { id: "save-mem" });
      if (editingId) {
        await updateFamilyMember(editingId, payload);
      } else {
        await addFamilyMember(payload);
      }
      toast.success("Member saved successfully!", { id: "save-mem" });
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save family member.", { id: "save-mem" });
    }
  };

  // Export report PDF
  const handleDownloadPDF = async () => {
    const el = document.getElementById("family-report");
    if (!el) return;

    try {
      toast.loading("Generating Household Report PDF...", { id: "pdf-fam" });
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

      pdf.save(`Setu_AI_Household_Report.pdf`);
      toast.success("Household PDF Report downloaded!", { id: "pdf-fam" });
    } catch (e) {
      console.error(e);
      toast.error("Failed to create PDF report.", { id: "pdf-fam" });
    }
  };

  const handleCopySummary = () => {
    if (!analysis) return;
    let txt = `📍 Setu AI - Household Intelligence Report\n\n`;
    txt += `Family Members count: ${members.length}\n`;
    txt += `Combined Welfare Benefits: ₹${analysis.combined_benefits.toLocaleString("en-IN")}\n`;
    txt += `Household Success Score: ${analysis.success_score}%\n\n`;
    txt += `🎯 AI Insights:\n`;
    analysis.insights.forEach((ins) => {
      txt += `- ${ins}\n`;
    });

    navigator.clipboard.writeText(txt);
    toast.success("Household summary copied!");
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />

      <PageContainer>
        <div id="family-report" className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Action row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Dashboard
            </Button>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="secondary" onClick={handleCopySummary} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-slate-500">
                <FaCopy /> Copy Report
              </Button>
              <Button variant="secondary" onClick={handleDownloadPDF} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-slate-500">
                <FaDownload /> PDF Report
              </Button>
              <Button onClick={handleOpenAdd} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5">
                <FaUserPlus /> Add Family Member
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Family Profile & Household Intelligence
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Analyze the entire household together to claim combined welfare packages, identify conflicts, and maximize benefits.
            </p>
          </div>

          {/* HOUSEHOLD OVERVIEW METRICS CARD */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Family Members</span>
                <span className="text-2xl font-black text-slate-800">{overview.totalMembers}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Eligible Schemes</span>
                <span className="text-2xl font-black text-indigo-600">{overview.eligibleSchemes}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Combined Benefits</span>
                <span className="text-xl font-black text-emerald-600">₹{overview.combinedBenefits.toLocaleString("en-IN")}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Applications Ready</span>
                <span className="text-2xl font-black text-[#14B8A6]">{overview.applicationsReady}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Docs Pending</span>
                <span className="text-2xl font-black text-rose-500">{overview.pendingDocuments}</span>
              </Card>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              <Card className="h-44 bg-white border border-slate-100"><div className="h-full bg-slate-100 rounded-xl" /></Card>
              <Card className="h-44 bg-white border border-slate-100"><div className="h-full bg-slate-100 rounded-xl" /></Card>
              <Card className="h-44 bg-white border border-slate-100"><div className="h-full bg-slate-100 rounded-xl" /></Card>
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              title="Your Household is Empty"
              description="Register your grandfather, students daughters, or farmers dependents to evaluate household welfares."
              action={<Button onClick={handleOpenAdd}>Add First Member</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
              
              {/* LEFT SIDE: FAMILY MEMBERS GRID */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {members.map((member) => {
                    const mAnalysis = analysis?.memberAnalyses?.find((ma) => ma.member_id === member._id);
                    
                    return (
                      <Card
                        key={member._id}
                        className="border border-[#0F172A]/5 p-5 hover:shadow-premium transition bg-white shadow-soft rounded-3xl space-y-4"
                      >
                        {/* Member Header */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <h3 className="font-serif text-base font-bold text-[#0F172A]">
                              {member.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge variant="accent" size="sm">{member.relationship}</Badge>
                              <span className="text-[10px] text-slate-400 font-bold">{member.age} yrs • {member.gender}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 transition"
                              title="Edit Member"
                            >
                              <FaEdit size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(member._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50 transition"
                              title="Delete Member"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Member Stats details */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Occupation</span>
                            <span className="text-slate-800 font-extrabold">{member.occupation || "Student"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Income (Annual)</span>
                            <span className="text-slate-800 font-extrabold">₹{member.income.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Match overview indicators */}
                        {mAnalysis && (
                          <div className="flex justify-between items-center text-xs pt-1">
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Matched Schemes</span>
                              <span className="font-extrabold text-indigo-600">{mAnalysis.schemesCount} Schemes</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Success score</span>
                              <span className="font-extrabold text-[#14B8A6]">{mAnalysis.success_score}%</span>
                            </div>
                          </div>
                        )}

                      </Card>
                    );
                  })}
                </div>

              </div>

              {/* RIGHT SIDE: HOUSEHOLD AI ANALYSIS INSIGHTS */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* AI Insights panel */}
                {analysis && (
                  <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium rounded-3xl space-y-4">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-[#14B8A6] flex items-center gap-1.5">
                      <FaRobot className="text-base" /> Household AI Analyzer
                    </h4>
                    
                    <div className="space-y-4 pt-2">
                      {analysis.insights.map((insight, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-slate-600 leading-relaxed">
                          <span className="h-1.5 w-1.5 bg-[#14B8A6] rounded-full mt-1.5 flex-shrink-0" />
                          <p>{insight}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Combined Benefits Value</span>
                      <span className="font-black text-emerald-600 text-sm">
                        ₹{analysis.combined_benefits.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </Card>
                )}

                {/* Shared Household Document center */}
                <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium rounded-3xl space-y-4">
                  <SectionHeader title="Household Document Center" />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5"><FaFileAlt className="text-indigo-500" /> Aadhaar card</span>
                      <span className="text-emerald-500 text-[10px]">Verified</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5"><FaFileAlt className="text-indigo-500" /> Ration Card (Household)</span>
                      <span className="text-amber-500 text-[10px]">Shared</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5"><FaFileAlt className="text-indigo-500" /> Income Certificates</span>
                      <span className="text-rose-500 text-[10px]">Missing 2</span>
                    </div>
                  </div>
                </Card>

                {/* Unified Roadmap timeline */}
                <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium rounded-3xl space-y-4">
                  <SectionHeader title="Household Roadmap Progress" />
                  <div className="relative pl-5 border-l border-slate-100 ml-2.5 space-y-4 text-xs font-semibold">
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-4 w-4 bg-[#22C55E] border border-white rounded-full" />
                      <p className="text-slate-800 font-extrabold">Father Application</p>
                      <p className="text-[10px] text-slate-400 font-bold">Draft Generated</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-4 w-4 bg-[#F59E0B] border border-white rounded-full" />
                      <p className="text-slate-800 font-extrabold">Daughter Scholarship</p>
                      <p className="text-[10px] text-slate-400 font-bold">Pending documents check</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-4 w-4 bg-slate-200 border border-white rounded-full" />
                      <p className="text-slate-400">Grandfather Pension</p>
                      <p className="text-[10px] text-slate-300">Locked: Profile complete</p>
                    </div>
                  </div>
                </Card>

              </div>

            </div>
          )}

        </div>
      </PageContainer>

      {/* ADD / EDIT FAMILY MEMBER MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#0F172A]/10 rounded-3xl p-6 max-w-lg w-full shadow-premium max-h-[85vh] overflow-y-auto no-scrollbar space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-lg font-bold text-[#0F172A]">
                  {editingId ? "Edit Family Member" : "Add Family Member"}
                </h3>
                <Button size="sm" variant="secondary" onClick={handleCopyUserProfile}>
                  Copy User Profile Settings
                </Button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                  />
                  <Input
                    label="Age"
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="e.g. 52"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Gender"
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>

                  <Select
                    label="Relationship"
                    value={formRelationship}
                    onChange={(e) => setFormRelationship(e.target.value)}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Husband">Husband</option>
                    <option value="Wife">Wife</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Dependent">Dependent</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Occupation"
                    value={formOccupation}
                    onChange={(e) => setFormOccupation(e.target.value)}
                    placeholder="e.g. Farmer, Student"
                  />
                  <Input
                    label="Annual Income (₹)"
                    type="number"
                    value={formIncome}
                    onChange={(e) => setFormIncome(e.target.value)}
                    placeholder="e.g. 120000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Education Level"
                    value={formEducation}
                    onChange={(e) => setFormEducation(e.target.value)}
                    placeholder="e.g. High School, Graduate"
                  />
                  <Input
                    label="Residing State"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="e.g. Uttar Pradesh"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formDisability}
                      onChange={(e) => setFormDisability(e.target.checked)}
                      className="h-4 w-4 text-[#14B8A6] focus:ring-[#14B8A6]/20 rounded border-slate-300 cursor-pointer"
                    />
                    <span>Has Disability</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formFarmer}
                      onChange={(e) => setFormFarmer(e.target.checked)}
                      className="h-4 w-4 text-[#14B8A6] focus:ring-[#14B8A6]/20 rounded border-slate-300 cursor-pointer"
                    />
                    <span>Is Farmer</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formStudent}
                      onChange={(e) => setFormStudent(e.target.checked)}
                      className="h-4 w-4 text-[#14B8A6] focus:ring-[#14B8A6]/20 rounded border-slate-300 cursor-pointer"
                    />
                    <span>Is Active Student</span>
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <Button variant="secondary" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingId ? "Update Member" : "Save Member"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      <BottomBar />
    </main>
  );
}
