import User from "../models/user";
import DocumentVerification from "../models/DocumentVerification";
import ApplicationScore from "../models/ApplicationScore";
import ApplicationRoadmap from "../models/ApplicationRoadmap";
import ChatMessage from "../models/ChatMessage";
import Scheme from "../models/Scheme";
import { findMatchingSchemes } from "./matchingService";

import { aiOrchestrator } from "./AIOrchestratorService";
import { sanitizeForPrompt } from "../utils/promptSanitizer";

export async function retrieveContextInternal(userId: string, schemeId?: string) {
  const profile = await User.findById(userId) as any;
  if (!profile) throw new Error("User profile not found");

  // Fetch matched schemes
  const matches = await findMatchingSchemes(profile);
  const matchedIds = matches.map((m) => m._id.toString());

  // Fetch documents, success scores, and roadmaps
  const uploads = await DocumentVerification.find({ user_id: userId });
  const scores = await ApplicationScore.find({ user_id: userId });
  const roadmaps = await ApplicationRoadmap.find({ user_id: userId });

  let targetScheme: any = null;
  if (schemeId) {
    targetScheme = await Scheme.findById(schemeId);
  }

  return {
    profile: {
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      state: profile.state,
      occupation: profile.occupation,
      income: profile.income,
      education: profile.education,
      disability: profile.disability,
      farmer: profile.farmer,
    },
    matchedSchemes: matches.map((m) => ({
      id: m._id,
      name: m.scheme_name,
      category: m.category,
    })),
    uploadsList: uploads.map((u: any) => ({
      document_type: u.document_type || u.documentType,
      validation_status: u.validation_status,
      readiness_score: u.readiness_score,
      expiry_date: u.expiry_date || u.expiryDate,
    })),
    scoresList: scores.map((s) => ({
      scheme_id: s.scheme_id,
      overall_score: s.overall_score,
      recommendations: s.recommendations,
      risk_flags: s.risk_flags,
    })),
    roadmapsList: roadmaps.map((r) => ({
      scheme_id: r.scheme_id,
      completion_percentage: r.completion_percentage,
      estimated_completion: r.estimated_completion,
      current_step: r.current_step,
    })),
    targetScheme: targetScheme ? {
      name: targetScheme.scheme_name,
      category: targetScheme.category,
      benefits: targetScheme.benefits,
      required_documents: targetScheme.required_documents,
      official_link: targetScheme.official_link,
      summary_text: targetScheme.summary_text,
    } : null,
  };
}

export async function generateGroundedAnswerInternal(
  userId: string,
  sessionId: string,
  query: string,
  schemeId?: string
) {
  const context = await retrieveContextInternal(userId, schemeId);
  
  // Load conversation history messages (limit to last 6)
  const history = await ChatMessage.find({ session_id: sessionId })
    .sort({ createdAt: -1 })
    .limit(6);
  
  const historyRev = [...history].reverse();

  const promptBuilderFn = () => `
You are an expert government welfare advisor.
Provide a highly grounded, helpful, and professional answer to the citizen's query.

CRITICAL RULES:
1. Ground your answer ONLY in the provided RAG Context.
2. If the context does not contain enough information to answer, state: "I am sorry, but that details is not verified in the retrieved government sources."
3. Never use model memory or general knowledge to answer questions outside of welfare context.
4. Auto-detect user language (English, Hindi, Hinglish) and reply in the same language.
5. Return ONLY a valid JSON block matching this exact TypeScript structure:
{
  "text": "Markdown formatted answer. bullet lists and tables are allowed. code blocks are NOT allowed.",
  "citations": [
    { "title": "Scheme Name or Document Name", "url": "https://gov-link.gov.in", "verified_date": "Date string" }
  ],
  "confidence": "High" | "Medium" | "Low",
  "explainability": "Why this answer was generated. Caseworker reasoning details, retrieved sources..."
}

RAG Context:
${sanitizeForPrompt(context)}

Dialogue History:
${historyRev.map(h => `${h.sender === "user" ? "Citizen" : "Advisor"}: ${h.text}`).join("\n")}

Citizen Query:
"${query}"

JSON Output:
`;

  try {
    const parsed = await aiOrchestrator.request({
      taskType: "copilot-chat",
      profile: context.profile,
      schemeId,
      promptBuilderFn,
      extraData: { sessionId, query }
    });

    // Save User message
    const userMsg = new ChatMessage({
      session_id: sessionId,
      sender: "user",
      text: query,
    });
    await userMsg.save();

    // Save Assistant message
    const botMsg = new ChatMessage({
      session_id: sessionId,
      sender: "assistant",
      text: parsed.text || (parsed.text === "" ? "" : "I am analyzing your matching welfare credentials..."),
      citations: parsed.citations || [],
      confidence: parsed.confidence || "High",
      explainability: parsed.explainability || "Retrieved context from Setu AI matching pipelines.",
    });
    await botMsg.save();

    return botMsg;
  } catch (e) {
    console.error("Conversational AI Copilot error:", e);
    // Fallback save in case of error
    const userMsg = new ChatMessage({
      session_id: sessionId,
      sender: "user",
      text: query,
    });
    await userMsg.save();

    const botMsg = new ChatMessage({
      session_id: sessionId,
      sender: "assistant",
      text: "I am sorry, I encountered a temporary processing error. Please rephrase your query.",
      citations: [],
      confidence: "Low",
      explainability: "RAG prompt assembly failure.",
    });
    await botMsg.save();

    return botMsg;
  }
}
