import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import Scheme from "../models/Scheme";

dotenv.config();

console.log("MONGO_URI =", process.env.MONGO_URI);
console.log("NODE_ENV =", process.env.NODE_ENV);

async function seedSchemes() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    const filePath = path.join(__dirname, "../data/schemes.json");

    const rawData = fs.readFileSync(filePath, "utf-8");

    const schemes = JSON.parse(rawData);

    const updatedSchemes = schemes.map((scheme: any) => {
      const category = (scheme.category || "General").toLowerCase();
      let department = "Department of Social Welfare & Empowerment";
      let contactPhone = "+91 1800 111 363";
      let contactEmail = "support-welfare@nic.in";
      let website = scheme.official_link || "https://socialjustice.gov.in";
      let officeHours = "9:30 AM - 6:00 PM, Mon-Fri";
      let supportLanguages = ["Hindi", "English"];

      if (category.includes("agri") || category.includes("farm")) {
        department = "Department of Agriculture, Cooperation and Farmers Welfare";
        contactPhone = "+91 1800 180 1551";
        contactEmail = "support-kcc@gov.in";
        website = scheme.official_link || "https://agricoop.nic.in";
        officeHours = "9:00 AM - 6:00 PM, Mon-Sat";
        supportLanguages = ["Hindi", "English", "Kashmiri", "Punjabi", "Bengali", "Gujarati", "Marathi", "Telugu", "Tamil", "Kannada", "Malayalam"];
      } else if (category.includes("edu") || category.includes("student") || category.includes("scholarship")) {
        department = "Ministry of Education / Department of School Education";
        contactPhone = "+91 1800 116 023";
        contactEmail = "scholarships-edu@gov.in";
        website = scheme.official_link || "https://education.gov.in";
        officeHours = "9:30 AM - 5:30 PM, Mon-Fri";
        supportLanguages = ["English", "Hindi"];
      } else if (category.includes("hous") || category.includes("urban") || category.includes("rural")) {
        department = "Ministry of Housing and Urban Affairs";
        contactPhone = "+91 1800 113 300";
        contactEmail = "support-mohua@gov.in";
        website = scheme.official_link || "https://mohua.gov.in";
        officeHours = "9:00 AM - 5:30 PM, Mon-Fri";
        supportLanguages = ["English", "Hindi"];
      } else if (category.includes("business") || category.includes("finance") || category.includes("msme") || category.includes("industrial") || category.includes("employment")) {
        department = "Ministry of Micro, Small and Medium Enterprises";
        contactPhone = "+91 1800 223 224";
        contactEmail = "support-msme@gov.in";
        website = scheme.official_link || "https://msme.gov.in";
        officeHours = "9:00 AM - 6:00 PM, Mon-Fri";
        supportLanguages = ["English", "Hindi", "Regional"];
      } else if (category.includes("health") || category.includes("medical") || category.includes("family")) {
        department = "Ministry of Health and Family Welfare";
        contactPhone = "+91 1800 111 565";
        contactEmail = "support-ayushman@nic.in";
        website = scheme.official_link || "https://mohfw.gov.in";
        officeHours = "24/7 Helpline";
        supportLanguages = ["English", "Hindi", "All Major Regional Languages"];
      }

      return {
        ...scheme,
        department,
        contactPhone,
        contactEmail,
        website,
        officeHours,
        supportLanguages,
      };
    });

    await Scheme.deleteMany({});

    await Scheme.insertMany(updatedSchemes);

    console.log(`✅ ${schemes.length} schemes inserted successfully`);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedSchemes();