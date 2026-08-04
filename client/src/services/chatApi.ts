import { api } from "./api";

export interface Citation {
  title: string;
  url: string;
  verified_date: string;
}

export interface ChatMessageRecord {
  _id: string;
  session_id: string;
  sender: "user" | "assistant";
  text: string;
  citations: Citation[];
  confidence: "High" | "Medium" | "Low";
  explainability?: string;
  createdAt: string;
}

export interface ChatSessionRecord {
  _id: string;
  user_id: string;
  title: string;
  pinned: boolean;
  last_message_at: string;
  createdAt: string;
}

export function getChatSessions() {
  return api<{ success: boolean; sessions: ChatSessionRecord[] }>("/chat/sessions");
}

export function getChatMessages(sessionId: string) {
  return api<{ success: boolean; messages: ChatMessageRecord[] }>(`/chat/messages/${sessionId}`);
}

export function sendChatMessage(query: string, sessionId?: string, schemeId?: string) {
  return api<{
    success: boolean;
    message: ChatMessageRecord;
    session: ChatSessionRecord;
  }>("/chat/message", {
    method: "POST",
    body: JSON.stringify({ query, sessionId, schemeId }),
  });
}

export function deleteChatSession(sessionId: string) {
  return api<{ success: boolean; message: string }>(`/chat/session/${sessionId}`, {
    method: "DELETE",
  });
}
