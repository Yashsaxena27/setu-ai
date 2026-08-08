interface Props {
  mode: "simple" | "official";
  onChange: (mode: "simple" | "official") => void;
}

export default function DualVoiceToggle({ mode, onChange }: Props) {
  return (
    <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200">
      <button
        onClick={() => onChange("simple")}
        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
          mode === "simple" 
            ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        Simple Voice
      </button>
      <button
        onClick={() => onChange("official")}
        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
          mode === "official" 
            ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        Official
      </button>
    </div>
  );
}
