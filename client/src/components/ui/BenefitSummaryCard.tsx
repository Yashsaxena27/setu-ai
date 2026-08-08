import { useState, useEffect } from "react";
import { FaChartBar, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import Skeleton from "./Skeleton";
import Button from "./Button";

export default function BenefitSummaryCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const json = await res.json();
        if (json.success && json.summary) {
          setData(json.summary);
        }
      } catch (e) {
        console.error("Failed to fetch benefit summary", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 border border-[#0F172A]/5 animate-pulse min-h-[250px]">
        <Skeleton variant="text" className="w-1/2 mb-6" />
        <div className="space-y-3">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-4/5" />
          <Skeleton variant="text" className="w-full" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="p-6 border border-[#0F172A]/5 flex flex-col justify-between h-full bg-white shadow-soft">
      <div>
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FaChartBar />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#0F172A]">Your Setu Journey</h3>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Schemes Matched</p>
            <p className="text-xl font-semibold text-slate-800">{data.matchedCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applications Started</p>
            <p className="text-xl font-semibold text-slate-800">{data.startedCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drafts Generated</p>
            <p className="text-xl font-semibold text-slate-800">{data.draftsCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Docs Ready</p>
            <p className="text-xl font-semibold text-slate-800">{data.docsReadyCount}</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">💰 Potential Benefit</span>
            <span className="text-sm font-bold text-slate-900">₹{data.potentialBenefit.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">✅ Already Pursuing</span>
            <span className="text-sm font-bold text-[#22C55E]">₹{data.alreadyPursuing.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-sm font-bold text-amber-600">⚠️ Still Unclaimed</span>
            <span className="text-sm font-bold text-amber-600">₹{data.unclaimedBenefit.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Button 
          variant="secondary" 
          className="w-full justify-between hover:bg-slate-100 border-slate-200 text-slate-700"
          onClick={() => navigate("/results")}
        >
          <span>View Unclaimed Schemes</span>
          <FaChevronRight className="text-[10px]" />
        </Button>
      </div>
    </Card>
  );
}
