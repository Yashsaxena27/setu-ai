import React from "react";
import { FaCheckCircle, FaStar, FaShieldAlt, FaBolt, FaMagic } from "react-icons/fa";

type StoryBadgeVariant =
  | "new"
  | "ai-verified"
  | "recommended"
  | "most-suitable"
  | "government-verified"
  | "application-ready";

interface StoryBadgeProps {
  variant: StoryBadgeVariant;
  className?: string;
}

export default function StoryBadge({ variant, className = "" }: StoryBadgeProps) {
  const configs: Record<
    StoryBadgeVariant,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    new: {
      label: "NEW",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      icon: FaBolt,
    },
    "ai-verified": {
      label: "AI Verified",
      bg: "bg-[#14B8A6]/10",
      text: "text-[#0D9488]",
      border: "border-[#14B8A6]/30",
      icon: FaCheckCircle,
    },
    recommended: {
      label: "Recommended",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      icon: FaStar,
    },
    "most-suitable": {
      label: "Most Suitable",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
      icon: FaMagic,
    },
    "government-verified": {
      label: "Sourced from Official Data",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
      icon: FaShieldAlt,
    },
    "application-ready": {
      label: "Application Ready",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      icon: FaCheckCircle,
    },
  };

  const config = configs[variant];
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <IconComponent className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
