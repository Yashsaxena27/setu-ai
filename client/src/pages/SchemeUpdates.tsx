import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaSearch,
  FaPlay,
  FaCopy,
  FaShareAlt,
  FaExternalLinkAlt,
  FaUserCheck,
} from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import {
  getUpdatesFeed,
  getMyImpact,
  triggerChangeCheck,
  type SchemeUpdateRecord,
  type ImpactDashboard,
} from "../services/schemeUpdatesApi";

export default function SchemeUpdates() {
  const navigate = useNavigate();

  // States
  const [updates, setUpdates] = useState<SchemeUpdateRecord[]>([]);
  const [impact, setImpact] = useState<ImpactDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Load feed and impact dashboard
  useEffect(() => {
    loadUpdates();
    loadImpactMetrics();
  }, [activeFilter]);

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const res = await getUpdatesFeed(activeFilter);
      setUpdates(res.updates);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load scheme updates feed.");
    } finally {
      setLoading(false);
    }
  };

  const loadImpactMetrics = async () => {
    try {
      const res = await getMyImpact();
      setImpact(res.dashboard);
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate change check
  const handleTriggerSimulation = async () => {
    setSimulating(true);
    try {
      toast.loading("Simulating government portal scrape...", { id: "sim-scrape" });
      const res = await triggerChangeCheck();
      toast.success(res.message, { id: "sim-scrape" });
      
      // Reload feed and impact metrics
      loadUpdates();
      loadImpactMetrics();
    } catch (e: any) {
      toast.error(e.message || "Failed to trigger change simulation.", { id: "sim-scrape" });
    } finally {
      setSimulating(false);
    }
  };

  const handleCopySummary = (u: SchemeUpdateRecord) => {
    let txt = `Setu AI - Government Scheme Update\n`;
    txt += `Scheme: ${u.schemeName}\n`;
    txt += `Update: ${u.change_type} (v${u.version_number})\n`;
    txt += `Impact Check: ${u.impact}\n`;
    txt += `Source: ${u.verified_source || "Official Notification"}\n`;
    
    navigator.clipboard.writeText(txt);
    toast.success("Change summary copied!");
  };

  const filteredUpdates = updates.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.schemeName.toLowerCase().includes(q) ||
      u.change_type.toLowerCase().includes(q) ||
      u.impact.toLowerCase().includes(q)
    );
  });

  const getImportanceBadge = (importance: string) => {
    if (importance === "High") {
      return <Badge variant="error" size="sm">Critical</Badge>;
    }
    return <Badge variant="warning" size="sm">Standard</Badge>;
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top header navigation row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Dashboard
            </Button>

            <Button
              onClick={handleTriggerSimulation}
              disabled={simulating}
              className="flex items-center gap-1.5"
            >
              <FaPlay className="h-3 w-3" /> Simulate Gov Change Scrape
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-extrabold text-[#0F172A] tracking-tight">
              AI Scheme Change Tracker
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Intelligent monitoring of welfare policy parameters, benefit caps, and document checklist changes.
            </p>
          </div>

          {/* MY IMPACT DASHBOARD WIDGET */}
          {impact && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">New Eligible</span>
                <span className="text-2xl font-black text-emerald-500">{impact.newEligibleSchemes}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Removed Matches</span>
                <span className="text-2xl font-black text-rose-500">{impact.removedSchemes}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Benefits Increased</span>
                <span className="text-2xl font-black text-indigo-500">{impact.benefitIncreases}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Docs Changes</span>
                <span className="text-2xl font-black text-amber-500">{impact.documentsChanged}</span>
              </Card>

              <Card className="border border-slate-100 p-4 bg-white shadow-soft rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Deadlines</span>
                <span className="text-2xl font-black text-slate-800">{impact.upcomingDeadlines}</span>
              </Card>
            </div>
          )}

          {/* SEARCH & FILTER TABS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              {[
                { id: "all", label: "All Updates" },
                { id: "mine", label: "My Schemes" },
                { id: "critical", label: "Critical" },
                { id: "benefits", label: "Benefit Hikes" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                    activeFilter === tab.id
                      ? "bg-white text-[#0F172A] shadow-soft"
                      : "text-slate-500 hover:text-[#0F172A]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FaSearch size={12} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search updates feed..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] font-medium"
              />
            </div>

          </div>

          {/* TIMELINE FEED */}
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <Card className="h-44 bg-white border border-slate-100" />
              <Card className="h-44 bg-white border border-slate-100" />
            </div>
          ) : filteredUpdates.length === 0 ? (
            <EmptyState
              title="No Updates Found"
              description="No welfare changes match your filter settings. Click 'Simulate Gov Change Scrape' to test feed updates."
            />
          ) : (
            <div className="space-y-6">
              {filteredUpdates.map((update) => (
                <motion.div
                  key={update._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border border-[#0F172A]/5 p-6 bg-white hover:shadow-premium transition duration-200 rounded-3xl space-y-5">
                    
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Version {update.version_number} • {new Date(update.date).toLocaleDateString()}
                        </span>
                        <h3 className="font-serif text-lg font-black text-[#0F172A] leading-tight">
                          {update.schemeName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Badge variant="accent">{update.change_type}</Badge>
                          {getImportanceBadge(update.importance)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopySummary(update)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                          title="Copy summary"
                        >
                          <FaCopy size={13} />
                        </button>
                        <button
                          onClick={() => {
                            navigator.share ? navigator.share({
                              title: `Setu AI Scheme Update: ${update.schemeName}`,
                              text: update.impact,
                              url: window.location.href,
                            }) : handleCopySummary(update);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                          title="Share"
                        >
                          <FaShareAlt size={13} />
                        </button>
                      </div>
                    </div>

                    {/* AI Impact Callout banner */}
                    <div className="bg-[#14B8A6]/5 border border-[#14B8A6]/10 p-4 rounded-2xl flex items-center gap-3">
                      <FaUserCheck className="text-[#14B8A6] text-xl flex-shrink-0" />
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-[#0D9488] tracking-wider block">AI Impact Analysis</span>
                        <p className="text-xs text-[#0F172A] font-extrabold leading-snug">
                          {update.impact}
                        </p>
                      </div>
                    </div>

                    {/* Before vs After comparison cards */}
                    {update.modified_fields && update.modified_fields.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Comparison View</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {update.modified_fields.map((field, index) => (
                            <div
                              key={index}
                              className="border border-slate-100 p-3.5 rounded-2xl bg-[#FAF8F3]/50 text-xs font-semibold space-y-2"
                            >
                              <p className="text-slate-500 font-extrabold">{field.field_name}</p>
                              
                              <div className="grid grid-cols-2 gap-2 text-slate-700">
                                <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl text-center">
                                  <span className="text-[8px] uppercase text-rose-400 font-bold block">Previous</span>
                                  <span className="font-extrabold text-rose-700 line-through truncate block">
                                    {field.previous_value}
                                  </span>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center">
                                  <span className="text-[8px] uppercase text-emerald-400 font-bold block">New Value</span>
                                  <span className="font-extrabold text-emerald-700 truncate block">
                                    {field.new_value}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Official source and verified block */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px] text-slate-400 font-semibold">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>Verified by: <strong className="text-slate-600">{update.verified_by || "Setu AI Agent"}</strong></span>
                        {update.verified_source && (
                          <a
                            href={update.verified_source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#14B8A6] hover:text-[#0D9488]"
                          >
                            <FaExternalLinkAlt size={8} /> Govt Official Notification
                          </a>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/scheme/${update.scheme_id}`)}
                        >
                          View Scheme Detail
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/application-roadmap/${update.scheme_id}`)}
                        >
                          Launch Roadmap
                        </Button>
                      </div>
                    </div>

                  </Card>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </PageContainer>

      <Footer />
      <BottomBar />
    </main>
  );
}
