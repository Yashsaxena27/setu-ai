import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import { submitLifeEvent } from "../services/profileApi";
import toast from "react-hot-toast";

const LIFE_EVENTS = [
  { id: "college_enrollment", label: "Started College/University", icon: "🎓" },
  { id: "marriage", label: "Got Married", icon: "💍" },
  { id: "child_birth", label: "Had a Child", icon: "👶" },
  { id: "job_loss", label: "Lost Job / Unemployment", icon: "📉" },
  { id: "started_business", label: "Started a Business", icon: "💼" },
  { id: "disability", label: "New Disability Diagnosis", icon: "♿" },
];

export default function LifeEvents() {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newOpportunities, setNewOpportunities] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedEvent) return;
    
    setLoading(true);
    try {
      const res = await submitLifeEvent(selectedEvent);
      if (res.newMatches) {
        setNewOpportunities(res.newMatches);
      }
      setSubmitted(true);
      toast.success("Life event updated successfully");
    } catch (err) {
      toast.error("Failed to update life event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />
      <PageContainer>
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-[#0F172A]">Life Events</h1>
            <p className="text-slate-500 font-medium mt-2">
              Update your profile with major life changes to discover new eligible schemes.
            </p>
          </div>

          {!submitted ? (
            <Card className="p-6 border border-[#0F172A]/5">
              <SectionHeader title="What changed in your life?" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {LIFE_EVENTS.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition ${
                      selectedEvent === event.id 
                        ? 'border-[#14B8A6] bg-[#14B8A6]/10 text-[#0F172A]' 
                        : 'border-slate-200 bg-white hover:border-[#14B8A6]/50'
                    }`}
                  >
                    <span className="text-2xl">{event.icon}</span>
                    <span className="font-bold">{event.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!selectedEvent || loading}
                >
                  {loading ? "Updating..." : "Find New Opportunities"}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-6 bg-[#14B8A6]/10 border border-[#14B8A6]/20">
                <h2 className="font-serif text-2xl font-bold text-[#0D9488] mb-2">
                  Profile Updated
                </h2>
                <p className="text-slate-700 font-medium">
                  We've recalculated your eligibility based on this new life event.
                </p>
              </Card>

              <div>
                <SectionHeader title="New Opportunities" />
                {newOpportunities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    {newOpportunities.map((scheme, idx) => (
                      <Card key={idx} className="p-5 border border-[#0F172A]/5 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-[#0F172A]">{scheme.scheme_name}</h3>
                          <p className="text-sm text-slate-500">{scheme.summary || "You might now be eligible for this scheme."}</p>
                        </div>
                        <Button variant="secondary" onClick={() => navigate(`/scheme/${scheme._id}`)}>
                          View
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border border-[#0F172A]/5 mt-4">
                    <p className="text-slate-500 font-medium">
                      No new scheme matches were found based on this event, but your profile has been updated.
                    </p>
                  </Card>
                )}
              </div>
              
              <div className="flex justify-center mt-8">
                <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
      <Footer />
      <BottomBar />
    </main>
  );
}
