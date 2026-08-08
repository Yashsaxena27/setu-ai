import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaWhatsapp,
  FaTimes,
  FaShieldAlt,
  FaCopy,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaSms,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

type ChannelType = "whatsapp" | "sms" | "voice" | "email";

export default function WhatsAppWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChannelType>("whatsapp");
  const [copiedText, setCopiedText] = useState("");

  const userName = user?.name ? user.name.split(" ")[0] : "Citizen";
  const twilioNumber = "+14155238886";
  const displayTwilioPhone = "+1 (415) 523-8886";
  const joinMessage = "join solve-motor";
  const emailAddress = "welfare@setu-ai.org";

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(""), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleLaunchWhatsApp = () => {
    const text = encodeURIComponent(joinMessage);
    window.open(`https://wa.me/14155238886?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleLaunchSMS = () => {
    const text = encodeURIComponent(
      `Name: ${userName}\nAge: 63\nState: Uttar Pradesh\nIncome: 90000\nWidow`
    );
    window.open(`sms:${twilioNumber}?body=${text}`, "_self");
  };

  const handleLaunchCall = () => {
    window.open(`tel:${twilioNumber}`, "_self");
  };

  const handleLaunchEmail = () => {
    const subject = encodeURIComponent("Government Scheme Help");
    const body = encodeURIComponent(
      `Name: ${userName}\nAge: 63\nIncome: 90000\nState: Uttar Pradesh\nWidow`
    );
    window.open(`mailto:${emailAddress}?subject=${subject}&body=${body}`, "_self");
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 font-sans flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3 w-80 sm:w-96 rounded-2xl bg-white border border-[#0F172A]/10 shadow-premium overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
                    <FaPhoneAlt className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold flex items-center gap-1.5">
                      Setu AI Channels
                      <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Multi-Channel Assistant
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs Selector */}
              <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider text-center">
                {(["whatsapp", "sms", "voice", "email"] as ChannelType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 transition duration-200 border-b-2 cursor-pointer ${
                      activeTab === tab
                        ? "border-[#14B8A6] text-[#14B8A6] bg-white"
                        : "border-transparent hover:text-[#0F172A]"
                    }`}
                  >
                    {tab === "whatsapp" && "WhatsApp"}
                    {tab === "sms" && "SMS"}
                    {tab === "voice" && "Voice"}
                    {tab === "email" && "Email"}
                  </button>
                ))}
              </div>

              {/* Content Panel */}
              <div className="p-4 space-y-4">
                {activeTab === "whatsapp" && (
                  <div className="space-y-3">
                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      <p className="font-bold text-[#0F172A] mb-1">🟢 Twilio WhatsApp Sandbox</p>
                      Send your personal details (Age, Income, Occupation, State) to find matches instantly on WhatsApp!
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500">Sandbox Code:</span>
                        <code className="font-mono font-bold text-[#0F172A]">{joinMessage}</code>
                        <button
                          onClick={() => handleCopy(joinMessage, "Command")}
                          className="text-[#14B8A6] hover:text-[#0f766e] cursor-pointer"
                        >
                          {copiedText === joinMessage ? <FaCheckCircle className="text-emerald-500 h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500">Phone:</span>
                        <span className="font-bold text-[#0F172A]">{displayTwilioPhone}</span>
                        <button
                          onClick={() => handleCopy(twilioNumber, "Phone Number")}
                          className="text-[#14B8A6] hover:text-[#0f766e] cursor-pointer"
                        >
                          {copiedText === twilioNumber ? <FaCheckCircle className="text-emerald-500 h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleLaunchWhatsApp}
                      className="w-full flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#16a34a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-soft cursor-pointer"
                    >
                      <FaWhatsapp className="h-4 w-4" /> Open WhatsApp Chat <FaExternalLinkAlt className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                )}

                {activeTab === "sms" && (
                  <div className="space-y-3">
                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      <p className="font-bold text-[#0F172A] mb-1">💬 Twilio Programmable SMS</p>
                      Interact via SMS text. SMS your profile parameters to get back a text summary list of qualifying schemes.
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <span className="text-slate-500">Send SMS to:</span>
                      <span className="font-bold text-[#0F172A]">{displayTwilioPhone}</span>
                      <button
                        onClick={() => handleCopy(twilioNumber, "Phone Number")}
                        className="text-[#14B8A6] hover:text-[#0f766e] cursor-pointer"
                      >
                        {copiedText === twilioNumber ? <FaCheckCircle className="text-emerald-500 h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleLaunchSMS}
                      className="w-full flex items-center justify-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-soft cursor-pointer"
                    >
                      <FaSms className="h-4 w-4" /> Compose Scheme SMS <FaExternalLinkAlt className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                )}

                {activeTab === "voice" && (
                  <div className="space-y-3">
                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      <p className="font-bold text-[#0F172A] mb-1">📞 Interactive Voice Helpline (IVR)</p>
                      Call the helpline to speak with Setu AI. The IVR transcribes your speech, finds schemes, and reads recommendations to you over the call!
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <span className="text-slate-500">Helpline Number:</span>
                      <span className="font-bold text-[#0F172A]">{displayTwilioPhone}</span>
                      <button
                        onClick={() => handleCopy(twilioNumber, "Phone Number")}
                        className="text-[#14B8A6] hover:text-[#0f766e] cursor-pointer"
                      >
                        {copiedText === twilioNumber ? <FaCheckCircle className="text-emerald-500 h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleLaunchCall}
                      className="w-full flex items-center justify-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-soft cursor-pointer"
                    >
                      <FaPhoneAlt className="h-3.5 w-3.5" /> Call Voice Assistant <FaExternalLinkAlt className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                )}

                {activeTab === "email" && (
                  <div className="space-y-3">
                    <div className="bg-[#FAF8F3] p-3 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                      <p className="font-bold text-[#0F172A] mb-1">✉️ Email Inbound Support</p>
                      Email your profile details to Setu AI and receive a beautiful HTML report containing matches, required documents checklists, and portals.
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <span className="text-slate-500">Email Address:</span>
                      <span className="font-bold text-[#0F172A] truncate max-w-[150px]">{emailAddress}</span>
                      <button
                        onClick={() => handleCopy(emailAddress, "Email")}
                        className="text-[#14B8A6] hover:text-[#0f766e] cursor-pointer"
                      >
                        {copiedText === emailAddress ? <FaCheckCircle className="text-emerald-500 h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleLaunchEmail}
                      className="w-full flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0F766E] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-soft cursor-pointer"
                    >
                      <FaEnvelope className="h-3.5 w-3.5" /> Draft Inbound Email <FaExternalLinkAlt className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                )}

                {/* Footnote */}
                <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 pt-1 border-t border-slate-50">
                  <FaShieldAlt className="text-[#14B8A6] h-3 w-3" />
                  <span>24/7 AI Welfare Assistant</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Multi-Channel Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center bg-[#0F172A] text-white p-3.5 rounded-full shadow-premium hover:bg-[#1E293B] transition-all duration-300 cursor-pointer"
          aria-label="Open Setu AI Channels Assistant"
        >
          <div className="flex items-center gap-1.5">
            <FaPhoneAlt className="h-4 w-4 shrink-0 text-[#14B8A6]" />
            <FaWhatsapp className="h-4.5 w-4.5 shrink-0 text-[#22C55E]" />
            <FaEnvelope className="h-4 w-4 shrink-0 text-[#38BDF8]" />
          </div>
          <span className="hidden sm:block max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[180px] group-hover:ml-2.5 transition-all duration-300 ease-in-out text-xs font-extrabold tracking-wide uppercase">
            AI Channels Assistant
          </span>
        </motion.button>
      </div>
    </>
  );
}
