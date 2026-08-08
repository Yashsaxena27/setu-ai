import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";

interface FreshnessBadgeProps {
  lastVerifiedDate: string | Date;
  status?: "fresh" | "stale" | "unverified";
  className?: string;
}

export default function FreshnessBadge({ lastVerifiedDate, status = "unverified", className = "" }: FreshnessBadgeProps) {
  // If status is provided via DB enum, use it, otherwise calculate from date
  const date = new Date(lastVerifiedDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  let effectiveStatus = status;
  // Only auto-downgrade fresh to stale/unverified if time has passed.
  // Never auto-upgrade unverified to fresh just because of a recent date.
  if (status === "fresh" && lastVerifiedDate) {
    if (diffDays > 90) effectiveStatus = "unverified";
    else if (diffDays > 30) effectiveStatus = "stale";
  }

  const formattedDate = date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const configs = {
    fresh: {
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <FaCheckCircle />,
      text: `Verified: ${formattedDate}`
    },
    stale: {
      color: "text-yellow-700",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <FaExclamationTriangle />,
      text: `Last verified: ${formattedDate} (Needs update)`
    },
    unverified: {
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <FaTimesCircle />,
      text: `Data may be outdated (Last checked: ${formattedDate})`
    }
  };

  const config = configs[effectiveStatus as keyof typeof configs] || configs.unverified;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
