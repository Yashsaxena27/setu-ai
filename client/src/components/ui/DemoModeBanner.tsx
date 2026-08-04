import { useDemoMode } from "../../context/DemoModeContext";
import { FaTimesCircle, FaUserCheck } from "react-icons/fa";

export default function DemoModeBanner() {
  const { isDemoMode, disableDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="bg-[#0F172A] text-white text-xs font-bold py-2 px-4 flex items-center justify-between shadow-md border-b border-[#14B8A6]/40 relative z-50">
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#14B8A6] animate-pulse" />
          <span className="flex items-center gap-1.5 text-slate-200">
            <FaUserCheck className="text-[#14B8A6] h-3.5 w-3.5" />
            <strong className="text-white">Demo Mode Active:</strong> Persona loaded for <u className="decoration-[#14B8A6]">Kamla Devi</u> (Farmer, Uttar Pradesh)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[10px] text-slate-400 font-mono">5-Min Judge Presentation Preset</span>
          <button
            onClick={disableDemoMode}
            className="inline-flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-full transition cursor-pointer"
          >
            <FaTimesCircle className="h-3 w-3 text-red-400" /> Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
}
