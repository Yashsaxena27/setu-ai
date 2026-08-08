export interface NextBestAction {
  actionType: "COMPLETE_PROFILE" | "UPLOAD_DOCUMENT" | "APPLY_NOW" | "MONITOR_STATUS" | "REJECTION_RECOVERY" | "REVIEW_UPDATE" | "NO_ACTION";
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  route: string;
  requiredDocument?: string;
  deadline?: string;
}

export class NextBestActionService {
  
  static getNextBestAction(
    profile: any,
    scheme: any,
    applicationState: any, // UserApplication
    missingDocs: string[] = []
  ): NextBestAction {
    
    // 1. Rejected Status
    if (applicationState && applicationState.status === "Rejected") {
      return {
        actionType: "REJECTION_RECOVERY",
        title: "Application Rejected",
        description: "Review the rejection reason and generate a grievance.",
        priority: "High",
        route: `/application-roadmap/${scheme._id || scheme.id}?action=recovery`
      };
    }

    // 2. Active Application Tracking
    if (applicationState && ["Submitted", "Under Review"].includes(applicationState.status)) {
      return {
        actionType: "MONITOR_STATUS",
        title: "Application Under Processing",
        description: "Monitor your application status for any requests for additional information.",
        priority: "Low",
        route: `/application-roadmap/${scheme._id || scheme.id}`
      };
    }
    
    // 3. Additional Info Required
    if (applicationState && applicationState.status === "Additional Information Required") {
      return {
        actionType: "UPLOAD_DOCUMENT",
        title: "Action Required: Missing Info",
        description: "The authority has requested additional information. Please provide it before the deadline.",
        priority: "High",
        route: `/application-roadmap/${scheme._id || scheme.id}`
      };
    }

    // 4. Missing Documents before application
    if (missingDocs && missingDocs.length > 0) {
      return {
        actionType: "UPLOAD_DOCUMENT",
        title: "Prepare Required Documents",
        description: `Get your ${missingDocs[0]} first to complete your application readiness.`,
        priority: "Medium",
        requiredDocument: missingDocs[0],
        route: `/application-roadmap/${scheme._id || scheme.id}`
      };
    }

    // 5. Incomplete Profile check
    if (!profile || (!profile.income && !profile.age)) {
      return {
        actionType: "COMPLETE_PROFILE",
        title: "Complete Your Profile",
        description: "Complete your profile to discover accurate eligibility and more schemes.",
        priority: "High",
        route: "/profile"
      };
    }

    // 6. Ready to Apply
    if (applicationState && applicationState.status === "Ready to Apply") {
       return {
         actionType: "APPLY_NOW",
         title: "Ready to Apply",
         description: "All documents are ready. You can proceed to submit your application on the official portal.",
         priority: "High",
         route: `/application-roadmap/${scheme._id || scheme.id}`
       };
    }

    // Default Fallback
    return {
      actionType: "NO_ACTION",
      title: "Explore Benefits",
      description: "Review scheme details to understand benefits and application process.",
      priority: "Low",
      route: `/scheme/${scheme._id || scheme.id}`
    };
  }
}
