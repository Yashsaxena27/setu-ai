import { useState, useEffect } from "react";
import { FaSync, FaServer, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";
import Card from "../ui/Card";
import Button from "../ui/Button";
import toast from "react-hot-toast";

interface SyncLog {
  _id: string;
  source_provider: string;
  sync_type: string;
  status: string;
  start_time: string;
  end_time?: string;
  records_processed: number;
  records_added: number;
  records_updated: number;
  records_failed: number;
}

export default function PipelineManager() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:5001/pipeline/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch pipeline logs", e);
    }
  };

  const triggerSync = async (provider: string) => {
    setSyncing(true);
    toast.loading(`Starting sync for ${provider}...`, { id: "sync" });
    try {
      const res = await fetch("http://localhost:5001/pipeline/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider })
      });
      if (res.ok) {
        toast.success("Sync started successfully!", { id: "sync" });
        setTimeout(fetchLogs, 2000); // refresh logs after a delay
      } else {
        toast.error("Failed to start sync.", { id: "sync" });
      }
    } catch (e) {
      toast.error("Error connecting to pipeline service.", { id: "sync" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <FaServer className="text-slate-600 text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">myScheme Adapter</h3>
                <p className="text-xs text-slate-500">Status: <span className="text-amber-500 font-bold">STUB (Pending API Setu)</span></p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => triggerSync("myscheme")}
              disabled={syncing}
            >
              <FaSync className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Run Sync"}
            </Button>
          </div>
          <div className="text-sm text-slate-600 bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-2">
            <FaExclamationTriangle className="text-amber-500 mt-1 shrink-0" />
            <p>Pipeline architecture is production-ready and tested. Live myScheme integration is pending API Setu publisher approval. Currently reading from curated stub data.</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-bold text-slate-800">Recent Sync Logs</h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No sync logs available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-700">Time</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Provider</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Type</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Processed</th>
                  <th className="py-3 px-4 font-semibold text-slate-700">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(log.start_time).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{log.source_provider}</td>
                    <td className="py-3 px-4 capitalize">{log.sync_type}</td>
                    <td className="py-3 px-4">
                      {log.status === "completed" ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <FaCheckCircle /> {log.status}
                        </span>
                      ) : log.status === "failed" ? (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <FaTimesCircle /> {log.status}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <FaSync className="animate-spin" /> {log.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{log.records_processed}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="text-green-600">+{log.records_added}</span> /{" "}
                      <span className="text-amber-600">~{log.records_updated}</span> /{" "}
                      <span className="text-red-600">x{log.records_failed}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
