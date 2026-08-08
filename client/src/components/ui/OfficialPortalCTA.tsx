import { FaExternalLinkAlt } from "react-icons/fa";

interface OfficialPortalCTAProps {
  url: string;
  className?: string;
}

export default function OfficialPortalCTA({ url, className = "" }: OfficialPortalCTAProps) {
  if (!url) return null;

  let domain = "";
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname.replace(/^www\./, "");
  } catch (e) {
    domain = url; // Fallback to raw string if invalid URL
  }

  const isGov = domain.endsWith(".gov.in") || domain.endsWith(".nic.in");

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
      >
        <span>Apply on Official Portal</span>
        <FaExternalLinkAlt className="text-xs opacity-80" />
      </a>
      <div className="flex items-center justify-center text-xs text-slate-500 font-medium">
        <span>Proceeding to: </span>
        <span className={`ml-1 ${isGov ? "text-green-700" : "text-slate-700"}`}>{domain}</span>
        {isGov && (
          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-800 font-bold uppercase tracking-wider">
            Verified Govt Link
          </span>
        )}
      </div>
    </div>
  );
}
