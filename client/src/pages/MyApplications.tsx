import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import Timeline from "../components/ui/Timeline";
import { getApplications, getApplicationEvents } from "../services/applicationApi";
import toast from "react-hot-toast";

export default function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await getApplications();
      setApplications(res.applications || []);
    } catch (err) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleAppClick = async (app: any) => {
    setSelectedApp(app);
    setEventsLoading(true);
    try {
      const res = await getApplicationEvents(app._id);
      const formattedEvents = (res.events || []).map((e: any) => ({
        title: e.type ? e.type.replace(/_/g, ' ') : "STATUS UPDATED",
        description: `Source: ${e.source || 'user'}. (Demo Prototype)`,
        date: new Date(e.timestamp).toLocaleDateString(),
        completed: true,
      }));
      setEvents(formattedEvents);
    } catch (err) {
      toast.error("Failed to load application events");
    } finally {
      setEventsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />
      <PageContainer>
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-[#0F172A]">My Applications</h1>
            <p className="text-slate-500 font-medium mt-2">
              Track the status of your scheme applications. <span className="text-xs ml-2 bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Prototype Tracking</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <SectionHeader title="Your Applications" />
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {applications.map((app, idx) => (
                    <Card
                      key={idx}
                      hoverable
                      onClick={() => handleAppClick(app)}
                      className={`p-4 border cursor-pointer ${
                        selectedApp?._id === app._id 
                          ? 'border-[#14B8A6] bg-[#14B8A6]/5' 
                          : 'border-[#0F172A]/5'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-[#0F172A]">{app.scheme_name}</h3>
                          <p className="text-sm text-slate-500 mt-1">Status: <span className="font-semibold capitalize text-indigo-600">{app.status}</span></p>
                          <p className="text-xs text-slate-400 mt-1">Submitted: {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border border-[#0F172A]/5 mt-4">
                  <p className="text-slate-500 font-medium">You haven't started any applications yet.</p>
                  <Button className="mt-4" onClick={() => navigate("/results")}>
                    Find Schemes
                  </Button>
                </Card>
              )}
            </div>

            <div>
              <SectionHeader title="Application Timeline" />
              <Card className="border border-[#0F172A]/5 mt-4 p-6 min-h-[300px]">
                {!selectedApp ? (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                    Select an application to view its timeline
                  </div>
                ) : eventsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : events.length > 0 ? (
                  <Timeline items={events} />
                ) : (
                  <div className="text-slate-400 font-medium text-sm text-center">
                    No events recorded for this application.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
      <Footer />
      <BottomBar />
    </main>
  );
}
