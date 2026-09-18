import { motion } from "framer-motion";

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>Profile Completeness</span>
        <span className="text-[#14B8A6]">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-[#0F172A]/5 rounded-full h-2 overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-[#14B8A6] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
      </div>
    </div>
  );
}