import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "./Badge";
import {
  FaChevronDown,
  FaChevronUp,
  FaRobot,
  FaExclamationTriangle,
  FaRegFileAlt,
  FaListOl,
  FaUserCheck,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";
import { type SuccessScoreRecord } from "../../services/applicationScoreApi";

interface Props {
  scoreData: SuccessScoreRecord;
  onRefresh?: () => void;
}

export default function SuccessScoreCard({ scoreData, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  // What-If Simulator state (keeps track of simulated checked recommendation IDs)
  const [checkedSimulations, setCheckedSimulations] = useState<Record<string, boolean>>({});
  const [simulatedScore, setSimulatedScore] = useState(scoreData.overall_score);

  useEffect(() => {
    // Reset simulation when raw score changes
    setCheckedSimulations({});
    setSimulatedScore(scoreData.overall_score);
  }, [scoreData.overall_score]);

  const handleSimulateChange = (recId: string, isChecked: boolean) => {
    setCheckedSimulations((prev) => {
      const next = { ...prev, [recId]: isChecked };
      
      // Calculate new simulated score
      let totalIncrease = 0;
      scoreData.recommendations.forEach((rec, idx) => {
        const id = `rec-${idx}`;
        if (next[id]) {
          totalIncrease += rec.scoreIncrease;
        }
      });

      const newScore = Math.min(100, scoreData.overall_score + totalIncrease);
      setSimulatedScore(newScore);
      return next;
    });
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return { text: "text-[#22C55E]", bg: "bg-[#22C55E]/10", stroke: "stroke-[#22C55E]" };
    if (score >= 50) return { text: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10", stroke: "stroke-[#F59E0B]" };
    if (score >= 30) return { text: "text-orange-500", bg: "bg-orange-500/10", stroke: "stroke-orange-500" };
    return { text: "text-[#EF4444]", bg: "bg-[#EF4444]/10", stroke: "stroke-[#EF4444]" };
  };

  const getStatusText = (score: number) => {
    if (score >= 80) return { chance: "Very High Chance", status: "Ready to Apply" };
    if (score >= 50) return { chance: "Moderate Chance", status: "Almost Ready" };
    if (score >= 30) return { chance: "Low Chance", status: "Needs Improvement" };
    return { chance: "Poor Chance", status: "Incomplete" };
  };

  const currentColors = getScoreColorClass(simulatedScore);
  const statusDetails = getStatusText(simulatedScore);

  // SVG Circular progress math
  const radius = 54;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (simulatedScore / 100) * circumference;

  return (
    <div className="bg-white border border-[#0F172A]/5 rounded-3xl p-6 shadow-premium space-y-6 font-sans">
      
      {/* Top section: Circle Gauge and Core status */}
      <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
        
        {/* Animated Circle Gauge */}
        <div className="relative h-32 w-32 flex items-center justify-center bg-slate-50/50 rounded-full border border-slate-100/50">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="stroke-slate-100 fill-transparent"
              strokeWidth={strokeWidth}
            />
            <motion.circle
              cx="64"
              cy="64"
              r={radius}
              className={`${currentColors.stroke} fill-transparent`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-[#0F172A] tracking-tight">{simulatedScore}%</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ready</span>
          </div>
        </div>

        {/* Status texts & Timelines */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
            <Badge variant="accent">AI CASE OFFICER SCORE</Badge>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${currentColors.bg} ${currentColors.text}`}>
              {statusDetails.chance}
            </span>
          </div>
          <h3 className="font-serif text-xl font-extrabold text-[#0F172A] leading-tight">
            {statusDetails.status}
          </h3>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 font-semibold">
            <FaClock className="text-slate-400" />
            <span>Estimated Submission: <span className="text-[#0F172A] font-extrabold">{scoreData.timeline || "N/A"}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-[#14B8A6] p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              title="Refresh score"
            >
              ↻
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-[#14B8A6] p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          >
            {expanded ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expandable Confidence Breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-slate-100 pt-6 space-y-5"
          >
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Confidence Breakdown
              </h4>

              {/* Subscores details */}
              <div className="space-y-3">
                {[
                  { label: "Eligibility Matching", score: scoreData.eligibility_score, icon: FaUserCheck, desc: "Alignment with age, income, and state criteria rules." },
                  { label: "Checklist Documents", score: scoreData.document_score, icon: FaRegFileAlt, desc: "Completeness of mandatory uploads checklist." },
                  { label: "Profile Completion", score: scoreData.profile_score, icon: FaListOl, desc: "Proportion of citizen profile details fields completed." },
                  { label: "Verification Quality", score: scoreData.verification_score, icon: FaShieldAlt, desc: "OCR validation state, quality checks, and mismatch checks." },
                  { label: "Draft Generation", score: scoreData.draft_score, icon: FaRegFileAlt, desc: "Completion of draft application support letter." },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        <item.icon className="text-[#14B8A6] shrink-0" />
                        {item.label}
                      </span>
                      <span>{item.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-[#14B8A6] h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Explanation Box */}
      {scoreData.aiExplanation && (
        <div className="bg-[#14B8A6]/5 border border-[#14B8A6]/10 rounded-2xl p-5 space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] flex items-center gap-1.5">
            <FaRobot className="text-base" />
            AI Case Officer Verdict
          </h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {scoreData.aiExplanation}
          </p>
        </div>
      )}

      {/* Interactive What-If Simulator */}
      {scoreData.recommendations && scoreData.recommendations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Interactive What-If Analysis
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Check actions below to simulate instant updates on your application approval probability score.
            </p>
          </div>

          <div className="space-y-2.5">
            {scoreData.recommendations.map((rec, idx) => {
              const id = `rec-${idx}`;
              const isChecked = !!checkedSimulations[id];
              return (
                <label
                  key={id}
                  className={`flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 cursor-pointer transition duration-150 ${
                    isChecked ? "bg-emerald-50/20 border-emerald-100/50" : "bg-white hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex gap-2.5 items-start">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSimulateChange(id, e.target.checked)}
                      className="h-4 w-4 rounded-sm border-[#0F172A]/10 text-[#14B8A6] focus:ring-[#14B8A6]/20 cursor-pointer mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-700 block leading-tight">{rec.action}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm ${
                        rec.priority === "High" ? "bg-red-50 text-red-600" : rec.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#22C55E] shrink-0">
                    +{rec.scoreIncrease}%
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Potential Risks */}
      {scoreData.risk_flags && scoreData.risk_flags.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
            <FaExclamationTriangle /> Potential Risk Audits
          </h4>
          <div className="space-y-2">
            {scoreData.risk_flags.map((risk, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 bg-red-50/20 border border-red-100/30 p-3 rounded-xl text-[11px] text-red-700 font-semibold leading-relaxed"
              >
                <span className="text-red-500 shrink-0 font-black">•</span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journey Stepper */}
      {scoreData.journey && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Readiness Journey
          </h4>
          
          <div className="relative flex justify-between items-center px-2">
            
            {/* Background line */}
            <div className="absolute top-3 left-6 right-6 h-0.5 bg-slate-100 -z-10" />

            {scoreData.journey.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 relative group">
                <div
                  className={`h-6.5 w-6.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition duration-200 ${
                    step.completed
                      ? "bg-[#22C55E] border-[#22C55E] text-white shadow-soft"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {step.completed ? "✓" : idx + 1}
                </div>
                
                {/* Custom tooltip hover style */}
                <div className="absolute bottom-8 scale-0 group-hover:scale-100 transition duration-150 bg-[#0F172A] text-white text-[9px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-premium">
                  {step.label}
                </div>
              </div>
            ))}

          </div>
        </div>
      )}

    </div>
  );
}
