import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaChartBar,
  FaFileAlt,
  FaUsers,
  FaShieldAlt,
  FaBullhorn,
  FaPlus,
  FaEdit,
  FaTrash,
  FaDownload,
  FaMapMarkedAlt,
  FaServer,
} from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import SectionHeader from "../components/ui/SectionHeader";
import {
  getAdminDashboardStats,
  getAdminAnalytics,
  getAdminUsersList,
  createAdminNotification,
  createSchemeAdmin,
  updateSchemeAdmin,
  deleteSchemeAdmin,
  getAdminReportsList,
  type AdminStats,
  type AdminAnalytics,
} from "../services/adminApi";
import { getMatches } from "../services/match";

import CorrectionQueue from "../components/admin/CorrectionQueue";
import PipelineManager from "../components/admin/PipelineManager";

export default function AdminPortal() {
  const navigate = useNavigate();

  // Navigation tabs: "dashboard" | "schemes" | "users" | "notifications" | "audit" | "corrections" | "pipeline"
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Fetch States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [, setReports] = useState<any[]>([]);
  const [, setLoading] = useState(false);

  // Scheme Form Modal States
  const [schemesList, setSchemesList] = useState<any[]>([]);
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<any>(null);
  const [schemeForm, setSchemeForm] = useState({
    scheme_name: "",
    benefits: "",
    required_documents: [] as string[],
    official_link: "",
    state: "",
    summary: "",
    editReason: "",
    verifiedSource: "",
  });

  // Notification Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    targetAudience: "All",
    targetValue: "",
  });

  // Audit Logs Mock
  const [auditLogs, setAuditLogs] = useState([
    { admin: "Super Admin", action: "UPDATE_SCHEME", target: "PM Kisan", ip: "192.168.1.1", time: "2026-08-04 12:45" },
    { admin: "Super Admin", action: "CREATE_BROADCAST", target: "Deadline Extended", ip: "192.168.1.1", time: "2026-08-04 11:20" },
    { admin: "Moderator Panel", action: "EXPORT_REPORTS", target: "State Penetration PDF", ip: "10.0.0.12", time: "2026-08-04 10:05" },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await getAdminDashboardStats();
      setStats(statsRes.stats);

      const analyticsRes = await getAdminAnalytics();
      setAnalytics(analyticsRes.analytics);

      const usersRes = await getAdminUsersList();
      setUsers(usersRes.users);

      const reportsRes = await getAdminReportsList();
      setReports(reportsRes.reports);

      // Fetch schemes from matches engine (using guest empty criteria fallback to list general catalog)
      const matchesRes = await getMatches({
        age: "25",
        state: "Delhi",
        occupation: "Other",
        income: "50000",
      });
      setSchemesList(matchesRes.matches || []);
    } catch (e: any) {
      console.error(e);
      // Access Denied: redirect back to Dashboard
      toast.error(e.message || "Unauthorized: Access Denied. Redirecting to Dashboard.");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingScheme) {
        await updateSchemeAdmin(editingScheme._id, schemeForm);
        toast.success("Scheme criteria updated and version history logged!");
      } else {
        await createSchemeAdmin(schemeForm);
        toast.success("New government scheme registered!");
      }
      setSchemeModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || "Failed to register scheme.");
    }
  };

  const handleDeleteScheme = async (id: string) => {
    if (!confirm("Are you sure you want to delete/archive this scheme?")) return;
    try {
      await deleteSchemeAdmin(id);
      toast.success("Scheme archived.");
      loadDashboardData();
    } catch (err) {
      toast.error("Failed to delete scheme.");
    }
  };

  const handleOpenEditScheme = (scheme: any) => {
    setEditingScheme(scheme);
    setSchemeForm({
      scheme_name: scheme.scheme_name,
      benefits: scheme.benefits || "",
      required_documents: scheme.required_documents || [],
      official_link: scheme.official_link || "",
      state: scheme.state || "All States",
      summary: scheme.summary || "",
      editReason: "",
      verifiedSource: "",
    });
    setSchemeModalOpen(true);
  };

  const handleOpenCreateScheme = () => {
    setEditingScheme(null);
    setSchemeForm({
      scheme_name: "",
      benefits: "",
      required_documents: [],
      official_link: "",
      state: "",
      summary: "",
      editReason: "",
      verifiedSource: "",
    });
    setSchemeModalOpen(true);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminNotification(broadcastForm);
      toast.success("Notification broadcast dispatched!");
      setBroadcastForm({ title: "", message: "", targetAudience: "All", targetValue: "" });
      
      // Append to mock logs
      setAuditLogs((prev) => [
        {
          admin: "Super Admin",
          action: "CREATE_BROADCAST",
          target: broadcastForm.title,
          ip: "192.168.1.1",
          time: new Date().toISOString().replace("T", " ").substring(0, 16),
        },
        ...prev,
      ]);
    } catch (err) {
      toast.error("Failed to send broadcast.");
    }
  };

  const triggerExport = (reportName: string) => {
    toast.loading(`Downloading ${reportName}...`, { id: "report-loader" });
    setTimeout(() => {
      toast.success(`${reportName} downloaded successfully!`, { id: "report-loader" });
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top Admin banner navigation */}
          <div className="flex justify-between items-center bg-[#0F172A] p-6 rounded-3xl text-white">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-[#14B8A6] uppercase tracking-widest block">ADMIN PORTAL</span>
              <h2 className="font-serif text-2xl font-extrabold tracking-tight">Government Welfare Console</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">Admin Case Editor</p>
                <p className="text-[10px] text-slate-400 font-semibold">National Welfare Registry</p>
              </div>
              <Badge variant="accent">Super Admin Lock</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            
            {/* SIDEBAR NAVIGATION TABS */}
            <div className="lg:col-span-3 space-y-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full p-3 text-left rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  activeTab === "dashboard"
                    ? "bg-[#14B8A6]/15 text-[#0F172A]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                <FaChartBar /> Overview Dashboard
              </button>

              <button
                onClick={() => setActiveTab("schemes")}
                className={`w-full p-3 text-left rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  activeTab === "schemes"
                    ? "bg-[#14B8A6]/15 text-[#0F172A]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                <FaFileAlt /> Schemes Management
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`w-full p-3 text-left rounded-2xl text-xs font-bold transition flex items-center gap-3 ${
                  activeTab === "users"
                    ? "bg-[#14B8A6]/15 text-[#0F172A]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                <FaUsers /> Citizen Database
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "notifications"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <FaBullhorn className="inline mr-3 text-lg" /> Broadcasts
              </button>
              <button
                onClick={() => setActiveTab("corrections")}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "corrections"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <FaShieldAlt className="inline mr-3 text-lg" /> Corrections
              </button>
              <button
                onClick={() => setActiveTab("audit")}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "audit"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <FaShieldAlt className="inline mr-3 text-lg" /> System Audit Logs
              </button>
              <button
                onClick={() => setActiveTab("pipeline")}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "pipeline"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <FaServer className="inline mr-3 text-lg" /> Data Pipeline
              </button>
            </div>

            {/* MAIN PORTAL WORKSPACE CONTAINER */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {activeTab === "dashboard" && stats && analytics && (
                <div className="space-y-6">
                  
                  {/* Summary key metrics counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Citizens</span>
                      <p className="font-serif text-2xl font-extrabold text-[#0F172A]">{stats.totalUsers}</p>
                    </Card>
                    <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Monthly</span>
                      <p className="font-serif text-2xl font-extrabold text-[#0F172A]">{stats.activeUsers}</p>
                    </Card>
                    <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Roadmaps Started</span>
                      <p className="font-serif text-2xl font-extrabold text-[#0F172A]">{stats.applicationsGenerated}</p>
                    </Card>
                    <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Docs Verification Rate</span>
                      <p className="font-serif text-2xl font-extrabold text-[#0F172A]">{stats.verificationRate}%</p>
                    </Card>
                  </div>

                  {/* AI Aggregated insights banner */}
                  <Card className="border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-5 rounded-3xl space-y-3">
                    <span className="text-[10px] font-black uppercase text-[#0D9488] tracking-widest block">AI Welfare Insights</span>
                    <ul className="list-disc pl-4 text-xs text-slate-600 font-semibold space-y-1">
                      {analytics.aiInsights.map((ins, idx) => (
                        <li key={idx}>{ins}</li>
                      ))}
                    </ul>
                  </Card>

                  {/* Charts & Tables lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Top Matched Schemes Chart */}
                    <Card className="border border-slate-100 p-5 bg-white shadow-premium rounded-3xl space-y-4">
                      <SectionHeader title="Top Matched Schemes" />
                      <div className="space-y-3">
                        {analytics.mostViewedSchemes.map((item, idx) => (
                          <div key={idx} className="space-y-1 text-xs font-bold text-slate-600">
                            <div className="flex justify-between">
                              <span>{item.name}</span>
                              <span>{item.count} matched</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#14B8A6] rounded-full" style={{ width: `${(item.count/420)*100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Missing Document checks */}
                    <Card className="border border-slate-100 p-5 bg-white shadow-premium rounded-3xl space-y-4">
                      <SectionHeader title="Most Missing Documents" />
                      <div className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                        {analytics.missingDocsList.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex justify-between">
                            <span>{item.docName}</span>
                            <span className="text-amber-600">{item.rate}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                  </div>

                  {/* Heatmap state awareness stats */}
                  <Card className="border border-slate-100 p-5 bg-white shadow-premium rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                      <FaMapMarkedAlt className="text-[#14B8A6]" />
                      <SectionHeader title="State Penetration Heatmap" />
                    </div>
                    <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs font-semibold">
                      <div className="bg-slate-50 p-3 grid grid-cols-2 text-slate-400 font-bold uppercase tracking-wider">
                        <span>State</span>
                        <span>Registered Citizens</span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {analytics.topStates.map((st, idx) => (
                          <div key={idx} className="p-3 grid grid-cols-2 text-slate-600">
                            <span>{st.state}</span>
                            <span>{st.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                </div>
              )}

              {/* TAB 2: SCHEMES CRUD MANAGEMENT */}
              {activeTab === "schemes" && (
                <div className="space-y-6">
                  
                  <div className="flex justify-between items-center">
                    <SectionHeader title="Government Schemes Directory" />
                    <Button size="sm" onClick={handleOpenCreateScheme}>
                      <FaPlus className="mr-1.5" /> Register Scheme
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {schemesList.map((sch) => (
                      <Card key={sch._id} className="border border-slate-100 p-5 bg-white shadow-soft rounded-3xl flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="font-serif text-sm font-extrabold text-[#0F172A]">
                            {sch.scheme_name}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold">Benefits: {sch.benefits || "N/A"}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">Scope: {sch.state || "All States"}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditScheme(sch)}
                            className="p-2 border border-slate-100 hover:border-[#14B8A6] rounded-xl text-slate-500 hover:text-[#14B8A6] transition cursor-pointer"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteScheme(sch._id)}
                            className="p-2 border border-slate-100 hover:border-rose-300 rounded-xl text-slate-500 hover:text-rose-500 transition cursor-pointer"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 3: CITIZEN DATABASE */}
              {activeTab === "users" && (
                <div className="space-y-6">
                  <SectionHeader title="Citizen Database Registry" />
                  
                  <div className="border border-slate-100 bg-white rounded-3xl shadow-soft overflow-hidden text-xs font-semibold">
                    <div className="bg-slate-50 p-3.5 grid grid-cols-4 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <span>Name</span>
                      <span>Demographics</span>
                      <span>Location</span>
                      <span>Category</span>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                      {users.map((u) => (
                        <div key={u._id} className="p-3.5 grid grid-cols-4 text-slate-600 hover:bg-slate-50/50">
                          <span className="font-bold text-[#0F172A]">{u.name}</span>
                          <span className="text-[10px]">{u.gender}, {u.age} yrs</span>
                          <span className="text-[10px]">{u.district}, {u.state}</span>
                          <span>
                            <Badge variant={u.occupation === "Farmer" ? "success" : "accent"} size="sm">
                              {u.occupation || "General"}
                            </Badge>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BROADCAST NOTIFICATION CENTER */}
              {activeTab === "notifications" && (
                <Card className="border border-slate-100 p-6 bg-white shadow-premium rounded-3xl space-y-6">
                  <SectionHeader title="Dispatch Welfare Broadcast Announcement" />
                  
                  <form onSubmit={handleSendBroadcast} className="space-y-4">
                    <Input
                      label="Announcement Title"
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                      required
                      placeholder="e.g. Income Threshold Guidelines Extended"
                    />

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        Message Content
                      </label>
                      <textarea
                        value={broadcastForm.message}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                        required
                        rows={4}
                        placeholder="Provide details about criteria modifications, extended dates, or mandatory document certifications..."
                        className="w-full px-4 py-3 text-xs bg-[#FAF8F3] border border-slate-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] font-medium text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        label="Target Audience Scope"
                        value={broadcastForm.targetAudience}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                      >
                        <option value="All">All Registered Citizens</option>
                        <option value="State">By State Location</option>
                        <option value="Category">By Occupation/Farmer Category</option>
                      </Select>

                      {broadcastForm.targetAudience !== "All" && (
                        <Input
                          label="Audience Scope Value"
                          value={broadcastForm.targetValue}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, targetValue: e.target.value })}
                          required
                          placeholder="e.g. Uttar Pradesh or Farmer"
                        />
                      )}
                    </div>

                    <div className="pt-2">
                      <Button type="submit" className="w-full">
                        Dispatch Broadcast
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* CORRECTIONS TAB */}
              {activeTab === "corrections" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <SectionHeader title="User Correction Reports" className="!mb-0" />
                  </div>
                  <CorrectionQueue />
                </div>
              )}

              {/* AUDIT TAB */}
              {activeTab === "audit" && (
                <div className="space-y-6">
                  
                  <div className="flex justify-between items-center">
                    <SectionHeader title="System Auditing Trails" />
                    
                    {/* Expose Excel/CSV reports downloads */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => triggerExport("Welfare_Penetration_Report.csv")}>
                        <FaDownload className="mr-1.5" /> CSV Report
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => triggerExport("CSC_Tehsil_Activity_Log.pdf")}>
                        <FaDownload className="mr-1.5" /> PDF Log
                      </Button>
                    </div>
                  </div>

                  <div className="border border-slate-100 bg-white rounded-3xl shadow-soft overflow-hidden text-xs font-semibold">
                    <div className="bg-slate-50 p-3.5 grid grid-cols-4 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <span>Administrator</span>
                      <span>Action Logged</span>
                      <span>Target Node</span>
                      <span>Timestamp / IP</span>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                      {auditLogs.map((log, idx) => (
                        <div key={idx} className="p-3.5 grid grid-cols-4 text-slate-600">
                          <span className="font-bold text-[#0F172A]">{log.admin}</span>
                          <span className="text-[10px]">{log.action}</span>
                          <span className="text-[10px] truncate">{log.target}</span>
                          <div className="text-[9px] text-slate-400 leading-snug">
                            <p>{log.time}</p>
                            <p>IP: {log.ip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PIPELINE TAB */}
              {activeTab === "pipeline" && (
                <div className="space-y-6">
                  <SectionHeader title="Data Pipeline Integration" />
                  <PipelineManager />
                </div>
              )}

            </div>

          </div>

        </div>
      </PageContainer>

      {/* CRUD Modal overlay popup */}
      {schemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white border border-slate-100 shadow-premium p-6 rounded-3xl space-y-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setSchemeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-extrabold text-sm"
            >
              ✕
            </button>

            <h3 className="font-serif text-lg font-extrabold text-[#0F172A]">
              {editingScheme ? "Modify Scheme Criteria" : "Register Government Scheme"}
            </h3>

            <form onSubmit={handleSaveScheme} className="space-y-4">
              <Input
                label="Scheme Name"
                value={schemeForm.scheme_name}
                onChange={(e) => setSchemeForm({ ...schemeForm, scheme_name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Benefits Summary"
                  value={schemeForm.benefits}
                  onChange={(e) => setSchemeForm({ ...schemeForm, benefits: e.target.value })}
                  required
                  placeholder="e.g. ₹6,000 / year"
                />
                
                <Input
                  label="State Scope"
                  value={schemeForm.state}
                  onChange={(e) => setSchemeForm({ ...schemeForm, state: e.target.value })}
                  placeholder="e.g. Delhi or Uttar Pradesh"
                />
              </div>

              <Input
                label="Official Portal Link"
                value={schemeForm.official_link}
                onChange={(e) => setSchemeForm({ ...schemeForm, official_link: e.target.value })}
                placeholder="https://india.gov.in"
              />

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Eligibility Rules & Target Summary
                </label>
                <textarea
                  value={schemeForm.summary}
                  onChange={(e) => setSchemeForm({ ...schemeForm, summary: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 text-xs bg-[#FAF8F3] border border-slate-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] font-medium text-slate-800"
                />
              </div>

              {editingScheme && (
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
                  <span className="text-[8px] font-black uppercase text-amber-700 tracking-wider block">Welfare Version Control Logs</span>
                  
                  <Input
                    label="Edit Reason Description (Mandatory)"
                    value={schemeForm.editReason}
                    onChange={(e) => setSchemeForm({ ...schemeForm, editReason: e.target.value })}
                    required
                    placeholder="e.g. Income limit threshold increased to 1.8L"
                  />

                  <Input
                    label="Verified Notification Source (Mandatory)"
                    value={schemeForm.verifiedSource}
                    onChange={(e) => setSchemeForm({ ...schemeForm, verifiedSource: e.target.value })}
                    required
                    placeholder="e.g. Ministry Notification No. 129/A"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSchemeModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Footer />
      <BottomBar />
    </main>
  );
}
