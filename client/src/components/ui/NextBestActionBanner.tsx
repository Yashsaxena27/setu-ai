import { FaArrowRight, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaFileAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

interface NextBestAction {
  actionType: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  route: string;
  requiredDocument?: string;
  deadline?: string;
}

interface Props {
  action: NextBestAction;
}

export default function NextBestActionBanner({ action }: Props) {
  let bgClass = "bg-white border-slate-200";
  let icon = <FaInfoCircle className="text-slate-400 text-xl" />;
  let titleClass = "text-[#0F172A]";
  
  if (action.priority === "High") {
    bgClass = "bg-rose-50 border-rose-100";
    icon = <FaExclamationCircle className="text-rose-500 text-xl" />;
    titleClass = "text-rose-900";
  } else if (action.priority === "Medium") {
    bgClass = "bg-amber-50 border-amber-100";
    icon = <FaFileAlt className="text-amber-500 text-xl" />;
    titleClass = "text-amber-900";
  } else if (action.actionType === "APPLY_NOW" || action.actionType === "MONITOR_STATUS") {
    bgClass = "bg-emerald-50 border-emerald-100";
    icon = <FaCheckCircle className="text-emerald-500 text-xl" />;
    titleClass = "text-emerald-900";
  }

  return (
    <div className={`w-full border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft transition-colors ${bgClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block mb-0.5">
            Next Best Action
          </span>
          <h4 className={`font-serif font-bold text-base leading-tight mb-1 ${titleClass}`}>
            {action.title}
          </h4>
          <p className="text-xs font-medium text-slate-600">
            {action.description}
          </p>
          {action.requiredDocument && (
             <span className="inline-block mt-2 text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-500">
               Document Needed: {action.requiredDocument}
             </span>
          )}
        </div>
      </div>
      
      <Link 
        to={action.route} 
        className="shrink-0 w-full sm:w-auto text-center px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-[#0F172A] transition-colors flex items-center justify-center gap-2"
      >
        Take Action <FaArrowRight size={10} />
      </Link>
    </div>
  );
}
