import { useEffect, useState } from "react";
import Card from "./Card";
import Skeleton from "./Skeleton";
import SectionHeader from "./SectionHeader";
import ActionPlanStep from "./ActionPlanStep";
import DBTChecklist from "./DBTChecklist";
import OfficialPortalCTA from "./OfficialPortalCTA";

interface ActionPlanProps {
  schemeId: string;
  schemeUrl?: string;
}

export default function ActionPlan({ schemeId, schemeUrl }: ActionPlanProps) {
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/application-roadmap/${schemeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.roadmap) {
          setRoadmap(json.roadmap);
        }
      } catch (e) {
        console.error("Failed to fetch action plan roadmap", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [schemeId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="text" className="w-1/3 mb-4" />
        <Skeleton variant="rectangular" className="h-20 w-full rounded-xl" />
        <Skeleton variant="rectangular" className="h-20 w-full rounded-xl" />
        <Skeleton variant="rectangular" className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!roadmap || !roadmap.steps) {
    return (
      <Card className="p-6 bg-slate-50 text-center rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500">Action Plan currently unavailable for this scheme.</p>
      </Card>
    );
  }

  const handleSetReminder = () => {
    // Simple placeholder for setting reminder logic. Can open a modal or toast.
    alert("Reminder feature will open here.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader title="Your Setu Action Plan" className="!mb-0" />
        {schemeUrl && <OfficialPortalCTA url={schemeUrl} />}
      </div>

      <div className="bg-[#0F172A] p-4 rounded-xl flex items-center justify-between shadow-md">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Overall Readiness</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#22C55E]">{roadmap.completion_percentage}%</span>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[200px]">
              <div 
                className="h-full bg-[#22C55E] rounded-full transition-all duration-1000" 
                style={{ width: `${roadmap.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <DBTChecklist />

      <div className="space-y-3 mt-6">
        {roadmap.steps.map((step: any, index: number) => (
          <ActionPlanStep 
            key={step.id} 
            step={step} 
            index={index} 
            schemeId={schemeId}
            schemeUrl={schemeUrl}
            onSetReminder={handleSetReminder}
          />
        ))}
      </div>

      {roadmap.aiGuidance && (
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2">AI Caseworker Advice</p>
          <p className="text-xs text-indigo-900 font-medium leading-relaxed">
            {roadmap.aiGuidance}
          </p>
        </div>
      )}
    </div>
  );
}
