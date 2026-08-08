import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaTimesCircle } from "react-icons/fa";

interface NonMatchReason {
  reasonCode: string;
  field: string;
  actualValue: string | number;
  requiredValue: string | number;
  explanation: string;
}

interface Props {
  reasons: NonMatchReason[];
}

export default function WhyNotExpandable({ reasons }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="w-full border border-rose-200 bg-rose-50/50 rounded-2xl overflow-hidden mt-2">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-xs font-bold text-rose-700 hover:bg-rose-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FaTimesCircle className="text-rose-500" />
          <span>Not Eligible ({reasons.length} Reasons) - Why Not?</span>
        </div>
        {expanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {expanded && (
        <div className="p-4 border-t border-rose-100 space-y-3 bg-white">
          {reasons.map((r, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.explanation}</p>
                <div className="flex gap-4 mt-1 text-[10px] font-bold">
                  <span className="text-slate-500">Your {r.field}: <span className="text-rose-600">{r.actualValue}</span></span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Required: <span className="text-emerald-600">{r.requiredValue}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
