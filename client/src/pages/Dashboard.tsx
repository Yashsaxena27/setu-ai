import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUserEdit, FaSearch, FaFileAlt, FaUsers, FaRobot, FaShieldAlt } from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import Timeline from "../components/ui/Timeline";
import EmptyState from "../components/ui/EmptyState";
import HouseholdMatchSummary from "../components/ui/HouseholdMatchSummary";
import BenefitSummaryCard from "../components/ui/BenefitSummaryCard";
import { getApplicationScore } from "../services/applicationScoreApi";
import { getProfile } from "../services/profileApi";

interface DraftItem {
  id: string;
  name: string;
  generatedAt: string;
}

interface MatchItem {
  _id: string;
  scheme_name: string;
  score: number;
  category: string;
  summary?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [recentDrafts, setRecentDrafts] = useState<DraftItem[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchItem[]>([]);
  const [successScores, setSuccessScores] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      try {
        const p = await getProfile();
        if (p && ["Moderator", "Scheme Editor", "District Admin", "State Admin", "Super Admin"].includes(p.role || "")) {
          setIsAdmin(true);
        }
      } catch {}
    }
    checkRole();
  }, []);

  useEffect(() => {
    const matches: MatchItem[] = JSON.parse(
      localStorage.getItem("latestMatches") || "[]"
    );
    setRecentMatches(matches.slice(0, 3)); // show top 3

    // Simulations stat handled elsewhere

    const drafts: DraftItem[] = JSON.parse(
      localStorage.getItem("generatedDrafts") || "[]"
    );
    setRecentDrafts(drafts.slice(-3).reverse()); // show latest 3

    // Stats are now managed by BenefitSummaryCard
  }, []);

  useEffect(() => {
    if (recentMatches.length === 0) return;
    const fetchScores = async () => {
      const map: Record<string, number> = {};
      await Promise.all(
        recentMatches.map(async (s) => {
          try {
            const res = await getApplicationScore(s._id);
            map[s._id] = res.score.overall_score;
          } catch (e) {
            map[s._id] = 50;
          }
        })
      );
      setSuccessScores(map);
    };
    fetchScores();
  }, [recentMatches]);

  const activityItems = [
    { title: "Profile Checked", description: "Your eligibility data is up to date.", date: "Today", completed: true },
    { title: "AI RAG Matcher Ready", description: "Matched against current federal guidelines.", date: "Latest", completed: true },
    { title: "Drafting Templates Updated", description: "Vetted application formats synced.", date: "Available", completed: true },
    { title: "Eligibility Simulator Live", description: "Test hypothetical updates securely.", date: "Live", completed: true },
  ];

  const sidebarLinks = [
    { label: "Overview", active: true, onClick: () => navigate("/dashboard") },
    { label: "Family Household", active: false, onClick: () => navigate("/family") },
    { label: "Profile Wizard", active: false, onClick: () => navigate("/profile") },
    { label: "Matches Results", active: false, onClick: () => navigate("/results") },
    { label: "Simulator Panel", active: false, onClick: () => navigate("/eligibility-simulator") },
    { label: "Document Verification", active: false, onClick: () => navigate("/document-verification") },
    { label: "Application Roadmap", active: false, onClick: () => navigate("/application-roadmap") },
    { label: "Scheme Tracker", active: false, onClick: () => navigate("/scheme-updates") },
    { label: "AI Copilot", active: false, onClick: () => navigate("/chat") },
    ...(isAdmin ? [{ label: "Admin Console", active: false, onClick: () => navigate("/admin") }] : []),
    { label: "Account Settings", active: false, onClick: () => navigate("/settings") },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-16 md:pb-0">
      <Header />

      <PageContainer>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-3 space-y-2 sticky top-24">
            <Card className="p-4 border border-[#0F172A]/5">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </p>
              <div className="space-y-1">
                {sidebarLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={link.onClick}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-150 cursor-pointer ${
                      link.active
                        ? "bg-[#0F172A] text-white"
                        : "text-slate-500 hover:bg-[#0F172A]/5 hover:text-[#0F172A]"
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Dashboard Space */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Welcome Banner */}
            <div className="space-y-2">
              <h1 className="font-serif text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl">
                Welcome back, {user?.name || "Citizen"}
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                Here is a summary of your eligibility matches and application files.
              </p>
            </div>

            {/* Household Matching Summary (Moved to top) */}
            <div className="pt-2">
              <HouseholdMatchSummary />
            </div>

            {/* Benefit Summary Section */}
            <BenefitSummaryCard />
            {/* Content Row: Left Activities, Right Actions */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              
              {/* Activity Timeline */}
              <Card className="border border-[#0F172A]/5">
                <SectionHeader title="Platform Capabilities" />
                <div className="pt-2">
                  <Timeline items={activityItems} />
                </div>
              </Card>

              {/* Quick Actions Panel */}
              <Card className="border border-[#0F172A]/5 flex flex-col justify-between">
                <div>
                  <SectionHeader title="Quick Actions" />
                  <p className="text-sm text-slate-500 font-medium mb-6">
                    Manage your profile parameters, compare verified schemes, or test eligibility thresholds.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/profile", { state: { from: "/dashboard", label: "Dashboard" } })}
                    className="w-full justify-between"
                  >
                    <span>Update Citizen Profile</span>
                    <FaUserEdit />
                  </Button>
                  <Button
                    onClick={() => navigate("/results")}
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    <span>View Matched Schemes</span>
                    <FaSearch />
                  </Button>
                  <Button
                    onClick={() => navigate("/family")}
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    <span>Family Household</span>
                    <FaUsers />
                  </Button>
                  <Button
                    onClick={() => navigate("/chat")}
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    <span>AI Copilot</span>
                    <FaRobot />
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={() => navigate("/admin")}
                      variant="primary"
                      className="w-full justify-between bg-slate-900 border-none text-[#14B8A6]"
                    >
                      <span>Admin Console</span>
                      <FaShieldAlt />
                    </Button>
                  )}
                </div>
              </Card>
            </div>


            {/* Recent Matches Section */}
            <div className="space-y-4">
              <SectionHeader title="Top Matching Schemes" />
              {recentMatches.length === 0 ? (
                <EmptyState
                  title="No Matches Found"
                  description="Complete the Profile Wizard to let Setu AI match you with qualified schemes."
                  action={
                    <Button onClick={() => navigate("/profile", { state: { from: "/dashboard", label: "Dashboard" } })}>
                      Start Profile Wizard
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {recentMatches.map((scheme) => (
                    <Card
                      key={scheme._id}
                      hoverable
                      onClick={() => navigate("/results")}
                      className="flex flex-col justify-between border border-[#0F172A]/5 p-5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {scheme.category}
                          </span>
                          <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-[#22C55E] bg-green-50 px-2 py-0.5 rounded-sm">
                              {scheme.score}% Match
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">
                              {successScores[scheme._id] !== undefined ? `${successScores[scheme._id]}% Success` : "Loading..."}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-serif text-lg font-bold text-[#0F172A] line-clamp-1">
                          {scheme.scheme_name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {scheme.summary || "View full criteria verification explanations."}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Drafts Section */}
            <div className="space-y-4">
              <SectionHeader title="Application Draft Revisions" />
              {recentDrafts.length === 0 ? (
                <EmptyState
                  title="No Generated Drafts"
                  description="Drafts will appear here after matching and selecting 'Generate Draft'."
                  icon={<FaFileAlt className="h-8 w-8" />}
                />
              ) : (
                <div className="space-y-3">
                  {recentDrafts.map((draft, idx) => (
                    <Card
                      key={idx}
                      hoverable
                      onClick={() => navigate(`/results`)}
                      className="flex items-center justify-between border border-[#0F172A]/5 py-4 px-6"
                    >
                      <div className="flex items-center gap-3">
                        <FaFileAlt className="text-[#14B8A6] h-5 w-5" />
                        <div>
                          <p className="font-sans text-sm font-bold text-[#0F172A]">
                            {draft.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Revision prepped on {new Date(draft.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="accent">Draft Saved</Badge>
                    </Card>
                  ))}
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