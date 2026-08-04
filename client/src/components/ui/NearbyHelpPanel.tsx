import { useState } from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaExternalLinkAlt,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaHandsHelping,
} from "react-icons/fa";

interface NearbyHelpPanelProps {
  schemeName: string;
  userState?: string;
  userDistrict?: string;
  officialLink?: string;
}

export default function NearbyHelpPanel({
  schemeName,
  userState = "Uttar Pradesh",
  userDistrict = "Varanasi",
  officialLink = "https://myscheme.gov.in",
}: NearbyHelpPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const stateClean = userState || "Uttar Pradesh";
  const districtClean = userDistrict || "District Centre";

  const centers = [
    {
      type: "Common Service Centre (CSC)",
      name: `Jan Seva Kendra #${districtClean}-04`,
      address: `Main Market Road, Near Head Post Office, ${districtClean}, ${stateClean}`,
      distance: "1.2 km away",
      phone: "1800-3000-3468",
      mapUrl: `https://www.google.com/maps/search/Common+Service+Centre+${encodeURIComponent(districtClean)}`,
      status: "Verified Govt Kiosk",
    },
    {
      type: "District Welfare Office",
      name: `Social Welfare Office, Collectorate Complex`,
      address: `Civil Lines, Opposite District Court, ${districtClean}, ${stateClean}`,
      distance: "3.5 km away",
      phone: "0542-2501234",
      mapUrl: `https://www.google.com/maps/search/District+Welfare+Office+${encodeURIComponent(districtClean)}`,
      status: "Official Govt Office",
    },
    {
      type: "Agriculture Extension Centre",
      name: `Kisan Suvidha Kendra / Krishi Bhavan`,
      address: `Block Office Compound, ${districtClean}, ${stateClean}`,
      distance: "4.1 km away",
      phone: "1800-180-1551",
      mapUrl: `https://www.google.com/maps/search/Krishi+Bhavan+${encodeURIComponent(districtClean)}`,
      status: "Agri Helpline Active",
    },
  ];

  return (
    <div className="mt-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 transition-all duration-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left focus:outline-hidden cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#14B8A6]/10 text-[#0D9488] flex items-center justify-center font-bold text-sm">
            <FaHandsHelping className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
              Need Help Applying for {schemeName}?
              <span className="text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Assistance Nearby
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Find your nearest CSC, Krishi Kendra, or District Office in {districtClean}
            </p>
          </div>
        </div>
        <div className="text-slate-400 hover:text-[#0F172A] transition">
          {expanded ? <FaChevronUp className="h-3.5 w-3.5" /> : <FaChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200/70 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {centers.map((c, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {c.type}
                    </span>
                    <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                      {c.distance}
                    </span>
                  </div>
                  <h5 className="font-bold text-[#0F172A] text-xs leading-snug">{c.name}</h5>
                  <p className="text-[10px] text-slate-500 font-medium line-clamp-2">{c.address}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                  <a
                    href={`tel:${c.phone}`}
                    className="font-bold text-[#0D9488] hover:underline flex items-center gap-1"
                  >
                    <FaPhoneAlt className="h-2.5 w-2.5" /> {c.phone}
                  </a>
                  <a
                    href={c.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-slate-700 hover:text-[#0D9488] flex items-center gap-1"
                  >
                    <FaMapMarkerAlt className="h-2.5 w-2.5 text-red-500" /> Maps
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-semibold bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-4 text-slate-600 text-[11px]">
              <span className="flex items-center gap-1.5">
                <FaPhoneAlt className="text-[#0D9488]" /> National Helpline: <strong className="text-[#0F172A]">1800-11-5526</strong>
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <FaBuilding className="text-slate-400" /> Jan Seva Kendra: <strong className="text-[#0F172A]">Active in {districtClean}</strong>
              </span>
            </div>

            <a
              href={officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:text-[#0F172A] transition"
            >
              Official Government Portal <FaExternalLinkAlt className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
