import { useMemo } from "react";
import { FaExclamationCircle, FaArrowUp } from "react-icons/fa";

interface BenefitGapCardProps {
  potentialBenefits?: number;
  alreadyReceiving?: number;
  matchedCount?: number;
}

export default function BenefitGapCard({
  potentialBenefits = 72000,
  alreadyReceiving = 20000,
  matchedCount = 4,
}: BenefitGapCardProps) {
  const missingBenefits = Math.max(0, potentialBenefits - alreadyReceiving);
  const percentageUtilized = potentialBenefits > 0
    ? Math.round((alreadyReceiving / potentialBenefits) * 100)
    : 0;

  // Circular progress ring calculation
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageUtilized / 100) * circumference;

  const aiExplanation = useMemo(() => {
    if (percentageUtilized < 35) {
      return `You currently receive only ${percentageUtilized}% of the government benefits you qualify for. ₹${missingBenefits.toLocaleString()} in annual assistance remains unclaimed.`;
    } else if (percentageUtilized < 75) {
      return `You are utilizing ${percentageUtilized}% of your eligible welfare pool. Completing your profile and document checks can unlock an additional ₹${missingBenefits.toLocaleString()}.`;
    } else {
      return `Excellent welfare coverage! You are capturing ${percentageUtilized}% of available subsidies. Verify remaining document checklists to reach 100%.`;
    }
  }, [percentageUtilized, missingBenefits]);

  return (
    <div className="bg-linear-to-br from-[#0F172A] to-[#1E293B] text-white p-6 rounded-3xl shadow-premium border border-white/10 relative overflow-hidden space-y-6">
      {/* Decorative background blur */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#14B8A6]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-ping" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#14B8A6]">
            Household Benefit Gap Analysis
          </span>
        </div>
        <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-slate-300 border border-white/10">
          {matchedCount} Eligible Schemes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
        {/* Left Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Potential Benefits
            </span>
            <p className="font-serif text-xl sm:text-2xl font-black text-emerald-400">
              ₹{potentialBenefits.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Already Receiving
            </span>
            <p className="font-serif text-xl sm:text-2xl font-black text-amber-300">
              ₹{alreadyReceiving.toLocaleString()}
            </p>
          </div>

          <div className="bg-[#14B8A6]/10 p-3.5 rounded-2xl border border-[#14B8A6]/30 space-y-1">
            <span className="text-[10px] font-bold text-[#14B8A6] uppercase tracking-wider block">
              Missing Benefits
            </span>
            <p className="font-serif text-xl sm:text-2xl font-black text-white flex items-center gap-1">
              ₹{missingBenefits.toLocaleString()}
              <FaArrowUp className="h-3 w-3 text-emerald-400 inline" />
            </p>
          </div>
        </div>

        {/* Right Circular Gauge */}
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 justify-center md:justify-end">
          <div className="relative h-20 w-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-white/10 fill-transparent"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-[#14B8A6] fill-transparent transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="font-serif text-lg font-black text-white">{percentageUtilized}%</span>
              <span className="text-[8px] uppercase tracking-wider font-bold text-slate-400 block">Utilized</span>
            </div>
          </div>
          <div className="space-y-0.5 max-w-[120px]">
            <span className="text-xs font-bold text-slate-200">Coverage Score</span>
            <p className="text-[10px] text-slate-400 font-medium leading-snug">
              {percentageUtilized < 50 ? "High Unclaimed Potential" : "Good Coverage"}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom AI Explanation Callout */}
      <div className="bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-2xl p-3.5 flex items-start gap-3">
        <FaExclamationCircle className="h-4 w-4 text-[#14B8A6] shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-slate-200 leading-relaxed">
          <strong className="text-white font-bold">AI Insight:</strong> {aiExplanation}
        </p>
      </div>
    </div>
  );
}
