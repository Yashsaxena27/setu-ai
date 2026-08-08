export interface DeadlineMetadata {
  hasDeadline: boolean;
  daysRemaining?: number;
  urgencyState?: "informational" | "upcoming" | "important" | "urgent" | "closed";
  deadlineDate?: Date;
  message: string;
}

export class DeadlineIntelligenceService {

  static evaluateDeadline(scheme: any): DeadlineMetadata {
    if (!scheme.application_deadline) {
      return {
        hasDeadline: false,
        message: "Deadline not available / Rolling application",
      };
    }

    const deadline = new Date(scheme.application_deadline);
    const today = new Date();
    
    // Set both to midnight for accurate day calculation
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        hasDeadline: true,
        daysRemaining: diffDays,
        urgencyState: "closed",
        deadlineDate: deadline,
        message: "Application window closed / Expired",
      };
    }

    let urgencyState: "informational" | "upcoming" | "important" | "urgent" = "informational";
    let message = `Application deadline in ${diffDays} days.`;

    if (diffDays >= 15 && diffDays <= 30) {
      urgencyState = "upcoming";
    } else if (diffDays >= 7 && diffDays <= 14) {
      urgencyState = "important";
      message = `Renewal / Application due in ${diffDays} days.`;
    } else if (diffDays >= 1 && diffDays <= 6) {
      urgencyState = "urgent";
      message = `Urgent! Application window closes in ${diffDays} days.`;
    } else if (diffDays === 0) {
      urgencyState = "urgent";
      message = `Urgent! Application window closes TODAY.`;
    }

    return {
      hasDeadline: true,
      daysRemaining: diffDays,
      urgencyState,
      deadlineDate: deadline,
      message,
    };
  }
}
