import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  children?: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  hoverable = false,
  onClick,
}: CardProps) {
  const Component = onClick ? motion.div : "div";

  const baseStyles =
    "rounded-2xl bg-white border border-[#0F172A]/5 p-6 shadow-soft transition-all duration-200 overflow-hidden";

  const hoverStyles = hoverable
    ? "hover:shadow-premium hover:border-[#0F172A]/10 cursor-pointer"
    : "";

  const motionProps = onClick
    ? {
        whileHover: hoverable ? { y: -2 } : undefined,
        whileTap: { scale: 0.99 },
        onClick,
      }
    : {};

  return (
    // @ts-ignore
    <Component
      className={`${baseStyles} ${hoverStyles} ${className}`}
      {...motionProps}
    >
      {children}
    </Component>
  );
}
