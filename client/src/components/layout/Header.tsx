import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import MagneticButton from "../effects/MagneticButton";
import { Logo } from "../ui/BridgeLogo";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const hasConsent = localStorage.getItem("userConsent") === "true";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById("features");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById("features");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  function handleConfirmLogout() {
    setShowLogoutModal(false);
    logout();
    navigate("/");
  }

  return (
    <>
      <header className="sticky top-8 z-50 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div
          className={`glass rounded-full border border-[#0F172A]/10 px-6 sm:px-8 py-3.5 transition-all duration-300 ${
            scrolled ? "shadow-premium border-[#14B8A6]/20 bg-white/85" : "shadow-soft bg-white/70"
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo with Bridge Motif SVG */}
            <Link
              to="/"
              onClick={handleHomeClick}
              data-hover-target="true"
              className="group"
            >
              <Logo className="text-lg text-[#0F172A] group-hover:opacity-80 transition" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center justify-center flex-1 gap-4 lg:gap-7 lg:flex">
              <Link
                to="/"
                onClick={handleHomeClick}
                data-hover-target="true"
                className={`text-sm font-bold uppercase tracking-wider transition duration-200 ${
                  isActive("/") ? "text-[#14B8A6]" : "text-[#0F172A]/70 hover:text-[#14B8A6]"
                }`}
              >
                Home
              </Link>

              <a
                href="#features"
                onClick={handleFeaturesClick}
                data-hover-target="true"
                className="text-sm font-bold uppercase tracking-wider text-[#0F172A]/70 hover:text-[#14B8A6] transition duration-200"
              >
                Features
              </a>

              <Link
                to="/eligibility-simulator"
                data-hover-target="true"
                className={`text-sm font-bold uppercase tracking-wider transition duration-200 ${
                  isActive("/eligibility-simulator") ? "text-[#14B8A6]" : "text-[#0F172A]/70 hover:text-[#14B8A6]"
                }`}
              >
                Simulator
              </Link>

              {user && (
                <>
                  <Link
                    to="/dashboard"
                    data-hover-target="true"
                    className={`text-sm font-bold uppercase tracking-wider transition duration-200 ${
                      isActive("/dashboard") ? "text-[#14B8A6]" : "text-[#0F172A]/70 hover:text-[#14B8A6]"
                    }`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    state={{ from: "/", label: "Home" }}
                    data-hover-target="true"
                    className={`text-sm font-bold uppercase tracking-wider transition duration-200 ${
                      isActive("/profile") ? "text-[#14B8A6]" : "text-[#0F172A]/70 hover:text-[#14B8A6]"
                    }`}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/reminders"
                    data-hover-target="true"
                    className={`text-sm font-bold uppercase tracking-wider transition duration-200 ${
                      isActive("/reminders") ? "text-[#14B8A6]" : "text-[#0F172A]/70 hover:text-[#14B8A6]"
                    }`}
                  >
                    Reminders
                  </Link>

                  <Link
                    to="/settings"
                    data-hover-target="true"
                    className={`text-sm font-bold uppercase tracking-wider transition duration-200 ${
                      isActive("/settings") ? "text-[#14B8A6]" : "text-[#0F172A]/70 hover:text-[#14B8A6]"
                    }`}
                  >
                    Settings
                  </Link>

                  {!hasConsent && (
                    <Link
                      to="/consent"
                      data-hover-target="true"
                      className={`text-sm font-bold uppercase tracking-wider transition duration-200 ${
                        isActive("/consent") ? "text-[#14B8A6]" : "text-[#0F172A]/70 hover:text-[#14B8A6]"
                      }`}
                    >
                      Consent
                    </Link>
                  )}
                </>
              )}

            </nav>

            <div className="hidden items-center lg:flex flex-shrink-0 ml-4">
              {!user ? (
                <MagneticButton>
                  <Button onClick={() => navigate("/login")}>
                    Login
                  </Button>
                </MagneticButton>
              ) : (
                <Button
                  onClick={() => setShowLogoutModal(true)}
                  variant="danger"
                  data-hover-target="true"
                >
                  Logout
                </Button>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 text-[#0F172A] hover:bg-black/5 lg:hidden cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden md:hidden mt-2 rounded-2xl glass border border-[#0F172A]/10 p-5 shadow-premium"
            >
              <div className="flex flex-col gap-4 font-semibold text-sm">
                <Link
                  to="/"
                  onClick={handleHomeClick}
                  className="text-[#0F172A] hover:text-[#14B8A6] transition"
                >
                  Home
                </Link>

                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#0F172A] hover:text-[#14B8A6] transition"
                >
                  Features
                </a>

                {user && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[#0F172A] hover:text-[#14B8A6] transition"
                    >
                      Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      state={{ from: "/", label: "Home" }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[#0F172A] hover:text-[#14B8A6] transition"
                    >
                      Profile Wizard
                    </Link>

                    <Link
                      to="/reminders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[#0F172A] hover:text-[#14B8A6] transition"
                    >
                      Reminders
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[#0F172A] hover:text-[#14B8A6] transition"
                    >
                      Settings
                    </Link>
                  </>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-2">
                  {!user ? (
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/login");
                      }}
                      className="w-full justify-center"
                    >
                      Login
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      variant="danger"
                      className="w-full justify-center"
                    >
                      <FaSignOutAlt className="mr-2" /> Logout
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Logout Confirmation Dialog */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
      >
        <div className="space-y-6">
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Are you sure you want to log out of Setu AI? You will need to sign in again to access your saved matches, profile data, and drafts.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmLogout}
            >
              Confirm Logout
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}