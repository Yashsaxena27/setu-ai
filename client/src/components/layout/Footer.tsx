import { Link } from "react-router-dom";
import { FaArrowRight, FaWhatsapp, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-[#0F172A]/10 bg-white/80 backdrop-blur-md pt-12 pb-8 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-12 pb-12 border-b border-slate-100">
          
          {/* Brand & Description */}
          <div className="space-y-4 md:max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-serif font-black tracking-tight text-[#0F172A]">
              <svg className="h-6 w-6" viewBox="0 0 32 32" fill="none">
                <circle cx="6" cy="22" r="3" fill="#14B8A6" />
                <circle cx="26" cy="22" r="3" fill="#F59E0B" />
                <path
                  d="M 6 22 C 11 10, 21 10, 26 22"
                  stroke="#14B8A6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span>Setu AI</span>
            </Link>
            <p className="text-sm font-medium text-slate-500 max-w-xs">
              Bridging citizens to government schemes they deserve through simple eligibility discovery and WhatsApp assistance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-12 md:gap-20 lg:gap-24">
            {/* Explore */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]/50">Explore</h3>
            <ul className="space-y-3 text-sm font-semibold text-[#0F172A]/80">
              <li>
                <Link 
                  to="/" 
                  onClick={(e) => {
                    if (window.location.pathname === "/") {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className="hover:text-[#14B8A6] transition"
                >
                  Home
                </Link>
              </li>
              <li><a href="/#pipeline" className="hover:text-[#14B8A6] transition">How it works</a></li>
              <li><a href="/#features" className="hover:text-[#14B8A6] transition">Features</a></li>
              <li><Link to="/dashboard" className="hover:text-[#14B8A6] transition">Dashboard</Link></li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]/50">Actions</h3>
            <ul className="space-y-3 text-sm font-semibold text-[#0F172A]/80">
              <li>
                <Link to="/eligibility-simulator" className="group flex items-center gap-1.5 hover:text-[#14B8A6] transition">
                  Check eligibility <FaArrowRight className="h-3 w-3 text-slate-400 group-hover:text-[#14B8A6] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
              <li>
                <a href="https://wa.me/14155238886?text=join%20ball-military" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1.5 hover:text-[#14B8A6] transition">
                  WhatsApp bot <FaWhatsapp className="h-4 w-4 text-slate-400 group-hover:text-[#14B8A6]" />
                </a>
              </li>
            </ul>
            <p className="text-xs text-slate-400 mt-2">
              Demo: first send <span className="font-bold text-slate-600">join solve-motor</span> to <span className="font-bold text-slate-600">+1 415 523 8886</span>.
            </p>
          </div>

          {/* Trust */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]/50">Trust</h3>
            <ul className="space-y-3 text-sm font-semibold text-[#0F172A]/80">
              <li><Link to="/consent" className="hover:text-[#14B8A6] transition">Privacy & consent</Link></li>
              <li><a href="/#trust" className="hover:text-[#14B8A6] transition">Security</a></li>
            </ul>
          </div>

          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-xs font-semibold text-slate-600">
          <p className="text-center text-sm font-bold">© 2026 Setu AI. Built for Lenovo Leap Hackathon 2026.</p>
          <div className="hidden md:block text-slate-300">|</div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <span className="text-slate-600 font-bold">Built by:</span>
            <a href="https://www.linkedin.com/in/sparsh-gahoi-05a212342/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-800 font-extrabold hover:text-[#0A66C2] transition-colors">
              <FaLinkedin className="text-base text-[#0A66C2]" /> Sparsh Gahoi
            </a>
            <span className="text-slate-600 font-bold">&amp;</span>
            <a href="https://www.linkedin.com/in/yash-saxena-21490a308/?skipRedirect=true" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-800 font-extrabold hover:text-[#0A66C2] transition-colors">
              <FaLinkedin className="text-base text-[#0A66C2]" /> Yash Saxena
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}