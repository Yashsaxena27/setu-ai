import crypto from "crypto";
import AIResponseCache from "../models/AIResponseCache";

// In-memory retry queue type
interface RetryQueueItem {
  hash: string;
  taskType: string;
  profile: any;
  schemeId?: string;
  promptBuilderFn: () => string | Promise<string>;
  extraData?: any;
  retryCount: number;
  nextRunTime: number;
  backoffMs: number;
}

// In-memory batch type
interface PendingRequest {
  id: string;
  taskType: string;
  profile: any;
  schemeId?: string;
  promptBuilderFn: () => string | Promise<string>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  cacheKey: string;
  fallbackValue: any;
  extraData?: any;
}

class AIOrchestratorService {
  private aiClient: any = null;
  private retryQueue: Map<string, RetryQueueItem> = new Map();
  private pendingBatches: Map<string, PendingRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Periodically process retry queue (every 5 seconds)
    setInterval(() => this.processRetryQueue(), 5000);
  }

  private async getAIClient() {
    if (!this.aiClient) {
      const { GoogleGenAI } = await import("@google/genai");
      this.aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
      });
    }
    return this.aiClient;
  }

  // Deterministic profile string for caching and demo mode keying
  private getDeterministicProfileString(profile: any): string {
    if (!profile) return "";
    const keys = [
      "name", "age", "gender", "state", "district", "occupation",
      "income", "annual_income", "education", "disability", "language", "phone",
      "farmer", "employmentStatus", "studentStatus", "maritalStatus", "dependents"
    ];
    const obj: any = {};
    for (const k of keys) {
      if (profile[k] !== undefined && profile[k] !== null) {
        obj[k] = profile[k];
      }
    }
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  // Compute SHA-256 cache key
  public computeCacheKey(profile: any, schemeId: string | undefined, taskType: string): string {
    const profileStr = this.getDeterministicProfileString(profile);
    const schemeStr = schemeId ? String(schemeId) : "";
    return crypto
      .createHash("sha256")
      .update(profileStr + schemeStr + taskType)
      .digest("hex");
  }

  // Lookup in static fixtures for DEMO_MODE
  private getDemoFixture(taskType: string, profile: any, schemeId?: string): any {
    console.log(`[Demo Mode] Fetching fixture for task: ${taskType}`);

    // Return the Kamla Devi fixture strings
    if (taskType === "why-match") {
      return `- State eligibility matches Uttar Pradesh.
- Occupation criteria matches farmer.
- Income is within the eligible threshold of ₹1.2L.
- Age criteria is met.`;
    }

    if (taskType === "score-narrative") {
      return "Your profile completeness is at 100% and you meet the basic eligibility criteria for the scheme. Ensure you upload a clear scan of your Income Certificate and Aadhaar Card to maximize your verification quality score and avoid direct benefit transfer delays.";
    }

    if (taskType === "roadmap-tips") {
      return "You should upload your Farmer Certificate next. This takes around 15 minutes and will raise your Success Score by 15%.";
    }

    if (taskType === "ocr") {
      return {
        document_type: "Farmer Certificate",
        confidence: 98,
        ocr_data: {
          name: "Kamla Devi",
          dob: "15/08/1981",
          address: "Village Kunda, Pratapgarh, Uttar Pradesh",
          issue_date: "10/04/2024",
          expiry_date: null,
          document_number: "FMR-8274-1092",
          authority: "Revenue Dept, Govt of Uttar Pradesh"
        },
        quality_detection: {
          blur: false,
          low_resolution: false,
          cropping: false,
          missing_corners: false,
          dark_image: false,
          glare: false,
          unreadable_text: false,
          rotation: false,
          partial_scan: false
        }
      };
    }

    if (taskType === "household-recommendations") {
      return [
        "Apply for PM Kisan Samman Nidhi to receive agricultural income support.",
        "Submit applications for state-specific farming subsidies.",
        "Verify land registration records under Kamla Devi's name."
      ];
    }

    if (taskType === "simulation-change") {
      return "Earlier your demographic occupation was set as citizen. After changing it to farmer, you now qualify for farming-specific benefits and subsidies.";
    }

    if (taskType === "simulation-summary-text") {
      return "If this life event happens, you become eligible for 3 additional schemes worth approximately ₹15,000 in combined benefits.";
    }

    if (taskType === "copilot-chat") {
      return {
        text: "Hello Kamla Devi, as a farmer in Uttar Pradesh with an income of ₹1.2L, you qualify for several welfare programs including PM Kisan Samman Nidhi and state crop insurance. Let me know if you want to generate a draft application for these.",
        citations: [
          { title: "PM Kisan Samman Nidhi", url: "https://pmkisan.gov.in", verified_date: "2026-08-01" }
        ],
        confidence: "High",
        explainability: "Matches profile state (UP) and occupation (farmer)."
      };
    }

    if (taskType === "draft") {
      return `# Applicant Summary

The applicant meets the basic eligibility criteria for this scheme as a registered farmer.

# Eligibility

Verification indicates standard farmer registration is complete.

# Purpose

Cover letter generated for seeking Direct Benefit Transfer benefits under active agricultural schemes.

# Submission Advice

Verify the details and proceed with CSC offline portal submission.
`;
    }

    if (taskType === "impact-analysis") {
      return "You became eligible as the farmer subsidy age limit was lowered.";
    }

    if (taskType === "admin-insights") {
      return [
        "Farming scheme applications in UP rose by 35% this quarter.",
        "Outreach for low-income female farmers should be scaled up."
      ];
    }

    if (taskType === "digilocker-parse" || taskType === "parse-profile") {
      return {
        name: "Kamla Devi",
        dob: "1981-08-15",
        age: 45,
        gender: "Female",
        state: "Uttar Pradesh",
        district: "Pratapgarh",
        income: 120000,
        annual_income: 120000,
        occupation: "Farmer",
        disability: "No",
        farmer: true
      };
    }

    if (taskType === "embedding") {
      return Array(1536).fill(0.01);
    }

    return "Mock demo response.";
  }

  // Get fallback for rate-limit / errors
  private getFallbackValue(taskType: string): any {
    if (taskType === "why-match") {
      return `• This scheme appears to match your profile.
• Please verify the eligibility on the official government website.
• AI explanation is temporarily unavailable.`;
    }
    if (taskType === "score-narrative") {
      return "Your eligibility matches the requirements. However, missing or unverified documents affect your readiness score. Complete the checklist recommendations to maximize probability of approval.";
    }
    if (taskType === "roadmap-tips") {
      return "Based on your progress, you should upload your outstanding mandatory documents next to increase compliance. This will maximize your application success score.";
    }
    if (taskType === "household-recommendations") {
      return [
        "Prioritize pension schemes verification checks for elder members.",
        "Submit student scholarship drafts before academic submission cycles.",
        "Verify land records maps to register farmers benefits."
      ];
    }
    if (taskType === "simulation-change") {
      return "Earlier demographic constraints prevented eligibility. After updating your profile parameters, you now satisfy the criteria for this scheme.";
    }
    if (taskType === "simulation-summary-text") {
      return "If this life event occurs, you will gain eligibility for additional schemes. Please check the dashboard.";
    }
    if (taskType === "copilot-chat") {
      return {
        text: "I am sorry, I encountered a temporary processing error. Please rephrase your query.",
        citations: [],
        confidence: "Low",
        explainability: "System is temporarily busy."
      };
    }
    if (taskType === "ocr") {
      return {
        document_type: "Unknown Document",
        confidence: 0,
        ocr_data: {
          name: "Unavailable",
          dob: null,
          address: null,
          issue_date: null,
          expiry_date: null,
          document_number: null,
          authority: null
        },
        quality_detection: {
          blur: false, low_resolution: false, cropping: false, missing_corners: false,
          dark_image: false, glare: false, unreadable_text: false, rotation: false, partial_scan: false
        }
      };
    }
    return "Fallback response due to system rate limits.";
  }

  // The main unified request method
  public async request(params: {
    taskType: string;
    profile: any;
    schemeId?: string;
    promptBuilderFn: () => string | Promise<string>;
    extraData?: any;
  }): Promise<any> {
    const { taskType, profile, schemeId, promptBuilderFn, extraData } = params;

    // STEP 0.1: Check DEMO_MODE
    if (process.env.DEMO_MODE === "true") {
      return this.getDemoFixture(taskType, profile, schemeId);
    }

    // STEP 0.2: Compute cache key and check MongoDB cache
    const cacheKey = this.computeCacheKey(profile, schemeId, taskType);
    try {
      const cached = await AIResponseCache.findOne({ hash: cacheKey });
      if (cached) {
        console.log(`[Cache Hit] ${taskType} - Key: ${cacheKey}`);
        return cached.response;
      }
    } catch (err) {
      console.error("[Cache Lookup Error]", err);
    }

    // If it is in the retry queue currently as "generating"
    if (this.retryQueue.has(cacheKey)) {
      console.log(`[Retry Queue Active] Returning generating state for key: ${cacheKey}`);
      return this.getGeneratingStatus(taskType);
    }

    // Check if this task type is batchable
    const batchableTasks = [
      "why-match",
      "score-narrative",
      "roadmap-tips",
      "household-recommendations",
      "simulation-change",
      "simulation-summary-text"
    ];

    if (batchableTasks.includes(taskType)) {
      return new Promise((resolve, reject) => {
        const profileHashStr = this.getDeterministicProfileString(profile);
        if (!this.pendingBatches.has(profileHashStr)) {
          this.pendingBatches.set(profileHashStr, []);
        }

        const pending = this.pendingBatches.get(profileHashStr)!;
        const id = `req_${pending.length}`;
        pending.push({
          id,
          taskType,
          profile,
          schemeId,
          promptBuilderFn,
          resolve,
          reject,
          cacheKey,
          fallbackValue: this.getFallbackValue(taskType),
          extraData
        });

        // Setup debounced timer (50ms)
        if (this.batchTimers.has(profileHashStr)) {
          clearTimeout(this.batchTimers.get(profileHashStr)!);
        }

        this.batchTimers.set(
          profileHashStr,
          setTimeout(() => this.executeBatch(profileHashStr), 50)
        );
      });
    }

    // Non-batchable requests (multimodal OCR, copilot chat, embedding, etc.)
    return this.executeDirect(taskType, profile, schemeId, promptBuilderFn, extraData, cacheKey);
  }

  // Direct AI execution for non-batchable tasks
  private async executeDirect(
    taskType: string,
    profile: any,
    schemeId: string | undefined,
    promptBuilderFn: () => string | Promise<string>,
    extraData: any,
    cacheKey: string
  ): Promise<any> {
    try {
      const prompt = await promptBuilderFn();
      const aiClient = await this.getAIClient();

      let response;
      if (taskType === "ocr") {
        const mimeType = extraData?.mimeType || "image/jpeg";
        const cleanBase64 = extraData?.fileData || "";
        response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            prompt,
          ],
          config: {
            responseMimeType: "application/json",
          },
        });
      } else if (taskType === "copilot-chat" || taskType === "digilocker-parse" || taskType === "parse-profile") {
        response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
      } else {
        response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      }

      let resText = response.text || "";
      let finalResult: any = resText;

      // Try to parse JSON if output should be JSON
      if (taskType === "ocr" || taskType === "copilot-chat" || taskType === "digilocker-parse" || taskType === "parse-profile") {
        const cleaned = resText.replace(/```json/g, "").replace(/```/g, "").trim();
        finalResult = JSON.parse(cleaned);
      } else {
        finalResult = resText.trim();
      }

      // Store in cache
      await AIResponseCache.findOneAndUpdate(
        { hash: cacheKey },
        { hash: cacheKey, response: finalResult, taskType },
        { upsert: true, new: true }
      );

      return finalResult;
    } catch (err: any) {
      console.error(`[AI Orchestrator Error] ${taskType}:`, err);

      // Check for rate limit / 429
      if (this.isRateLimitError(err)) {
        console.warn(`[Rate Limit Hit] Enqueuing ${taskType} for key: ${cacheKey}`);
        this.enqueueRetry(cacheKey, taskType, profile, schemeId, promptBuilderFn, extraData);
        return this.getGeneratingStatus(taskType);
      }

      // Return fallback value immediately for other errors
      return this.getFallbackValue(taskType);
    }
  }

  // Execute a batch of requests
  private async executeBatch(profileHashStr: string) {
    const requests = this.pendingBatches.get(profileHashStr);
    this.pendingBatches.delete(profileHashStr);
    this.batchTimers.delete(profileHashStr);

    if (!requests || requests.length === 0) return;

    console.log(`[Batch Execution] Processing batch of ${requests.length} requests for profile hash.`);

    // If batch has size 1, execute direct to simplify
    if (requests.length === 1) {
      const r = requests[0];
      try {
        const val = await this.executeDirect(r.taskType, r.profile, r.schemeId, r.promptBuilderFn, r.extraData, r.cacheKey);
        r.resolve(val);
      } catch (err) {
        r.reject(err);
      }
      return;
    }

    try {
      const promptList = await Promise.all(
        requests.map(async (r) => {
          const individualPrompt = await r.promptBuilderFn();
          return `--- Request ID: ${r.id} ---
Task Type: ${r.taskType}
Instructions:
${individualPrompt}`;
        })
      );

      const masterPrompt = `
You are an expert government welfare AI caseworker.
Perform the following tasks for this applicant:

${promptList.join("\n\n")}

You MUST return a single JSON object. The keys of the JSON object MUST correspond to the Request IDs (e.g. "req_0", "req_1", etc.).
The values must be the results of the respective task.
- For text/paragraph responses, return the string.
- For structured arrays/objects, return the parsed array/object directly as the value.

Example JSON response format:
{
  "req_0": "- bullet 1\\n- bullet 2",
  "req_1": ["Insight 1", "Insight 2"]
}
`;

      const aiClient = await this.getAIClient();
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: masterPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resText = response.text || "";
      const cleaned = resText.replace(/```json/g, "").replace(/```/g, "").trim();
      const batchedJSON = JSON.parse(cleaned);

      for (const r of requests) {
        const value = batchedJSON[r.id] !== undefined ? batchedJSON[r.id] : r.fallbackValue;

        // Store in cache
        await AIResponseCache.findOneAndUpdate(
          { hash: r.cacheKey },
          { hash: r.cacheKey, response: value, taskType: r.taskType },
          { upsert: true }
        );

        r.resolve(value);
      }
    } catch (err: any) {
      console.error("[AI Orchestrator Batch Error]:", err);

      if (this.isRateLimitError(err)) {
        console.warn(`[Batch Rate Limit Hit] Enqueuing all ${requests.length} batch requests into retry queue.`);
        for (const r of requests) {
          this.enqueueRetry(r.cacheKey, r.taskType, r.profile, r.schemeId, r.promptBuilderFn, r.extraData);
          r.resolve(this.getGeneratingStatus(r.taskType));
        }
      } else {
        // Fallback resolve immediately
        for (const r of requests) {
          r.resolve(r.fallbackValue);
        }
      }
    }
  }

  // Embed content utility
  public async embed(text: string): Promise<number[]> {
    const cacheKey = crypto.createHash("sha256").update(text + "_embedding").digest("hex");

    if (process.env.DEMO_MODE === "true") {
      return this.getDemoFixture("embedding", null);
    }

    try {
      const cached = await AIResponseCache.findOne({ hash: cacheKey });
      if (cached) return cached.response;
    } catch (err) {
      console.error("[Cache Embedding lookup error]", err);
    }

    try {
      const aiClient = await this.getAIClient();
      const response = await aiClient.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });

      const values = response.embeddings?.[0]?.values || [];
      if (values.length > 0) {
        await AIResponseCache.findOneAndUpdate(
          { hash: cacheKey },
          { hash: cacheKey, response: values, taskType: "embedding" },
          { upsert: true }
        );
      }
      return values;
    } catch (err) {
      console.error("[AI Orchestrator Embedding Error]:", err);
      return Array(1536).fill(0.0);
    }
  }

  // Check if error is rate limit (429)
  private isRateLimitError(err: any): boolean {
    const errMsg = String(err.message || err.status || err.statusCode || "");
    return errMsg.includes("429") || errMsg.includes("Quota exceeded") || errMsg.includes("Rate limit");
  }

  // Push request to in-memory retry queue
  private enqueueRetry(
    hash: string,
    taskType: string,
    profile: any,
    schemeId: string | undefined,
    promptBuilderFn: () => string | Promise<string>,
    extraData: any
  ) {
    if (this.retryQueue.has(hash)) return;

    this.retryQueue.set(hash, {
      hash,
      taskType,
      profile,
      schemeId,
      promptBuilderFn,
      extraData,
      retryCount: 0,
      nextRunTime: Date.now() + 40000, // start at 40s
      backoffMs: 40000,
    });
  }

  // Asynchronous background retry processor
  private async processRetryQueue() {
    const now = Date.now();
    for (const [hash, item] of this.retryQueue.entries()) {
      if (now < item.nextRunTime) continue;

      console.log(`[Retry Queue Processing] Key: ${hash}, Task: ${item.taskType}, Attempt: ${item.retryCount + 1}`);

      try {
        // Execute direct
        const value = await this.executeDirectBackground(item);

        // Store to cache
        try {
          await AIResponseCache.findOneAndUpdate(
            { hash: item.hash },
            { hash: item.hash, response: value, taskType: item.taskType },
            { upsert: true }
          );
        } catch (dbErr) {
          console.error("[Retry Save Cache Error]", dbErr);
        }

        console.log(`[Retry Success] Successfully completed key: ${hash}`);
        this.retryQueue.delete(hash);
      } catch (err: any) {
        console.error(`[Retry Failed] Attempt ${item.retryCount + 1} failed:`, err);
        item.retryCount += 1;

        if (item.retryCount >= 2) {
          console.error(`[Retry Exhausted] Max retries reached. Saving fallback for key: ${hash}`);
          const fallback = this.getFallbackValue(item.taskType);
          try {
            await AIResponseCache.findOneAndUpdate(
              { hash: item.hash },
              { hash: item.hash, response: fallback, taskType: item.taskType },
              { upsert: true }
            );
          } catch (dbErr) {
            console.error("[Retry Save Fallback Error]", dbErr);
          }
          this.retryQueue.delete(hash);
        } else {
          // Exponential backoff: double the delay
          item.backoffMs *= 2;
          item.nextRunTime = Date.now() + item.backoffMs;
          console.log(`[Retry Scheduled] Rescheduled key: ${hash} in ${item.backoffMs / 1000}s`);
        }
      }
    }
  }

  private async executeDirectBackground(item: RetryQueueItem): Promise<any> {
    const prompt = await item.promptBuilderFn();
    const aiClient = await this.getAIClient();

    let response;
    if (item.taskType === "ocr") {
      const mimeType = item.extraData?.mimeType || "image/jpeg";
      const cleanBase64 = item.extraData?.fileData || "";
      response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: "application/json",
        },
      });
    } else if (item.taskType === "copilot-chat" || item.taskType === "digilocker-parse" || item.taskType === "parse-profile") {
      response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    } else {
      response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
    }

    const resText = response.text || "";
    if (item.taskType === "ocr" || item.taskType === "copilot-chat" || item.taskType === "digilocker-parse" || item.taskType === "parse-profile") {
      const cleaned = resText.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    }
    return resText.trim();
  }

  // Get generating state responses
  private getGeneratingStatus(taskType: string): any {
    if (taskType === "why-match") {
      return "Generating... please wait.";
    }
    if (taskType === "score-narrative") {
      return "Generating score explanation... please wait.";
    }
    if (taskType === "roadmap-tips") {
      return "Generating roadmap tips... please wait.";
    }
    if (taskType === "household-recommendations") {
      return ["Generating household recommendations... please wait."];
    }
    if (taskType === "simulation-change") {
      return "Generating simulation explanation... please wait.";
    }
    if (taskType === "simulation-summary-text") {
      return "Generating simulation summary... please wait.";
    }
    if (taskType === "copilot-chat") {
      return {
        text: "Generating answer... please wait.",
        citations: [],
        confidence: "Medium",
        explainability: "Asynchronous processing active."
      };
    }
    if (taskType === "ocr") {
      return {
        document_type: "Unknown Document",
        confidence: 0,
        ocr_data: {
          name: "Generating...",
          dob: null,
          address: null,
          issue_date: null,
          expiry_date: null,
          document_number: null,
          authority: null
        },
        quality_detection: {
          blur: false, low_resolution: false, cropping: false, missing_corners: false,
          dark_image: false, glare: false, unreadable_text: false, rotation: false, partial_scan: false
        }
      };
    }
    return "Generating... please refresh.";
  }
}

export const aiOrchestrator = new AIOrchestratorService();
