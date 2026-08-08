import { useState, useEffect } from "react";
import { FaHome, FaUserFriends, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import Skeleton from "./Skeleton";
import Button from "./Button";

export default function HouseholdMatchSummary() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFamilyAnalysis = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/family/analysis`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const json = await res.json();
        if (json.success && json.analysis) {
          setData(json.analysis);
        }
      } catch (e) {
        console.error("Failed to fetch family analysis", e);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyAnalysis();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 bg-white border border-slate-100 shadow-soft rounded-2xl animate-pulse">
        <Skeleton variant="text" className="w-1/3 mb-4" />
        <Skeleton variant="text" className="w-full mb-2" />
        <Skeleton variant="text" className="w-full mb-2" />
        <Skeleton variant="text" className="w-2/3" />
      </Card>
    );
  }

  if (!data || !data.memberAnalyses || data.memberAnalyses.length === 0) {
    return (
      <Card className="p-6 bg-[#FAF8F3] border border-slate-200 shadow-sm rounded-2xl text-center">
        <FaUserFriends className="mx-auto text-slate-300 text-3xl mb-3" />
        <h3 className="font-semibold text-slate-700 text-sm mb-2">Household Matching Available</h3>
        <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
          Most Indian schemes are household-conditional. Add your family members to see if your household qualifies for additional welfare benefits.
        </p>
        <Link to="/family">
          <Button variant="secondary" size="sm">Add Family Members</Button>
        </Link>
      </Card>
    );
  }

  const warnings = data.insights?.filter((i: string) => i.includes("⚠️") || i.includes("Conflicting")) || [];
  const insights = data.insights?.filter((i: string) => !warnings.includes(i)) || [];

  return (
    <Card className="p-6 bg-white border border-[#14B8A6]/20 shadow-premium rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/5 rounded-bl-[100px] pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4">
        <FaHome className="text-[#14B8A6] text-xl" />
        <SectionHeader title="Your Household Opportunities" className="!mb-0" />
      </div>

      <div className="space-y-4 relative z-10">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <ul className="space-y-2">
            {data.memberAnalyses.map((m: any) => (
              <li key={m.member_id} className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">
                  {m.relationship === 'Self' ? '👨 You' : `👤 ${m.name}`} <span className="text-xs text-slate-400 font-normal">({m.relationship})</span>
                </span>
                <span className="font-bold text-[#14B8A6]">{m.schemesCount} schemes</span>
              </li>
            ))}
          </ul>
        </div>

        {warnings.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl">
            {warnings.map((w: string, idx: number) => (
              <p key={idx} className="text-xs font-semibold text-amber-800 flex items-start gap-2 mb-1 last:mb-0">
                <FaExclamationTriangle className="mt-0.5 shrink-0" />
                <span>{w.replace('⚠️ ', '')}</span>
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#0F172A] text-white p-4 rounded-xl gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Combined Household Benefit Potential</p>
            <p className="text-xl font-black text-[#22C55E]">₹{data.combined_benefits?.toLocaleString("en-IN") || 0}</p>
          </div>
          <Link to="/family">
            <Button size="sm" className="bg-white text-[#0F172A] hover:bg-slate-100 border-none w-full sm:w-auto">
              View Household Details
            </Button>
          </Link>
        </div>

        {insights.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">AI Household Insights</p>
            <ul className="space-y-1">
              {insights.map((insight: string, idx: number) => (
                <li key={idx} className="text-xs text-slate-600 font-medium flex items-start gap-2">
                  <span className="text-[#14B8A6]">•</span> {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
