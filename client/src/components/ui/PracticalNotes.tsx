import { FaLightbulb } from "react-icons/fa";

interface PracticalNotesProps {
  notes?: string[];
}

export default function PracticalNotes({ notes }: PracticalNotesProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="mt-6 bg-indigo-50/50 border border-indigo-100 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaLightbulb className="text-indigo-500 text-xl" />
        <h3 className="font-serif text-xl font-bold text-slate-800">Practical Notes</h3>
      </div>
      <ul className="space-y-3">
        {notes.map((note, i) => (
          <li key={i} className="flex gap-3 text-sm text-indigo-900 font-medium">
            <span className="text-indigo-400 font-bold">•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
