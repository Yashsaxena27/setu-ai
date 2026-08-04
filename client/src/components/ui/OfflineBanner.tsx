import { useState, useEffect } from "react";
import { FaExclamationCircle } from "react-icons/fa";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-md relative z-50 animate-fade-in">
      <FaExclamationCircle className="h-4 w-4" />
      <span>Offline Mode Active: You are currently disconnected from the internet. Cached scheme data is still accessible.</span>
    </div>
  );
}
