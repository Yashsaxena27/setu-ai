import { FaRobot } from "react-icons/fa";

export default function AITransparencyBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 ${className}`}>
      <FaRobot className="text-slate-400 mt-0.5 shrink-0" />
      <p>
        <span className="font-medium text-slate-700">AI-generated</span> · Grounded in official data · Always verify on .gov.in
      </p>
    </div>
  );
}
