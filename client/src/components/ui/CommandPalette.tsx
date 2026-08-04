import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaHome, FaUser, FaSlidersH, FaExchangeAlt, FaBell, FaCog, FaTimes } from "react-icons/fa";

interface NavOption {
  label: string;
  path: string;
  category: string;
  icon: any;
}

const COMMAND_OPTIONS: NavOption[] = [
  { label: "Home / Overview", path: "/", category: "Navigation", icon: FaHome },
  { label: "Citizen Dashboard", path: "/dashboard", category: "Portal", icon: FaUser },
  { label: "Profile Wizard", path: "/profile", category: "Setup", icon: FaUser },
  { label: "Eligibility Simulator", path: "/eligibility-simulator", category: "Sandbox", icon: FaSlidersH },
  { label: "Compare Schemes", path: "/compare", category: "Analysis", icon: FaExchangeAlt },
  { label: "Application Reminders", path: "/reminders", category: "Tracking", icon: FaBell },
  { label: "Account Settings", path: "/settings", category: "Preferences", icon: FaCog },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filtered = COMMAND_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setSearch("");
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-xs"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl rounded-2xl bg-white border border-[#0F172A]/10 shadow-premium overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 border-b border-slate-100 bg-[#FAF8F3]/50">
              <FaSearch className="text-slate-400 h-4 w-4 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search portal routes (e.g. Simulator, Profile, Compare)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-4 text-sm font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-hidden bg-transparent"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 transition cursor-pointer"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-slate-400">
                  No matching portal routes found.
                </div>
              ) : (
                filtered.map((item, index) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#14B8A6]/10 text-left transition duration-150 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#0F172A]/5 group-hover:bg-[#14B8A6]/20 flex items-center justify-center text-[#0F172A] group-hover:text-[#0D9488] transition">
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#0D9488]">
                            {item.label}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {item.category} • {item.path}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#0D9488]">
                        Jump ➔
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Hint */}
            <div className="px-4 py-2.5 bg-[#FAF8F3] border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">ESC</kbd> to exit</span>
              <span>Setu AI Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
