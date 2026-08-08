import { FaQuoteLeft } from "react-icons/fa";

export default function SourceCitation({ sourceText, sourceName = "Official Scheme Guidelines" }: { sourceText: string; sourceName?: string }) {
  return (
    <div className="mt-3 p-3 bg-blue-50/50 border-l-2 border-blue-200 rounded-r text-sm text-slate-600">
      <div className="flex items-center gap-2 mb-1 text-blue-700 font-medium text-xs uppercase tracking-wider">
        <FaQuoteLeft className="text-[10px]" />
        Source: {sourceName}
      </div>
      <p className="italic text-slate-500">"{sourceText}"</p>
    </div>
  );
}
