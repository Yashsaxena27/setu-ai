import { FaCheckCircle, FaSpinner, FaExclamationCircle, FaTimesCircle, FaHourglassHalf } from "react-icons/fa";

interface Props {
  status: string;
  lastUpdated?: string;
}

const STAGES = [
  "Not Started",
  "Preparing",
  "Documents Pending",
  "Ready to Apply",
  "Submitted",
  "Under Review",
  "Additional Information Required",
  "Approved",
  "Rejected",
  "Benefit Received",
];

export default function ApplicationStatusTracker({ status, lastUpdated }: Props) {
  const currentIndex = STAGES.indexOf(status) >= 0 ? STAGES.indexOf(status) : 0;

  // Determine simplified display stages: Preparing -> Submitted -> Review -> Final
  const isPreparing = currentIndex < 4;
  const isSubmitted = currentIndex >= 4 && currentIndex < 7;
  const isReview = currentIndex >= 5 && currentIndex < 7;
  const isFinal = currentIndex >= 7;

  let finalStatusIcon = <FaHourglassHalf className="text-slate-400" />;
  if (status === "Approved" || status === "Benefit Received") finalStatusIcon = <FaCheckCircle className="text-emerald-500" />;
  if (status === "Rejected") finalStatusIcon = <FaTimesCircle className="text-rose-500" />;
  if (status === "Additional Information Required") finalStatusIcon = <FaExclamationCircle className="text-amber-500" />;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-soft space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">
            Application Status
          </span>
          <h3 className="text-lg font-serif font-black text-[#0F172A] leading-tight">
            {status}
          </h3>
        </div>
        {lastUpdated && (
          <span className="text-[10px] font-semibold text-slate-400">
            Updated: {new Date(lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative pt-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-[#14B8A6] -translate-y-1/2 rounded-full z-0 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(10, (currentIndex / (STAGES.length - 1)) * 100))}%` }}
        ></div>
        
        <div className="relative z-10 flex justify-between items-center text-[10px] font-bold text-slate-500">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isPreparing || currentIndex > 0 ? 'bg-[#14B8A6] text-white' : 'bg-slate-200'} border-2 border-white`}>
              {(currentIndex > 0) ? <FaCheckCircle size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className={currentIndex >= 0 ? "text-[#0F172A]" : ""}>Preparing</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSubmitted || currentIndex > 4 ? 'bg-[#14B8A6] text-white' : 'bg-slate-200'} border-2 border-white`}>
              {currentIndex > 4 ? <FaCheckCircle size={10} /> : (isSubmitted ? <FaSpinner size={8} className="animate-spin" /> : null)}
            </div>
            <span className={currentIndex >= 4 ? "text-[#0F172A]" : ""}>Submitted</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isReview || currentIndex > 5 ? 'bg-[#14B8A6] text-white' : 'bg-slate-200'} border-2 border-white`}>
              {currentIndex > 6 ? <FaCheckCircle size={10} /> : (isReview ? <FaSpinner size={8} className="animate-spin" /> : null)}
            </div>
            <span className={currentIndex >= 5 ? "text-[#0F172A]" : ""}>Reviewing</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isFinal ? 'bg-white text-white' : 'bg-slate-200'} border-2 border-white`}>
              {isFinal ? finalStatusIcon : null}
            </div>
            <span className={isFinal ? "text-[#0F172A]" : ""}>Decision</span>
          </div>
        </div>
      </div>
    </div>
  );
}
