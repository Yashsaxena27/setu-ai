import { Request, Response } from "express";
import ChatSession from "../models/ChatSession";
import ChatMessage from "../models/ChatMessage";
import Scheme from "../models/Scheme";
import { generateGroundedAnswerInternal } from "../services/ConversationService";

export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sessions = await ChatSession.find({ user_id: userId }).sort({ last_message_at: -1 });

    res.json({
      success: true,
      sessions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { sessionId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Validate ownership
    const session = await ChatSession.findOne({ _id: sessionId, user_id: userId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    const messages = await ChatMessage.find({ session_id: sessionId }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { query, sessionId, schemeId } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!query) return res.status(400).json({ success: false, message: "Missing query parameter" });

    let sessionRecord: any = null;
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      // Create a new session
      let title = query.length > 25 ? query.substring(0, 25) + "..." : query;
      if (schemeId) {
        const sch = await Scheme.findById(schemeId);
        if (sch) title = `Discussing: ${sch.scheme_name}`;
      }

      sessionRecord = new ChatSession({
        user_id: userId,
        title,
      });
      await sessionRecord.save();
      activeSessionId = sessionRecord._id;
    } else {
      // Update session timestamp
      sessionRecord = await ChatSession.findOneAndUpdate(
        { _id: activeSessionId, user_id: userId },
        { last_message_at: new Date() },
        { new: true }
      );
      if (!sessionRecord) {
        return res.status(404).json({ success: false, message: "Chat session not found" });
      }
    }

    // Call grounded answer generator service
    const botMessage = await generateGroundedAnswerInternal(
      userId,
      activeSessionId.toString(),
      query,
      schemeId
    );

    res.status(201).json({
      success: true,
      message: botMessage,
      session: sessionRecord,
    });
  } catch (err: any) {
    console.error("SendMessage controller error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { sessionId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const session = await ChatSession.findOneAndDelete({ _id: sessionId, user_id: userId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    // Delete associated messages
    await ChatMessage.deleteMany({ session_id: sessionId });

    res.json({
      success: true,
      message: "Chat session and dialogue logs removed successfully",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
