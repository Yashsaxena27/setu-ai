import { useState, useEffect } from "react";
import AnimatedCounter from "../effects/AnimatedCounter";
import { api } from "../../services/api";

interface StatsData {
  applicationsGenerated: number;
  schemesMatched: number;
  estimatedBenefits: string;
  familiesHelped: number;
  statesCovered: number;
}

export default function ImpactCounter() {
  const [stats, setStats] = useState<StatsData>({
    applicationsGenerated: 1240,
    schemesMatched: 86,
    estimatedBenefits: "₹4.8 Cr+",
    familiesHelped: 450,
    statesCovered: 28,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api<{ success: boolean; stats: StatsData }>("/health/stats");
        if (res?.success && res.stats) {
          setStats(res.stats);
        }
      } catch (e) {
        // Silent fallback to seed defaults
      }
    }
    fetchStats();
  }, []);

  const items = [
    { label: "Applications Generated", value: `${stats.applicationsGenerated.toLocaleString()}+`, desc: "Draft application letters prepared" },
    { label: "Verified Schemes", value: `${stats.schemesMatched}+`, desc: "Indexed from government portals" },
    { label: "Benefits Discovered", value: stats.estimatedBenefits, desc: "Total potential financial aid mapped" },
    { label: "Families Helped", value: `${stats.familiesHelped.toLocaleString()}+`, desc: "Household profiles analyzed" },
    { label: "States Covered", value: `${stats.statesCovered}`, desc: "Pan-India scheme eligibility mapping" },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
        {items.map((item, i) => (
          <div key={i} className="space-y-1 p-4 rounded-2xl bg-white/60 border border-[#0F172A]/5 shadow-soft backdrop-blur-xs">
            <p className="font-serif text-3xl sm:text-4xl font-black text-[#0F172A]">
              <AnimatedCounter value={item.value} />
            </p>
            <p className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">{item.label}</p>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
