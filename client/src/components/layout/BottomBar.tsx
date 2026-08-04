import { Link, useLocation } from "react-router-dom";
import { FaHome, FaFolder, FaSlidersH, FaUser } from "react-icons/fa";

export default function BottomBar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: FaHome },
    { path: "/dashboard", label: "Dashboard", icon: FaFolder },
    { path: "/profile", label: "Profile", icon: FaUser },
    { path: "/eligibility-simulator", label: "Simulator", icon: FaSlidersH },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#0F172A]/5 bg-white/95 px-2 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.03)] backdrop-blur-md md:hidden">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 ${
                isActive ? "text-[#14B8A6]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}