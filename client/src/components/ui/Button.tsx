import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variantStyles = {
    primary: "bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-soft hover:shadow-premium border border-transparent",
    secondary: "bg-white text-[#0F172A] border border-[#0F172A]/10 hover:bg-slate-50 hover:border-[#0F172A]/20 shadow-soft",
    accent: "bg-[#14B8A6] text-white hover:bg-[#0D9488] shadow-soft hover:shadow-premium border border-transparent",
    danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-soft hover:shadow-premium border border-transparent",
    ghost: "bg-transparent text-[#0F172A] hover:bg-[#0F172A]/5 border border-transparent",
  };

  const sizeStyles = {
    xs: "rounded-lg px-3 py-1.5 text-[11px]",
    sm: "rounded-xl px-4 py-2 text-xs",
    md: "rounded-xl px-6 py-3 text-sm",
    lg: "rounded-2xl px-8 py-4 text-base",
  };

  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
