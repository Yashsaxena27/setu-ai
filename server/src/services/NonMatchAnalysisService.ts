export interface NonMatchReason {
  reasonCode:
    | "AGE_MISMATCH"
    | "INCOME_LIMIT_EXCEEDED"
    | "STATE_RESTRICTED"
    | "OCCUPATION_MISMATCH"
    | "GENDER_MISMATCH"
    | "CASTE_MISMATCH"
    | "DISABILITY_REQUIRED"
    | "MARITAL_STATUS_MISMATCH"
    | "MISSING_INFORMATION"
    | "OTHER";
  field: string;
  actualValue: string | number;
  requiredValue: string | number;
  explanation: string;
}

export type EligibilityStatus =
  | "ELIGIBLE"
  | "ACTION_REQUIRED"
  | "INSUFFICIENT_INFORMATION"
  | "POTENTIAL_MATCH"
  | "INELIGIBLE";

export interface EligibilityClassification {
  status: EligibilityStatus;
  isEligible: boolean;
  reasons: NonMatchReason[];
  passedRules: string[];
  missingFields: string[];
  actionItems: string[];
  eligibilityMultiplier: number;
}

export class NonMatchAnalysisService {
  
  /**
   * Deterministically classifies citizen eligibility into granular, defensible states.
   */
  static classifyEligibility(profile: any, scheme: any): EligibilityClassification {
    const reasons: NonMatchReason[] = [];
    const passedRules: string[] = [];
    const missingFields: string[] = [];
    const actionItems: string[] = [];
    const rules = scheme.eligibility_rules || {};

    const rawIncome = profile.income !== undefined && profile.income !== null && profile.income !== "" ? profile.income : profile.annual_income;
    const userIncome = rawIncome !== undefined && rawIncome !== null && rawIncome !== "" ? Number(rawIncome) : null;
    const rawAge = profile.age;
    const userAge = rawAge !== undefined && rawAge !== null && rawAge !== "" ? Number(rawAge) : null;
    const userState = (profile.state || "").trim().toLowerCase();
    const userOccupation = (profile.occupation || "").trim().toLowerCase();
    const userGender = (profile.gender || "").trim().toLowerCase();
    const userCaste = (profile.caste || profile.social_category || "").trim().toLowerCase();
    const userDisability = profile.disability !== undefined && profile.disability !== null
      ? Boolean(profile.disability === true || profile.isDisability === true || String(profile.disability).toLowerCase() === "yes")
      : null;
    const userMarital = (profile.marital_status || profile.maritalStatus || "").trim().toLowerCase();

    // 1. State Filter (Hard boundary)
    if (scheme.state_applicability && Array.isArray(scheme.state_applicability) && scheme.state_applicability.length > 0) {
      const states = scheme.state_applicability.map((s: string) => s.toLowerCase().trim());
      const isAll = states.includes("all") || states.includes("all india") || states.includes("pan india");
      if (!isAll) {
        if (!userState) {
          missingFields.push("State of Domicile");
          actionItems.push("Provide your state to verify regional scheme eligibility.");
        } else if (!states.includes(userState)) {
          reasons.push({
            reasonCode: "STATE_RESTRICTED",
            field: "State",
            actualValue: profile.state || "Not specified",
            requiredValue: scheme.state_applicability.join(", "),
            explanation: `This scheme is currently available only in ${scheme.state_applicability.join(", ")}.`,
          });
        } else {
          passedRules.push(`State domicile matches (${profile.state})`);
        }
      } else {
        passedRules.push("Applicable nationwide across all states");
      }
    }

    // 2. Age Filter (Hard boundary)
    const minAge = rules.min_age != null ? Number(rules.min_age) : null;
    const maxAge = rules.max_age != null ? Number(rules.max_age) : null;

    if (minAge !== null || maxAge !== null) {
      if (userAge === null || isNaN(userAge) || userAge <= 0) {
        missingFields.push("Age");
        actionItems.push("Add your age to confirm age bracket eligibility.");
      } else {
        if (minAge !== null && userAge < minAge) {
          reasons.push({
            reasonCode: "AGE_MISMATCH",
            field: "Age",
            actualValue: userAge,
            requiredValue: `Min ${minAge} years`,
            explanation: `You are ${userAge}. This scheme requires applicants to be at least ${minAge} years old.`,
          });
        } else if (maxAge !== null && userAge > maxAge) {
          reasons.push({
            reasonCode: "AGE_MISMATCH",
            field: "Age",
            actualValue: userAge,
            requiredValue: `Max ${maxAge} years`,
            explanation: `You are ${userAge}. This scheme is available only up to age ${maxAge}.`,
          });
        } else {
          passedRules.push(`Age (${userAge} years) is within required range`);
        }
      }
    }

    // 3. Income Filter (Hard boundary)
    if (rules.income_limit != null) {
      const limit = Number(rules.income_limit);
      if (limit > 0) {
        if (userIncome === null || isNaN(userIncome)) {
          missingFields.push("Annual Income");
          actionItems.push("Provide your annual income to verify income ceiling compliance.");
        } else if (userIncome > limit) {
          reasons.push({
            reasonCode: "INCOME_LIMIT_EXCEEDED",
            field: "Income",
            actualValue: `₹${userIncome.toLocaleString('en-IN')}`,
            requiredValue: `₹${limit.toLocaleString('en-IN')}`,
            explanation: `Your declared income is ₹${(userIncome/100000).toFixed(1)} lakh. The scheme limit is ₹${(limit/100000).toFixed(1)} lakh.`,
          });
        } else {
          passedRules.push(`Annual income (₹${userIncome.toLocaleString('en-IN')}) is within ₹${limit.toLocaleString('en-IN')} ceiling`);
        }
      }
    }

    // 4. Occupation Filter
    if (rules.occupation && typeof rules.occupation === "string") {
      const ruleOcc = rules.occupation.toLowerCase().trim();
      if (ruleOcc !== "any" && ruleOcc !== "citizen" && ruleOcc !== "all") {
        if (!userOccupation) {
          missingFields.push("Occupation");
          actionItems.push(`Confirm if your profession aligns with ${rules.occupation}.`);
        } else {
          const isDirectMatch = ruleOcc.includes(userOccupation) || userOccupation.includes(ruleOcc);
          const isFarmerMatch = (userOccupation.includes("farmer") || userOccupation.includes("kisan") || userOccupation.includes("agri")) && (ruleOcc.includes("farm") || ruleOcc.includes("agri") || ruleOcc.includes("kisan"));
          const isStudentMatch = (userOccupation.includes("student") || userOccupation.includes("scholar")) && (ruleOcc.includes("student") || ruleOcc.includes("school") || ruleOcc.includes("scholarship") || ruleOcc.includes("education"));
          const isWomenMatch = (userOccupation.includes("woman") || userOccupation.includes("women") || userOccupation.includes("homemaker")) && (ruleOcc.includes("woman") || ruleOcc.includes("women") || ruleOcc.includes("female"));
          const isUnemployedMatch = userOccupation.includes("unemployed") && (ruleOcc.includes("unemployed") || ruleOcc.includes("youth"));
          const isBusinessMatch = (userOccupation.includes("business") || userOccupation.includes("self employed") || userOccupation.includes("shopkeeper")) && (ruleOcc.includes("business") || ruleOcc.includes("entrepreneur") || ruleOcc.includes("msme"));

          const isMatched = isDirectMatch || isFarmerMatch || isStudentMatch || isWomenMatch || isUnemployedMatch || isBusinessMatch;

          if (!isMatched) {
            reasons.push({
              reasonCode: "OCCUPATION_MISMATCH",
              field: "Occupation",
              actualValue: profile.occupation || "Not specified",
              requiredValue: rules.occupation,
              explanation: `This scheme is designated for ${rules.occupation}. Your occupation is listed as ${profile.occupation}.`,
            });
          } else {
            passedRules.push(`Occupation matches scheme requirements (${profile.occupation})`);
          }
        }
      }
    }

    // 5. Gender Filter
    if (rules.gender && typeof rules.gender === "string" && rules.gender.toLowerCase() !== "any" && rules.gender.toLowerCase() !== "all") {
      const ruleGender = rules.gender.toLowerCase().trim();
      if (!userGender) {
        missingFields.push("Gender");
      } else if (userGender !== ruleGender) {
        reasons.push({
          reasonCode: "GENDER_MISMATCH",
          field: "Gender",
          actualValue: profile.gender || "Not specified",
          requiredValue: rules.gender,
          explanation: `This scheme is restricted to ${rules.gender} applicants.`,
        });
      } else {
        passedRules.push(`Gender requirement satisfied (${profile.gender})`);
      }
    }

    // 6. Caste / Social Category Filter
    const schemeName = (scheme.scheme_name || "").toLowerCase();
    const schemeTags = Array.isArray(scheme.tags) ? scheme.tags.map((t: string) => t.toLowerCase()) : [];
    
    let requiredCaste = (rules.caste || "").toLowerCase().trim();
    if (!requiredCaste || requiredCaste === "any" || requiredCaste === "all") {
      if (schemeName.includes("for sc ") || schemeName.endsWith(" for sc") || schemeTags.includes("sc")) {
        requiredCaste = "sc";
      } else if (schemeName.includes("for obc ") || schemeName.endsWith(" for obc") || schemeTags.includes("obc")) {
        requiredCaste = "obc";
      } else if (schemeName.includes("for st ") || schemeName.endsWith(" for st") || schemeTags.includes("st")) {
        requiredCaste = "st";
      } else if (schemeName.includes("for ews ") || schemeName.endsWith(" for ews") || schemeTags.includes("ews")) {
        requiredCaste = "ews";
      }
    }

    if (requiredCaste && requiredCaste !== "any" && requiredCaste !== "all") {
      if (!userCaste) {
        actionItems.push(`Scheme designates support for ${requiredCaste.toUpperCase()} category; upload caste certificate if applicable.`);
      } else if (!requiredCaste.includes(userCaste) && !userCaste.includes(requiredCaste)) {
        reasons.push({
          reasonCode: "CASTE_MISMATCH",
          field: "Social Category",
          actualValue: profile.caste || "Not specified",
          requiredValue: requiredCaste.toUpperCase(),
          explanation: `This scheme is designated for ${requiredCaste.toUpperCase()} applicants. Your declared category is ${profile.caste}.`,
        });
      } else {
        passedRules.push(`Caste category verified (${profile.caste})`);
      }
    }

    // 7. Disability Filter
    const isDisabilityScheme =
      rules.disability_required === true ||
      (scheme.category && scheme.category.toLowerCase() === "disability") ||
      schemeTags.includes("disability") ||
      schemeTags.includes("divyangjan");

    if (isDisabilityScheme) {
      if (userDisability === null) {
        missingFields.push("Disability Status");
        actionItems.push("Upload UDID or Disability Certificate if you are a PwD applicant.");
      } else if (!userDisability) {
        reasons.push({
          reasonCode: "DISABILITY_REQUIRED",
          field: "Disability Status",
          actualValue: "No disability declared",
          requiredValue: "Persons with Disabilities (PwD)",
          explanation: `This scheme specifically supports Persons with Disabilities.`,
        });
      } else {
        passedRules.push("Disability eligibility verified");
      }
    }

    // 8. Marital Status Filter
    if (rules.marital_status && typeof rules.marital_status === "string" && rules.marital_status.toLowerCase() !== "any") {
      const ruleMarital = rules.marital_status.toLowerCase().trim();
      if (!userMarital) {
        missingFields.push("Marital Status");
      } else if (userMarital !== ruleMarital) {
        reasons.push({
          reasonCode: "MARITAL_STATUS_MISMATCH",
          field: "Marital Status",
          actualValue: profile.marital_status || profile.maritalStatus || "Not specified",
          requiredValue: rules.marital_status,
          explanation: `This scheme is specifically for ${rules.marital_status} applicants.`,
        });
      } else {
        passedRules.push(`Marital status criteria met (${profile.marital_status || profile.maritalStatus})`);
      }
    }

    // Determine final status
    let status: EligibilityStatus;
    let eligibilityMultiplier = 0.0;

    if (reasons.length > 0) {
      status = "INELIGIBLE";
      eligibilityMultiplier = 0.0;
    } else if (missingFields.length > 0) {
      status = "INSUFFICIENT_INFORMATION";
      eligibilityMultiplier = 0.70;
    } else if (actionItems.length > 0) {
      status = "ACTION_REQUIRED";
      eligibilityMultiplier = 0.85;
    } else {
      status = "ELIGIBLE";
      eligibilityMultiplier = 1.0;
    }

    return {
      status,
      isEligible: status === "ELIGIBLE" || status === "ACTION_REQUIRED",
      reasons,
      passedRules,
      missingFields,
      actionItems,
      eligibilityMultiplier,
    };
  }
  
  static analyzeNonMatch(profile: any, scheme: any): NonMatchReason[] {
    const classification = this.classifyEligibility(profile, scheme);
    return classification.reasons;
  }
}
