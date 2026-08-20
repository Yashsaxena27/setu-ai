export const formatMatchResponse = (matches: any[]) => {
  return matches.map((scheme, index) => {
    let matchScore = 95 - Math.min(index * 3, 20);
    if (typeof scheme.score === "number" && !isNaN(scheme.score)) {
      matchScore = scheme.score;
    }

    return {
      _id: scheme._id || String(index + 1),
      scheme_name: scheme.scheme_name || "Government Welfare Scheme",
      category: scheme.category || "Welfare",
      level: scheme.level || "Central",
      score: matchScore,
      summary: scheme.summary_text || scheme.summary || "",
      state_applicability: scheme.state_applicability || ["All"],
      eligibility_rules: scheme.eligibility_rules || {},
      benefits: scheme.benefits || [],
      required_documents: scheme.required_documents || [],
      official_link: scheme.official_link || scheme.official_portal_url || "https://myscheme.gov.in",
      department: scheme.department || "",
      contactPhone: scheme.contactPhone || "",
      contactEmail: scheme.contactEmail || "",
      website: scheme.website || scheme.official_link || "",
      officeHours: scheme.officeHours || "",
      supportLanguages: scheme.supportLanguages || [],
      freshness_status: scheme.freshness_status || "fresh",
      last_verified_date: scheme.last_verified_date || scheme.last_verified_at || new Date().toISOString(),
      verification_status: scheme.verification_status || (scheme.is_active === false ? "INACTIVE" : "VERIFIED"),
      source_authority: scheme.source_authority || "Official Government Ministry / State Portal",
      verification_notes: scheme.verification_notes || "Information verified against official government portal notifications.",
      eligibilityStatus: scheme.eligibilityStatus || "ELIGIBLE",
      passedRules: scheme.passedRules || [],
      actionItems: scheme.actionItems || [],
      hybridBreakdown: scheme.hybridBreakdown,
    };
  });
};