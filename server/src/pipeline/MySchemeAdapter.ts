import fs from "fs";
import path from "path";
import { BaseAdapter, StandardizedScheme } from "./BaseAdapter";

export class MySchemeAdapter extends BaseAdapter {
  constructor() {
    super("myscheme");
  }

  async fetchAll(): Promise<any[]> {
    // Stub implementation: reads from local schemes.json
    // In production, this would make HTTP requests to the API Setu endpoint
    return new Promise((resolve, reject) => {
      const dataPath = path.join(__dirname, "../data/schemes.json");
      fs.readFile(dataPath, "utf8", (err, data) => {
        if (err) {
          return reject(err);
        }
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  normalize(rawData: any): StandardizedScheme {
    // Since we are mocking using our own data structure for the stub,
    // we just pass it through with some sanity checks.
    // In a real adapter, we'd map API fields to StandardizedScheme fields.
    return {
      source_id: rawData.id || rawData.scheme_name, // fallback if no ID
      source_provider: this.providerName,
      scheme_name: rawData.scheme_name,
      category: rawData.category || "General",
      level: rawData.level || "Central",
      state_applicability: rawData.state_applicability || [],
      eligibility_rules: rawData.eligibility_rules || {},
      benefits: rawData.benefits || [],
      required_documents: rawData.required_documents || [],
      application_steps: rawData.application_steps || [],
      official_link: rawData.official_link || "",
      summary_text: rawData.summary_text || "",
      tags: rawData.tags || [],
      department: rawData.department || ""
    };
  }
}
