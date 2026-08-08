import { FaCheckCircle, FaTimesCircle, FaUserCheck } from "react-icons/fa";
import SectionHeader from "./SectionHeader";

interface EligibilityExamplesProps {
  examples?: string[];
}

export default function EligibilityExamples({ examples }: EligibilityExamplesProps) {
  if (!examples || examples.length === 0) return null;

  return (
    <div className="space-y-4 mt-8">
      <SectionHeader title="Eligibility Examples" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {examples.map((example, i) => {
          const isEligible = example.startsWith("✅") || example.toLowerCase().includes("eligible because");
          const cleanedText = example.replace(/^[✅❌]\s*/, "");
          
          return (
            <div 
              key={i} 
              className={`p-4 rounded-xl border ${
                isEligible 
                  ? "bg-green-50/50 border-green-100" 
                  : "bg-red-50/50 border-red-100"
              }`}
            >
              <div className="flex items-start gap-3">
                {isEligible ? (
                  <FaCheckCircle className="text-green-500 mt-1 shrink-0" />
                ) : (
                  <FaTimesCircle className="text-red-500 mt-1 shrink-0" />
                )}
                <div>
                  <h4 className={`font-bold text-sm ${isEligible ? "text-green-900" : "text-red-900"}`}>
                    {isEligible ? "Eligible Persona" : "Ineligible Persona"}
                  </h4>
                  <p className={`text-xs mt-1.5 leading-relaxed ${isEligible ? "text-green-800" : "text-red-800"}`}>
                    {cleanedText}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] font-medium text-slate-400 bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
        <FaUserCheck />
        <span>AI-generated personas based purely on verified scheme rules.</span>
      </div>
    </div>
  );
}
