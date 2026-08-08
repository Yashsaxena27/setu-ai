import { useState, useEffect } from "react";
import { FaTimes, FaRobot, FaExclamationTriangle, FaCopy, FaCheck, FaInfoCircle } from "react-icons/fa";
import { getRejectionRecovery } from "../../services/applicationApi";
import toast from "react-hot-toast";

interface Props {
  schemeId: string;
  onClose: () => void;
}

export default function RejectionRecoveryModal({ schemeId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRecovery();
  }, [schemeId]);

  const loadRecovery = async () => {
    try {
      const res = await getRejectionRecovery(schemeId);
      setData(res);
    } catch (e) {
      toast.error("Failed to load recovery plan.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (data?.grievance_draft) {
      navigator.clipboard.writeText(data.grievance_draft);
      setCopied(true);
      toast.success("Draft copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
          <h2 className="text-lg font-serif font-bold text-rose-900 flex items-center gap-2">
            <FaExclamationTriangle className="text-rose-500" /> Help Me Recover
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-slate-400">
              <FaRobot className="text-4xl animate-bounce text-[#14B8A6]" />
              <p className="font-bold">AI is analyzing the rejection reason...</p>
            </div>
          ) : data ? (
            <>
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Why was it rejected?</h3>
                <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {data.explanation}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-emerald-500 tracking-wider">Corrective Actions</h3>
                  <ul className="text-sm font-medium text-slate-600 space-y-2">
                    {data.corrective_actions?.map((act: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                         <span className="text-emerald-500 mt-1">•</span> {act}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider">Missing/Incorrect Info</h3>
                  <p className="text-sm font-medium text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    {data.missing_info}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Draft Grievance / Appeal</h3>
                  <button onClick={handleCopy} className="text-[10px] flex items-center gap-1 font-bold text-[#14B8A6] hover:text-[#0D9488]">
                    {copied ? <FaCheck /> : <FaCopy />} {copied ? "Copied" : "Copy Draft"}
                  </button>
                </div>
                <textarea
                  readOnly
                  className="w-full h-32 p-4 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none resize-none"
                  value={data.grievance_draft}
                />
              </div>

              <div className="bg-[#14B8A6]/10 p-4 rounded-xl border border-[#14B8A6]/20 flex gap-3 items-start">
                 <FaInfoCircle className="text-[#14B8A6] shrink-0 mt-0.5" />
                 <p className="text-xs font-bold text-[#0D9488]">
                   Contact / Submit to: <span className="font-medium">{data.contact_info}</span>
                 </p>
              </div>
            </>
          ) : (
             <p className="text-center text-rose-500 font-bold py-8">Failed to generate recovery plan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
