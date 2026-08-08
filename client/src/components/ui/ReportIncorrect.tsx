import { useState } from "react";
import { FaFlag } from "react-icons/fa";
import toast from "react-hot-toast";

interface ReportIncorrectProps {
  schemeId: string;
  fieldName: string;
  className?: string;
}

export default function ReportIncorrect({ schemeId, fieldName, className = "" }: ReportIncorrectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportText.trim()) return;
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/corrections/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          scheme_id: schemeId,
          field_name: fieldName,
          user_report: reportText,
        }),
      });

      if (res.ok) {
        toast.success("Thank you for your feedback! Our team will review this shortly.");
        setIsOpen(false);
        setReportText("");
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
      >
        <FaFlag />
        <span>Report incorrect info</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white p-4 rounded-lg shadow-xl border border-slate-100 z-10">
          <h4 className="text-sm font-medium text-slate-800 mb-2">What seems wrong with this info?</h4>
          <textarea
            className="w-full text-sm border border-slate-200 rounded p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            placeholder="E.g., The eligibility age is now 21, not 18..."
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !reportText.trim()}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
