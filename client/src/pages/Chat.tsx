import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FaArrowLeft,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeUp,
  FaPaperPlane,
  FaRobot,
  FaTrash,
  FaCopy,
  FaExternalLinkAlt,
} from "react-icons/fa";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BottomBar from "../components/layout/BottomBar";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import {
  getChatSessions,
  getChatMessages,
  sendChatMessage,
  deleteChatSession,
  type ChatSessionRecord,
  type ChatMessageRecord,
} from "../services/chatApi";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // URL parameters or state
  const stateScheme = location.state as any;

  // States
  const [sessions, setSessions] = useState<ChatSessionRecord[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  // Voice Synthesis/Recognition
  const [recognition, setRecognition] = useState<any>(null);

  // Scroll anchor
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggestion Prompts
  const SUGGESTIONS = [
    { text: "Compare my matched schemes", icon: "📊" },
    { text: "Show my missing documents", icon: "📋" },
    { text: "Summarize my roadmap status", icon: "📍" },
    { text: "Explain eligibility in Hindi", icon: "🌐" },
  ];

  useEffect(() => {
    loadSessions();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await getChatSessions();
      setSessions(res.sessions);
      if (res.sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(res.sessions[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (sid: string) => {
    setLoading(true);
    try {
      const res = await getChatMessages(sid);
      setMessages(res.messages);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load conversation history.");
    } finally {
      setLoading(false);
    }
  };

  // Setup Web Speech Recognition API
  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN";

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setInputMessage(text);
        setIsRecording(false);
        toast.success("Voice transcribed successfully!");
      };

      rec.onerror = () => {
        setIsRecording(false);
        toast.error("Voice transcription failed.");
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  };

  const handleToggleRecord = () => {
    if (!recognition) {
      // Mock Speech recognition fallback for hackathon validation demo
      setInputMessage("What documents are most important for my matched schemes?");
      toast.success("Speech Recognition Mock: Auto-filled default query");
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  // Text to speech voice playback
  const handleVoicePlayback = (text: string) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ""));
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
      toast.success("Voice playback started!");
    } else {
      toast.error("Text to speech is not supported in this browser.");
    }
  };

  const handleSend = async (textToSend?: string) => {
    const msg = textToSend || inputMessage;
    if (!msg.trim()) return;

    setSending(true);
    if (!textToSend) setInputMessage("");

    // optimistic user bubble
    const optMsg: any = {
      _id: "opt-1",
      sender: "user",
      text: msg,
      createdAt: new Date().toISOString(),
      citations: [],
      confidence: "High",
    };
    setMessages((prev) => [...prev, optMsg]);

    try {
      const res = await sendChatMessage(
        msg,
        activeSessionId || undefined,
        stateScheme?._id
      );

      // If new session created, reload sessions
      if (!activeSessionId) {
        setSessions((prev) => [res.session, ...prev]);
        setActiveSessionId(res.session._id);
      } else {
        loadSessions(); // Reload to update last message time
      }
      
      // Fetch full history logs to replace baseline optimistic bubble
      loadMessages(res.session._id);
    } catch (e: any) {
      toast.error(e.message || "Failed to process conversational query.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async (sid: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteChatSession(sid);
      toast.success("Conversation deleted.");
      const updated = sessions.filter((s) => s._id !== sid);
      setSessions(updated);
      if (activeSessionId === sid) {
        setActiveSessionId(updated.length > 0 ? updated[0]._id : "");
      }
    } catch (e) {
      toast.error("Failed to delete session.");
    }
  };

  const handleCopyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Message copied!");
  };

  return (
    <main className="min-h-screen bg-[#FAF8F3] font-sans pb-24 md:pb-0">
      <Header />

      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Top header navigation row */}
          <div className="flex justify-between items-center">
            <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
              <FaArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Dashboard
            </Button>
            <Badge variant="accent">AI Caseworker Assistant</Badge>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            
            {/* LEFT COLUMN: CONVERSATION HISTORY & QUICK PROMPTS */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* History sessions card */}
              <Card className="border border-[#0F172A]/5 p-5 bg-white shadow-premium rounded-3xl space-y-4">
                <SectionHeader title="Conversations" />
                
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold py-2">No past history logs.</p>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
                    {sessions.map((s) => (
                      <div
                        key={s._id}
                        className={`flex justify-between items-center gap-2 p-2.5 rounded-xl cursor-pointer text-xs font-bold transition ${
                          activeSessionId === s._id
                            ? "bg-[#14B8A6]/10 text-[#0F172A]"
                            : "text-slate-500 hover:text-[#0F172A] hover:bg-slate-50"
                        }`}
                      >
                        <span onClick={() => setActiveSessionId(s._id)} className="truncate flex-1">
                          {s.title}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteSession(s._id)}
                          className="text-slate-300 hover:text-rose-500 transition"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="secondary" size="sm" onClick={() => setActiveSessionId("")} className="w-full">
                  + Start New Chat
                </Button>
              </Card>

              {/* Suggested prompts card */}
              <Card className="border border-[#0F172A]/5 p-5 bg-white shadow-premium rounded-3xl space-y-4">
                <SectionHeader title="Quick Actions" />
                
                <div className="grid grid-cols-1 gap-2.5">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s.text)}
                      className="p-3 text-left border border-slate-100 bg-[#FAF8F3] hover:border-[#14B8A6] rounded-2xl text-xs font-semibold text-slate-700 leading-snug flex items-center gap-2.5 transition"
                    >
                      <span className="text-base">{s.icon}</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN: MAIN CHAT PANEL */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Target Context header */}
              {stateScheme && (
                <Card className="border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-4 rounded-3xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-[#0D9488] uppercase tracking-widest block">Discussing context</span>
                    <h4 className="font-serif text-sm font-extrabold text-[#0F172A]">{stateScheme.scheme_name}</h4>
                  </div>
                  <Badge variant="accent">Verification Active</Badge>
                </Card>
              )}

              {/* Dialogue logs stream */}
              <Card className="border border-[#0F172A]/5 p-6 bg-white shadow-premium rounded-3xl h-[460px] flex flex-col justify-between space-y-4">
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                  {messages.length === 0 ? (
                    <EmptyState
                      title="Ground AI Welfare Advisor"
                      description="Ask about document checklists, comparisons, or benefits summaries. Answers are strictly verified against government source files."
                    />
                  ) : (
                    messages.map((m, idx) => {
                      const isBot = m.sender === "assistant";
                      return (
                        <div key={m._id || idx} className={`flex gap-3 items-start ${isBot ? "" : "justify-end"}`}>
                          
                          {isBot && (
                            <div className="h-8 w-8 rounded-full bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6] flex-shrink-0">
                              <FaRobot />
                            </div>
                          )}

                          <div className="space-y-3 max-w-[85%]">
                            
                            {/* Dialogue bubble */}
                            <div className={`p-4 rounded-3xl text-xs font-semibold leading-relaxed ${
                              isBot
                                ? "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none"
                                : "bg-[#0F172A] text-white rounded-tr-none shadow-soft"
                            }`}>
                              
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-2 border border-slate-200 rounded-xl">
                                      <table className="min-w-full divide-y divide-slate-200 text-[10px]" {...props} />
                                    </div>
                                  ),
                                  th: ({ node, ...props }) => <th className="bg-slate-100 px-3 py-2 text-left font-black text-slate-700" {...props} />,
                                  td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-slate-100 font-medium" {...props} />,
                                }}
                              >
                                {m.text}
                              </ReactMarkdown>

                              {isBot && (
                                <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200/50 text-[10px] text-slate-400 font-bold">
                                  <span>Confidence: <strong className="text-[#14B8A6]">{m.confidence}</strong></span>
                                  
                                  <div className="flex gap-2.5">
                                    <button onClick={() => handleVoicePlayback(m.text)} className="hover:text-slate-600 transition flex items-center gap-0.5"><FaVolumeUp /> Speech</button>
                                    <button onClick={() => handleCopyText(m.text)} className="hover:text-slate-600 transition flex items-center gap-0.5"><FaCopy /> Copy</button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Citations panel drawer */}
                            {isBot && m.citations && m.citations.length > 0 && (
                              <div className="space-y-1.5 pl-3">
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Grounded Citations</span>
                                <div className="flex flex-wrap gap-2">
                                  {m.citations.map((c, cIdx) => (
                                    <a
                                      key={cIdx}
                                      href={c.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-[#FAF8F3] border border-slate-100 hover:border-[#14B8A6] px-2 py-1 rounded-xl text-[9px] font-bold text-slate-500 transition"
                                    >
                                      <FaExternalLinkAlt size={8} /> {c.title}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Caseworker explanation card */}
                            {isBot && m.explainability && (
                              <div className="pl-3 border-l-2 border-[#14B8A6]/20 py-0.5 space-y-1">
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block"> Caseworker Explanation</span>
                                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                                  {m.explainability}
                                </p>
                              </div>
                            )}

                          </div>

                        </div>
                      );
                    })
                  )}
                  
                  <div ref={scrollRef} />
                </div>

                {/* Input Text Form bar */}
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={handleToggleRecord}
                    className={`p-3 rounded-2xl border transition ${
                      isRecording
                        ? "bg-rose-50 border-rose-200 text-rose-500 animate-pulse"
                        : "bg-[#FAF8F3] border-slate-100 text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {isRecording ? <FaMicrophoneSlash size={14} /> : <FaMicrophone size={14} />}
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={sending}
                    placeholder="Ask AI Copilot followups (e.g. Compare my schemes)..."
                    className="flex-1 px-4 py-3 text-xs bg-[#FAF8F3] border border-slate-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] font-medium text-slate-800"
                  />

                  <Button onClick={() => handleSend()} disabled={sending || !inputMessage.trim()} className="p-3">
                    <FaPaperPlane size={12} />
                  </Button>
                </div>

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
