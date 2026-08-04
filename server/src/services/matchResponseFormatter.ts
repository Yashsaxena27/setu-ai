export const formatMatchResponse = (matches: any[]) => {
  return matches.map((scheme, index) => {
    let matchScore = 95 - Math.min(index * 3, 20);
    if (scheme.score && typeof scheme.score === "number" && !isNaN(scheme.score)) {
      const calculated = Math.round(scheme.score * 100);
      matchScore = Math.min(99, Math.max(70, calculated > 100 ? calculated / 100 : calculated));
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
      official_link: scheme.official_link || "https://myscheme.gov.in",
      department: scheme.department || "",
      contactPhone: scheme.contactPhone || "",
      contactEmail: scheme.contactEmail || "",
      website: scheme.website || scheme.official_link || "",
      officeHours: scheme.officeHours || "",
      supportLanguages: scheme.supportLanguages || [],
    };
  });
};