import { FaCheckCircle, FaExclamationTriangle, FaLock, FaExternalLinkAlt } from "react-icons/fa";
import Button from "./Button";
import { useNavigate } from "react-router-dom";

interface Step {
  id: string;
  title: string;
  status: "Completed" | "Pending" | "Locked";
  description: string;
}

interface ActionPlanStepProps {
  step: Step;
  index: number;
  schemeId: string;
  schemeUrl?: string;
  onSetReminder?: () => void;
}

export default function ActionPlanStep({ step, index, schemeUrl, onSetReminder }: ActionPlanStepProps) {
  const navigate = useNavigate();

  const getStatusIcon = () => {
    switch (step.status) {
      case "Completed":
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case "Pending":
        return <FaExclamationTriangle className="text-amber-500 text-xl" />;
      case "Locked":
        return <FaLock className="text-slate-300 text-xl" />;
      default:
        return <div className="w-5 h-5 border-2 border-slate-300 rounded-sm" />;
    }
  };

  const renderAction = () => {
    if (step.status === "Completed") return null;

    if (step.id === "step-1") {
      return (
        <Button size="sm" onClick={() => navigate("/profile")}>Update Profile</Button>
      );
    }
    if (step.id === "step-3") {
      return (
        <Button size="sm" onClick={() => navigate("/document-verification")}>Upload Documents</Button>
      );
    }
    if (step.id === "step-4") {
      return (
        <Button size="sm" onClick={() => navigate("/draft")}>Generate Draft</Button>
      );
    }
    if (step.id === "step-6") {
      return schemeUrl ? (
        <a href={schemeUrl} target="_blank" rel="noreferrer">
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            Apply on Official Portal <FaExternalLinkAlt className="ml-2 text-[10px]" />
          </Button>
        </a>
      ) : null;
    }
    if (step.id === "step-8" && onSetReminder) {
      return (
        <Button size="sm" variant="secondary" onClick={onSetReminder}>Set Reminder</Button>
      );
    }
    return null;
  };

  return (
    <div className={`flex gap-4 p-4 rounded-xl border ${step.status === 'Completed' ? 'bg-green-50/50 border-green-100' : step.status === 'Pending' ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="shrink-0 mt-0.5">
        {getStatusIcon()}
      </div>
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${step.status === 'Locked' ? 'text-slate-400' : 'text-slate-800'}`}>
          {index + 1}. {step.title} {step.status === 'Completed' && <span className="ml-1 text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded">100%</span>}
        </h4>
        <p className={`text-xs mt-1 ${step.status === 'Locked' ? 'text-slate-400' : 'text-slate-600'}`}>
          {step.description}
        </p>
        {step.status === 'Pending' && (
          <div className="mt-3">
            {renderAction()}
          </div>
        )}
      </div>
    </div>
  );
}
