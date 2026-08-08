import { useState, useEffect } from "react";
import { FaRegFileAlt, FaCheck, FaExclamationCircle } from "react-icons/fa";
import SectionHeader from "./SectionHeader";

interface DocumentProgressProps {
  schemeId: string;
  requiredDocuments: string[];
}

export default function DocumentProgress({ schemeId, requiredDocuments }: DocumentProgressProps) {
  const [gathered, setGathered] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`docs_progress_${schemeId}`);
      if (saved) {
        setGathered(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load document progress", e);
    }
  }, [schemeId]);

  const toggleDoc = (doc: string) => {
    const next = { ...gathered, [doc]: !gathered[doc] };
    setGathered(next);
    localStorage.setItem(`docs_progress_${schemeId}`, JSON.stringify(next));
  };

  if (!requiredDocuments || requiredDocuments.length === 0) {
    return (
      <div className="mt-8 p-6 text-center border border-slate-200 rounded-xl bg-slate-50">
        <FaRegFileAlt className="mx-auto text-slate-300 text-3xl mb-3" />
        <h4 className="font-bold text-slate-700">No specific documents required</h4>
        <p className="text-sm text-slate-500 mt-1">This scheme does not list any mandatory documents for application.</p>
      </div>
    );
  }

  const completedCount = requiredDocuments.filter(doc => gathered[doc]).length;
  const progressPct = Math.round((completedCount / requiredDocuments.length) * 100);

  return (
    <div className="space-y-6">
      <SectionHeader title="Document Checklist" />
      
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gathering Progress</p>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-black ${progressPct === 100 ? 'text-green-500' : 'text-slate-700'}`}>
              {completedCount}/{requiredDocuments.length}
            </span>
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden w-[150px]">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
        {progressPct === 100 && (
          <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1.5 rounded-full text-xs font-bold">
            <FaCheck /> Ready to apply
          </div>
        )}
      </div>

      <div className="space-y-2">
        {requiredDocuments.map((doc, i) => (
          <div 
            key={i}
            onClick={() => toggleDoc(doc)}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
              gathered[doc] 
                ? 'bg-green-50/50 border-green-200' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
              gathered[doc]
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-slate-50 border-slate-300'
            }`}>
              {gathered[doc] && <FaCheck className="text-[10px]" />}
            </div>
            <span className={`text-sm font-medium ${gathered[doc] ? 'text-green-900 line-through opacity-70' : 'text-slate-800'}`}>
              {doc}
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-medium">
        <FaExclamationCircle />
        <span>This checklist is for your personal tracking and does not upload documents.</span>
      </div>
    </div>
  );
}
