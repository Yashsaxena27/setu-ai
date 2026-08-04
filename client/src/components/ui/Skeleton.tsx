interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export default function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const shapeClass = {
    text: "h-4 rounded-md w-full",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  }[variant];

  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={`animate-pulse bg-[#0F172A]/5 transition-opacity duration-200 ${shapeClass} ${className}`}
    />
  );
}
