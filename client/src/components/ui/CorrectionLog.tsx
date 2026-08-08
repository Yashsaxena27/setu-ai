import { useEffect, useState } from "react";
import { FaUserCheck } from "react-icons/fa";

interface CorrectionLogProps {
  schemeId: string;
}

export default function CorrectionLog({ schemeId }: CorrectionLogProps) {
  const [lastCorrected, setLastCorrected] = useState<string | null>(null);

  useEffect(() => {
    const fetchCorrections = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/corrections/scheme/${schemeId}`);
        const json = await res.json();
        
        if (Array.isArray(json) && json.length > 0) {
          const date = new Date(json[0].updatedAt);
          const daysAgo = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
          
          if (daysAgo === 0) setLastCorrected("today");
          else if (daysAgo === 1) setLastCorrected("yesterday");
          else setLastCorrected(`${daysAgo} days ago`);
        }
      } catch (e) {
        console.error("Failed to fetch correction log", e);
      }
    };
    
    if (schemeId) {
      fetchCorrections();
    }
  }, [schemeId]);

  if (!lastCorrected) return null;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
      <FaUserCheck />
      <span>Last corrected: {lastCorrected} based on user feedback</span>
    </div>
  );
}
