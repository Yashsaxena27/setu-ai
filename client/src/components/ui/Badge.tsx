import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "accent" | "neutral" | "secondary";
  size?: "sm" | "md";
}

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1.5 rounded-full font-sans font-medium tracking-wide text-center uppercase";

  const variantStyles = {
    success: "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20",
    warning: "bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/20",
    error: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20",
    info: "bg-[#0F172A]/10 text-[#0F172A] border border-[#0F172A]/20",
    accent: "bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}
