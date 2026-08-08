export interface NonMatchReason {
  reasonCode: "AGE_MISMATCH" | "INCOME_LIMIT_EXCEEDED" | "STATE_RESTRICTED" | "OCCUPATION_MISMATCH" | "GENDER_MISMATCH" | "OTHER";
  field: string;
  actualValue: string | number;
  requiredValue: string | number;
  explanation: string;
}

export class NonMatchAnalysisService {
  
  static analyzeNonMatch(profile: any, scheme: any): NonMatchReason[] {
    const reasons: NonMatchReason[] = [];
    const rules = scheme.eligibility_rules || {};

    const userIncome = Number(profile.income || profile.annual_income || 0);
    const userAge = Number(profile.age || 0);
    const userState = (profile.state || "").trim().toLowerCase();
    const userOccupation = (profile.occupation || "").trim().toLowerCase();
    const userGender = (profile.gender || "").trim().toLowerCase();

    // 1. Age Filter
    if (userAge > 0) {
      const minAge = rules.min_age != null ? Number(rules.min_age) : 0;
      const maxAge = rules.max_age != null ? Number(rules.max_age) : 120;
      if (userAge < minAge) {
        reasons.push({
          reasonCode: "AGE_MISMATCH",
          field: "Age",
          actualValue: userAge,
          requiredValue: `Min ${minAge}`,
          explanation: `You are ${userAge}. This scheme requires applicants to be at least ${minAge} years old.`,
        });
      } else if (userAge > maxAge) {
         reasons.push({
          reasonCode: "AGE_MISMATCH",
          field: "Age",
          actualValue: userAge,
          requiredValue: `Max ${maxAge}`,
          explanation: `You are ${userAge}. This scheme is only available up to age ${maxAge}.`,
        });
      }
    }

    // 2. State Filter
    if (userState && scheme.state_applicability && Array.isArray(scheme.state_applicability)) {
      const states = scheme.state_applicability.map((s: string) => s.toLowerCase());
      const isAll = states.includes("all") || states.includes("all india") || states.includes("pan india");
      if (!isAll && !states.includes(userState)) {
        reasons.push({
          reasonCode: "STATE_RESTRICTED",
          field: "State",
          actualValue: profile.state || "Not specified",
          requiredValue: scheme.state_applicability.join(", "),
          explanation: `This scheme is currently available only in ${scheme.state_applicability.join(", ")}.`,
        });
      }
    }

    // 3. Income Filter
    if (rules.income_limit != null && userIncome > 0) {
      const limit = Number(rules.income_limit);
      if (limit > 0 && userIncome > limit) {
        reasons.push({
          reasonCode: "INCOME_LIMIT_EXCEEDED",
          field: "Income",
          actualValue: `₹${userIncome.toLocaleString('en-IN')}`,
          requiredValue: `₹${limit.toLocaleString('en-IN')}`,
          explanation: `Your declared income is ₹${(userIncome/100000).toFixed(1)} lakh. The scheme limit is ₹${(limit/100000).toFixed(1)} lakh.`,
        });
      }
    }

    // 4. Occupation Filter
    if (rules.occupation && typeof rules.occupation === "string") {
      const ruleOcc = rules.occupation.toLowerCase();
      if (ruleOcc !== "any" && ruleOcc !== "citizen" && userOccupation) {
        const isDirectMatch = ruleOcc.includes(userOccupation) || userOccupation.includes(ruleOcc);
        const isFarmerMatch = userOccupation.includes("farmer") && (ruleOcc.includes("farm") || ruleOcc.includes("agri") || ruleOcc.includes("kisan"));
        const isStudentMatch = userOccupation.includes("student") && (ruleOcc.includes("student") || ruleOcc.includes("school") || ruleOcc.includes("scholarship"));
        const isWomenMatch = (userOccupation.includes("woman") || userOccupation.includes("women") || userOccupation.includes("homemaker")) && (ruleOcc.includes("woman") || ruleOcc.includes("women") || ruleOcc.includes("female"));
        const isUnemployedMatch = userOccupation.includes("unemployed") && (ruleOcc.includes("unemployed") || ruleOcc.includes("youth"));
        const isBusinessMatch = (userOccupation.includes("business") || userOccupation.includes("self employed")) && (ruleOcc.includes("business") || ruleOcc.includes("entrepreneur") || ruleOcc.includes("msme"));

        const isMatched = isDirectMatch || isFarmerMatch || isStudentMatch || isWomenMatch || isUnemployedMatch || isBusinessMatch;

        if (!isMatched) {
           reasons.push({
            reasonCode: "OCCUPATION_MISMATCH",
            field: "Occupation",
            actualValue: profile.occupation || "Not specified",
            requiredValue: rules.occupation,
            explanation: `This scheme is restricted to ${rules.occupation}. Your occupation is listed as ${profile.occupation}.`,
          });
        }
      }
    }
    
    // 5. Gender Filter (if any)
    if (rules.gender && typeof rules.gender === "string" && rules.gender.toLowerCase() !== "any") {
      const ruleGender = rules.gender.toLowerCase();
      if (userGender && userGender !== ruleGender) {
        reasons.push({
          reasonCode: "GENDER_MISMATCH",
          field: "Gender",
          actualValue: profile.gender || "Not specified",
          requiredValue: rules.gender,
          explanation: `This scheme is restricted to ${rules.gender} applicants.`,
        });
      }
    }

    return reasons;
  }
}
