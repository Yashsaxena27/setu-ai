import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaSearch, FaExclamationCircle } from "react-icons/fa";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface CorrectionReport {
  _id: string;
  scheme_id: { _id: string; scheme_name: string };
  user_id: { _id: string; name: string; email: string };
  field_name: string;
  user_report: string;
  status: "pending" | "reviewed" | "fixed";
  createdAt: string;
}

export default function CorrectionQueue() {
  const [reports, setReports] = useState<CorrectionReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/corrections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (e) {
      toast.error("Failed to fetch correction reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/corrections/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        toast.success(`Marked as ${status}`);
        fetchReports(); // refresh
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      toast.error("Error updating status");
    }
  };

  if (loading) {
    return <div className="p-4">Loading queue...</div>;
  }

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="font-bold text-lg text-slate-800">User Correction Reports</h3>
          <p className="text-sm text-slate-500">Review community feedback to keep scheme data accurate.</p>
        </div>
        <div className="bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
          <FaExclamationCircle />
          <span>{pendingCount} Pending</span>
        </div>
      </div>

      <div className="space-y-3">
        {reports.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            No correction reports found.
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report._id} className="p-4 border border-slate-200">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      report.status === "pending" ? "bg-amber-100 text-amber-700" :
                      report.status === "reviewed" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#0F172A]">{report.scheme_id?.scheme_name || "Unknown Scheme"}</h4>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Field: <span className="text-indigo-600">{report.field_name}</span></p>
                  
                  <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-1">User Report:</span>
                    "{report.user_report}"
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Reported by: {report.user_id?.name || "Unknown"} ({report.user_id?.email || "No email"})</p>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                  {report.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(report._id, "fixed")} className="bg-green-600 hover:bg-green-700 border-none w-full justify-center">
                        <FaCheck className="mr-2" /> Mark Fixed
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(report._id, "reviewed")} className="w-full justify-center">
                        <FaSearch className="mr-2" /> Mark Reviewed
                      </Button>
                    </>
                  )}
                  {report.status === "reviewed" && (
                    <Button size="sm" onClick={() => updateStatus(report._id, "fixed")} className="bg-green-600 hover:bg-green-700 border-none w-full justify-center">
                      <FaCheck className="mr-2" /> Mark Fixed
                    </Button>
                  )}
                  {report.status === "fixed" && (
                    <Button size="sm" variant="secondary" disabled className="opacity-50 w-full justify-center">
                      Resolved
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
