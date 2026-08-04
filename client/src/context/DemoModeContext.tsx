import React, { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

interface DemoModeContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  enableDemoMode: () => {},
  disableDemoMode: () => {},
});

export const DEMO_PROFILE = {
  name: "Kamla Devi",
  age: "45",
  gender: "Female",
  state: "Uttar Pradesh",
  district: "Varanasi",
  occupation: "Farmer",
  income: "120000",
  education: "Primary",
  disability: "No",
  language: "Hindi",
  phone: "+91 98765 43210",
  consent_given: true,
  farmer: true,
};

export const DEMO_MATCHES = [
  {
    _id: "s1",
    scheme_name: "PM Kisan Samman Nidhi",
    category: "Agriculture",
    level: "Central",
    score: 98,
    summary: "Direct income support of ₹6,000 per year in 3 equal installments to small & marginal cultivable landholding farmer families.",
    state_applicability: ["All"],
    eligibility_rules: { min_age: 18, max_age: 120, occupation: "Farmer", income_limit: 200000 },
    benefits: ["₹6,000 per year direct benefit transfer", "Seed & fertilizer subsidy support", "3 equal installments of ₹2,000"],
    required_documents: ["Aadhaar Card", "Landholding Ownership Records", "Bank Account Details"],
    official_link: "https://pmkisan.gov.in"
  },
  {
    _id: "s2",
    scheme_name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    category: "Agriculture",
    level: "Central",
    score: 94,
    summary: "Comprehensive crop insurance scheme providing financial support to farmers suffering crop loss/damage arising out of non-preventable natural risks.",
    state_applicability: ["All"],
    eligibility_rules: { min_age: 18, max_age: 120, occupation: "Farmer" },
    benefits: ["Insurance coverage against crop failure", "Low premium rates (1.5% to 2%)", "Direct claim settlement to bank account"],
    required_documents: ["Aadhaar Card", "Land Sowing Certificate", "Bank Account Passbook"],
    official_link: "https://pmfby.gov.in"
  },
  {
    _id: "s3",
    scheme_name: "PM SVANidhi Scheme",
    category: "Business Aid",
    level: "Central",
    score: 88,
    summary: "Special micro-credit facility providing collateral-free working capital loan up to ₹50,000 for urban and rural vendors.",
    state_applicability: ["All"],
    eligibility_rules: { min_age: 18, max_age: 120, occupation: "Any", income_limit: 300000 },
    benefits: ["Collateral-free working capital loan", "7% interest subsidy on timely repayment", "Cashback incentives on digital transactions"],
    required_documents: ["Aadhaar Card", "Vending Certificate / Identity Card", "Bank Passbook"],
    official_link: "https://pmsvanidhi.mohua.gov.in"
  },
  {
    _id: "s4",
    scheme_name: "Pradhan Mantri Matru Vandana Yojana",
    category: "Women Empowerment",
    level: "Central",
    score: 86,
    summary: "Maternity benefit program providing cash incentive of ₹5,000 directly to bank accounts of pregnant women and lactating mothers.",
    state_applicability: ["All"],
    eligibility_rules: { min_age: 19, max_age: 50, occupation: "Any" },
    benefits: ["₹5,000 direct cash incentive", "Health & nutrition guidance", "Free maternal health checkups"],
    required_documents: ["Aadhaar Card", "MCP Card", "Bank Account Passbook"],
    official_link: "https://wcd.nic.in"
  }
];

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem("setu_demo_mode") === "true";
  });

  const enableDemoMode = () => {
    localStorage.setItem("setu_demo_mode", "true");
    localStorage.setItem("profile", JSON.stringify(DEMO_PROFILE));
    localStorage.setItem("latestMatches", JSON.stringify(DEMO_MATCHES));
    localStorage.setItem("simulationCount", "3");
    localStorage.setItem(
      "generatedDrafts",
      JSON.stringify([
        {
          id: "draft-1",
          name: "PM Kisan Application Letter",
          generatedAt: new Date().toISOString(),
        },
      ])
    );
    setIsDemoMode(true);
    toast.success("Demo Mode Activated! Loaded profile for Kamla Devi (Farmer, UP)", {
      duration: 4000,
    });
  };

  const disableDemoMode = () => {
    localStorage.removeItem("setu_demo_mode");
    setIsDemoMode(false);
    toast.dismiss();
    toast("Demo Mode Deactivated.", { icon: "ℹ️" });
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enableDemoMode, disableDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => useContext(DemoModeContext);
