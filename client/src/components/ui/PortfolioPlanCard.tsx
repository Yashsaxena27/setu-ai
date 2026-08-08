import { useState } from "react";
import { FaListOl, FaExclamationCircle, FaLink, FaRobot, FaMicrophone } from "react-icons/fa";
import { explainPortfolio } from "../../services/intelligenceApi";
import DualVoiceToggle from "./DualVoiceToggle";
import toast from "react-hot-toast";

interface Props {
  plan: any;
}

export default function PortfolioPlanCard({ plan }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"simple" | "official">("simple");

  const handleExplain = async () => {
    setLoading(true);
    try {
      const res = await explainPortfolio(plan, mode);
      setExplanation(res.explanation);
    } catch (e) {
      toast.error("Failed to generate explanation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-serif font-black text-[#0F172A] flex items-center gap-2">
            <FaListOl className="text-[#14B8A6]" /> AI Portfolio Plan
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Optimized sequence for your household</p>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        
        {/* Recommended Sequence */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Application Sequence</h4>
          <div className="space-y-3">
            {plan.sequence?.map((seq: any) => (
              <div key={seq.schemeId} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-white shadow-sm relative">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shrink-0">
                  {seq.order}
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">{seq.schemeName}</h5>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{seq.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts & Dependencies */}
        {(plan.conflicts?.length > 0 || plan.dependencies?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.conflicts?.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                <h4 className="text-xs font-black uppercase text-rose-500 tracking-wider mb-2 flex items-center gap-1"><FaExclamationCircle /> Conflicts</h4>
                <ul className="text-[11px] font-semibold text-rose-900 space-y-1">
                  {plan.conflicts.map((c: any, i: number) => (
                    <li key={i}>• Cannot claim both <strong className="font-bold">{c.schemeA}</strong> and <strong className="font-bold">{c.schemeB}</strong>.</li>
                  ))}
                </ul>
              </div>
            )}
            
            {plan.dependencies?.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider mb-2 flex items-center gap-1"><FaLink /> Dependencies</h4>
                <ul className="text-[11px] font-semibold text-amber-900 space-y-1">
                  {plan.dependencies.map((d: any, i: number) => (
                    <li key={i}>• Apply for <strong className="font-bold">{d.prerequisite}</strong> before <strong className="font-bold">{d.dependent}</strong>.</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* AI Explainer */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5">
          <div className="flex justify-between items-start mb-3">
             <h4 className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
               <FaRobot /> AI Voice Explainer
             </h4>
             <DualVoiceToggle mode={mode} onChange={setMode} />
          </div>
          
          {explanation ? (
            <p className="text-sm font-medium text-slate-700 bg-white/60 p-4 rounded-xl border border-white">
              {explanation}
            </p>
          ) : (
            <button 
              onClick={handleExplain} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition text-sm disabled:opacity-50"
            >
              {loading ? <FaRobot className="animate-bounce" /> : <FaMicrophone />}
              {loading ? "Generating explanation..." : "Listen to Explanation"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
