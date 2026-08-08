import UserApplication from "../models/UserApplication";

export interface StatusUpdatePayload {
  userId: string;
  schemeId: string;
  schemeName: string;
  status: string;
  current_stage?: string;
  next_action?: string;
  pending_documents?: string[];
  reference_number?: string;
  rejection_reason?: string;
  source: "manual" | "adapter_sync";
}

export class GovernmentStatusAdapter {
  
  /**
   * Updates or creates a user application status.
   */
  static async updateApplicationStatus(payload: StatusUpdatePayload) {
    const {
      userId,
      schemeId,
      schemeName,
      status,
      current_stage,
      next_action,
      pending_documents,
      reference_number,
      rejection_reason,
      source,
    } = payload;

    const existing = await UserApplication.findOne({
      user_id: userId,
      scheme_id: schemeId,
    });

    if (existing) {
      existing.status = status as any;
      existing.last_updated = new Date();
      existing.status_source = source;
      
      if (current_stage) existing.current_stage = current_stage;
      if (next_action) existing.next_action = next_action;
      if (pending_documents) existing.pending_documents = pending_documents;
      if (reference_number) existing.reference_number = reference_number;
      if (rejection_reason) existing.rejection_reason = rejection_reason;
      
      if (status === "Submitted" && !existing.submitted_date) {
        existing.submitted_date = new Date();
      }

      await existing.save();
      return existing;
    } else {
      const newApp = new UserApplication({
        user_id: userId,
        scheme_id: schemeId,
        scheme_name: schemeName,
        status: status as any,
        current_stage,
        next_action,
        pending_documents,
        reference_number,
        rejection_reason,
        status_source: source,
        submitted_date: status === "Submitted" ? new Date() : undefined,
      });

      await newApp.save();
      return newApp;
    }
  }

  /**
   * Mock sync function to demonstrate future government API integrations.
   * In a real world scenario, this would call UMANG / state portals.
   */
  static async simulateGovernmentSync(userId: string) {
    const applications = await UserApplication.find({
      user_id: userId,
      status: { $in: ["Submitted", "Under Review", "Additional Information Required"] }
    });

    const updates = [];

    for (const app of applications) {
      // Simulate random progression
      if (app.status === "Submitted") {
        app.status = "Under Review";
        app.current_stage = "Document Verification";
        app.status_source = "adapter_sync";
        app.last_updated = new Date();
        await app.save();
        updates.push({ scheme: app.scheme_name, new_status: app.status });
      }
    }

    return updates;
  }
}
