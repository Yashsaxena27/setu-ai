import { Request, Response } from "express";
import { findMatchingSchemes } from "../services/matchingService";
import {
  generateWhySimulationChange,
  generateSimulationSummaryText,
} from "../services/aiExplanationService";

function parseBenefitAmount(benefits: string[]): number {
  if (!benefits || !Array.isArray(benefits)) return 0;
  let maxMonetary = 0;
  benefits.forEach((benefit) => {
    const matches = benefit.match(/(?:₹|Rs\.?|INR)\s*([\d,]+)/gi);
    if (matches) {
      matches.forEach((m) => {
        const numMatch = m.match(/[\d,]+/);
        if (numMatch) {
          const val = parseFloat(numMatch[0].replace(/,/g, ""));
          if (!isNaN(val)) {
            maxMonetary += val;
          }
        }
      });
    }
  });
  return maxMonetary;
}

import { NonMatchAnalysisService } from "../services/NonMatchAnalysisService";

function checkEligibilityDetail(profile: any, scheme: any) {
  const classification = NonMatchAnalysisService.classifyEligibility(profile, scheme);
  return {
    eligible: classification.isEligible,
    reasons: classification.reasons.map((r) => r.explanation),
  };
}

function cloneAndSynthesizeProfile(p: any) {
  if (!p) return {};
  const cloned = { ...p };

  // Collect raw text components for embedding searches
  let occParts = [];
  if (cloned.occupation) occParts.push(cloned.occupation.toLowerCase());
  
  if (cloned.farmer === true || cloned.farmer === "Yes" || String(cloned.farmer).toLowerCase() === "true") {
    occParts.push("farmer");
  }
  if (cloned.student === true || cloned.student === "Yes" || String(cloned.student).toLowerCase() === "true") {
    occParts.push("student");
  }
  if (cloned.businessOwner === true || cloned.businessOwner === "Yes" || String(cloned.businessOwner).toLowerCase() === "true" || cloned.business_owner === true) {
    occParts.push("business owner");
    occParts.push("self employed");
  }
  if (cloned.employmentStatus === "Unemployed" || cloned.employment_status === "Unemployed" || String(cloned.occupation).toLowerCase() === "unemployed") {
    occParts.push("unemployed");
  }
  if (cloned.gender === "Female" || String(cloned.occupation).toLowerCase() === "woman" || String(cloned.occupation).toLowerCase() === "homemaker") {
    occParts.push("woman");
    occParts.push("homemaker");
  }

  if (occParts.length > 0) {
    cloned.occupation = Array.from(new Set(occParts)).join(", ");
  }

  // Generate synthesized rawText to feed vector searches
  cloned.rawText = `Citizen situation: A ${cloned.age || 25} year old ${cloned.gender || "individual"} residing in ${cloned.state || "Delhi"}.
Occupation status details: ${cloned.occupation || "General citizen"}.
Household annual income is ₹${cloned.income || 0}.
Education background is ${cloned.education || "Undergraduate"}.
Marital status: ${cloned.maritalStatus || cloned.marital_status || "Single"}.
Dependents count: ${cloned.children || cloned.numberOfChildren || 0} children.
Disability indicator: ${cloned.disability || "No"}.
Farmer status: ${cloned.farmer ? "Yes" : "No"}.
Student status: ${cloned.student ? "Yes" : "No"}.
Business owner status: ${cloned.businessOwner ? "Yes" : "No"}.`;

  return cloned;
}

export async function simulateEligibility(req: Request, res: Response) {
  try {
    const { originalProfile, simulatedProfile, simulationChanges } = req.body;

    if (!originalProfile) {
      return res.status(400).json({
        success: false,
        message: "originalProfile is required",
      });
    }

    // Merge changes if simulationChanges provided
    let targetSimulated = simulatedProfile;
    if (simulationChanges && !targetSimulated) {
      targetSimulated = { ...originalProfile, ...simulationChanges };
    }

    if (!targetSimulated) {
      targetSimulated = { ...originalProfile };
    }

    // Clone and Synthesize virtual profiles (completely in-memory)
    const virtualOriginal = cloneAndSynthesizeProfile(originalProfile);
    const virtualSimulated = cloneAndSynthesizeProfile(targetSimulated);

    // Pass simulated and original profiles through existing matching engine
    const originalMatches = await findMatchingSchemes(virtualOriginal);
    const simulatedMatches = await findMatchingSchemes(virtualSimulated);

    const originalIds = new Set(
      originalMatches.map((s: any) => String(s._id))
    );

    const simulatedIds = new Set(
      simulatedMatches.map((s: any) => String(s._id))
    );

    // Segregate schemes
    const rawGained = simulatedMatches.filter(
      (s: any) => !originalIds.has(String(s._id))
    );

    const rawLost = originalMatches.filter(
      (s: any) => !simulatedIds.has(String(s._id))
    );

    const unchanged = simulatedMatches.filter(
      (s: any) => originalIds.has(String(s._id))
    );

    // 1. Calculate structural reasons and call RAG AI Explanations in parallel for gained schemes
    const gained = await Promise.all(
      rawGained.map(async (scheme: any) => {
        const check = checkEligibilityDetail(virtualOriginal, scheme);
        const reason = check.reasons.length > 0
          ? `Because your previous parameters did not match: ${check.reasons.join(", ")}`
          : "You qualify under new criteria parameters.";

        // Use the existing Explainability pipeline (Gemini) to explain what changed
        let aiExplanation = "";
        try {
          aiExplanation = await generateWhySimulationChange(
            virtualOriginal,
            virtualSimulated,
            scheme
          );
        } catch (e) {
          console.error(`AI explanation failed for gained scheme ${scheme._id}:`, e);
          aiExplanation = `Earlier demographic constraints prevented eligibility. Under your simulated profile changes, you now satisfy all parameters.`;
        }

        return {
          ...scheme.toObject ? scheme.toObject() : scheme,
          reason,
          aiExplanation,
        };
      })
    );

    // 2. Calculate structural reasons for lost schemes
    const lost = rawLost.map((scheme: any) => {
      const check = checkEligibilityDetail(virtualSimulated, scheme);
      const reason = check.reasons.length > 0
        ? check.reasons.join(", ")
        : "Shifted demographic constraints";

      return {
        ...scheme.toObject ? scheme.toObject() : scheme,
        reason,
      };
    });

    // 3. Compile Summary Insights
    let summaryText = "";
    let largestBenefit = null;
    let mostImportantScheme = "";
    let suggestedDocuments: string[] = [];
    let nextAction = "";

    if (gained.length > 0) {
      // Aggregate monetary benefits
      let totalMonetary = 0;
      let maxMonetary = -1;

      gained.forEach((s: any) => {
        const val = parseBenefitAmount(s.benefits || []);
        totalMonetary += val;
        
        if (val > maxMonetary) {
          maxMonetary = val;
          largestBenefit = {
            schemeName: s.scheme_name,
            amount: val,
            benefitText: s.benefits?.[0] || "",
          };
        }

        // Collect documents
        if (s.required_documents && Array.isArray(s.required_documents)) {
          s.required_documents.forEach((doc: string) => {
            suggestedDocuments.push(doc);
          });
        }
      });

      suggestedDocuments = Array.from(new Set(suggestedDocuments)).filter(Boolean);

      // Sort gained by score to find most important scheme
      const sortedGained = [...gained].sort(
        (a: any, b: any) => (b.score || 0) - (a.score || 0)
      );
      mostImportantScheme = sortedGained[0]?.scheme_name || "";

      // Generate the AI summary text
      try {
        summaryText = await generateSimulationSummaryText(
          virtualOriginal,
          virtualSimulated,
          gained.length,
          totalMonetary,
          gained
        );
      } catch (e) {
        summaryText = `If this life event happens, you become eligible for ${gained.length} additional schemes worth approximately ₹${totalMonetary.toLocaleString()} in combined benefits.`;
      }

      // Format next actions
      const docPreview = suggestedDocuments.slice(0, 2).join(" & ");
      nextAction = `Prepare applications for ${mostImportantScheme}. Verify that you have your ${
        docPreview || "Aadhaar Card"
      } ready.`;
    } else {
      summaryText = "No new schemes qualified under these simulated changes. Your current benefits remain stable.";
      nextAction = "Try adjusting other parameters like household income thresholds or age increments to explore options.";
    }

    res.json({
      success: true,
      gained,
      lost,
      unchanged,
      summary: {
        summaryText,
        largestBenefit,
        mostImportantScheme,
        suggestedDocuments,
        nextAction,
      },
    });
  } catch (err: any) {
    console.error("Simulation Controller Error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Simulation failed",
    });
  }
}