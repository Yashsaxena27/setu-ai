import { FaShieldAlt } from "react-icons/fa";

export default function TrustDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3 ${className}`}>
      <div className="shrink-0 mt-0.5">
        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <FaShieldAlt />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-1">Setu AI is an independent platform</h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Setu AI is an AI-powered discovery tool and is <strong>not affiliated with any government body</strong>. 
          While we strive to keep information accurate by reading official sources, always verify eligibility and apply directly on the official <code>.gov.in</code> or <code>.nic.in</code> portals.
        </p>
      </div>
    </div>
  );
}
