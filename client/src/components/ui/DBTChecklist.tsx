import { FaInfoCircle, FaExternalLinkAlt, FaCheckSquare } from "react-icons/fa";

export default function DBTChecklist() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-3">
        <FaInfoCircle className="text-amber-500 text-lg" />
        <h3 className="text-sm font-bold text-slate-800">⚠️ Before You Apply — Check These</h3>
      </div>
      <p className="text-xs text-slate-600 mb-4 font-medium">
        Many eligible applicants never receive their benefits because their bank account isn't DBT-seeded. Verify these steps:
      </p>
      
      <div className="space-y-2 mb-5">
        <div className="flex items-start gap-2.5">
          <FaCheckSquare className="text-slate-300 shrink-0 mt-0.5" />
          <span className="text-sm text-slate-700">Bank account linked to Aadhaar</span>
        </div>
        <div className="flex items-start gap-2.5">
          <FaCheckSquare className="text-slate-300 shrink-0 mt-0.5" />
          <span className="text-sm text-slate-700">Bank account is <span className="font-bold">DBT-enabled</span> (ask your bank)</span>
        </div>
        <div className="flex items-start gap-2.5">
          <FaCheckSquare className="text-slate-300 shrink-0 mt-0.5" />
          <span className="text-sm text-slate-700">Mobile number linked to Aadhaar</span>
        </div>
        <div className="flex items-start gap-2.5">
          <FaCheckSquare className="text-slate-300 shrink-0 mt-0.5" />
          <span className="text-sm text-slate-700">Aadhaar e-KYC completed</span>
        </div>
      </div>

      <a 
        href="https://resident.uidai.gov.in/bank-mapper" 
        target="_blank" 
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
      >
        How to check DBT status <FaExternalLinkAlt className="text-[10px]" />
      </a>
    </div>
  );
}
