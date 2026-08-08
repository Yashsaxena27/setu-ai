import { useState } from "react";
import { FaRegCalendarAlt, FaBell } from "react-icons/fa";
import { createReminder } from "../../services/reminder";
import toast from "react-hot-toast";

interface DeadlineMetadata {
  hasDeadline: boolean;
  daysRemaining?: number;
  urgencyState?: "informational" | "upcoming" | "important" | "urgent" | "closed";
  deadlineDate?: string;
  message: string;
}

interface Props {
  schemeId: string;
  schemeName: string;
  deadlineInfo: DeadlineMetadata | null;
}

export default function SmartDeadlineBadge({ schemeId, schemeName, deadlineInfo }: Props) {
  const [loading, setLoading] = useState(false);

  if (!deadlineInfo || !deadlineInfo.hasDeadline) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[10px] font-bold">
        <FaRegCalendarAlt /> No strict deadline
      </div>
    );
  }

  const { urgencyState, message, deadlineDate } = deadlineInfo;

  let bgClass = "bg-slate-100 text-slate-600 border-slate-200";
  let pulse = false;

  if (urgencyState === "urgent") {
    bgClass = "bg-rose-100 text-rose-700 border-rose-200";
    pulse = true;
  } else if (urgencyState === "important") {
    bgClass = "bg-orange-100 text-orange-700 border-orange-200";
  } else if (urgencyState === "upcoming") {
    bgClass = "bg-amber-100 text-amber-700 border-amber-200";
  } else if (urgencyState === "closed") {
    bgClass = "bg-slate-800 text-slate-300 border-slate-700";
  }

  const handleAddReminder = async () => {
    if (!deadlineDate) return;
    setLoading(true);
    try {
      // Set reminder 3 days before deadline or immediately if < 3 days
      const reminderDate = new Date(deadlineDate);
      reminderDate.setDate(reminderDate.getDate() - 3);
      const targetDate = reminderDate < new Date() ? new Date() : reminderDate;

      await createReminder({
        title: `Deadline Approaching: ${schemeName}`,
        date: targetDate.toISOString().split("T")[0],
        time: "09:00",
        type: "deadline",
        scheme_id: schemeId,
      });
      toast.success("Deadline reminder set!");
    } catch (e) {
      toast.error("Failed to set reminder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 border px-2.5 py-1 rounded-lg text-[10px] font-bold ${bgClass}`}>
      <span className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${pulse ? 'bg-rose-500 animate-pulse' : 'bg-current opacity-70'}`} />
        {message}
      </span>
      {urgencyState !== "closed" && (
        <button 
          onClick={handleAddReminder} 
          disabled={loading}
          className="ml-2 pl-2 border-l border-current/20 hover:opacity-70 transition flex items-center gap-1"
          title="Add Reminder"
        >
          <FaBell /> {loading ? "..." : "Remind Me"}
        </button>
      )}
    </div>
  );
}
