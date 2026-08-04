import { useMemo } from "react";
import { FaClock, FaExclamationTriangle } from "react-icons/fa";

interface DeadlineBadgeProps {
  deadlineDate?: string | Date;
  className?: string;
}

export default function DeadlineBadge({ deadlineDate, className = "" }: DeadlineBadgeProps) {
  const deadlineInfo = useMemo(() => {
    // If no explicit deadline provided, generate a deterministic upcoming deadline for demo (e.g. 18 days from now)
    const target = deadlineDate ? new Date(deadlineDate) : new Date(Date.now() + 18 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return {
        label: "Expired",
        days: 0,
        colorClass: "bg-slate-100 text-slate-600 border-slate-300",
        icon: FaClock,
        urgent: false,
      };
    } else if (daysRemaining <= 7) {
      return {
        label: `${daysRemaining} Days Left (Urgent)`,
        days: daysRemaining,
        colorClass: "bg-red-50 text-red-700 border-red-200 animate-pulse",
        icon: FaExclamationTriangle,
        urgent: true,
      };
    } else if (daysRemaining <= 15) {
      return {
        label: `${daysRemaining} Days Left`,
        days: daysRemaining,
        colorClass: "bg-amber-50 text-amber-700 border-amber-200",
        icon: FaClock,
        urgent: false,
      };
    } else if (daysRemaining <= 30) {
      return {
        label: `${daysRemaining} Days Remaining`,
        days: daysRemaining,
        colorClass: "bg-yellow-50 text-yellow-800 border-yellow-200",
        icon: FaClock,
        urgent: false,
      };
    } else {
      return {
        label: `${daysRemaining} Days Remaining`,
        days: daysRemaining,
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: FaClock,
        urgent: false,
      };
    }
  }, [deadlineDate]);

  const IconComponent = deadlineInfo.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${deadlineInfo.colorClass} ${className}`}
      title={`Application deadline: ${deadlineDate ? new Date(deadlineDate).toLocaleDateString("en-IN") : "Rolling Government Batch"}`}
    >
      <IconComponent className="h-3 w-3 shrink-0" />
      <span>{deadlineInfo.label}</span>
    </span>
  );
}
