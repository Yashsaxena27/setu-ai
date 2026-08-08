import { FaExclamationTriangle } from "react-icons/fa";

interface CommonMistakesProps {
  mistakes?: string[];
}

export default function CommonMistakes({ mistakes }: CommonMistakesProps) {
  if (!mistakes || mistakes.length === 0) return null;

  return (
    <div className="mt-8 bg-amber-50/30 border border-amber-100 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaExclamationTriangle className="text-amber-500 text-xl" />
        <h3 className="font-serif text-xl font-bold text-slate-800">Common Application Mistakes</h3>
      </div>
      <ul className="space-y-3">
        {mistakes.map((mistake, i) => (
          <li key={i} className="flex gap-3 text-sm text-amber-900 font-medium">
            <span className="text-amber-400 font-bold">•</span>
            <span>{mistake}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
