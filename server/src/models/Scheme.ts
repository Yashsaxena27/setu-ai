import mongoose from "mongoose";

const schemeSchema = new mongoose.Schema(
  {
    scheme_name: String,

    category: String,

    level: String,

   state_applicability: [String],

    eligibility_rules: Object,

    benefits: [String],

    required_documents: [String],

    application_steps: [String],

    official_link: String,

    application_deadline: Date,

    prerequisite_schemes: [String],

    conflict_schemes: [String],

    source_link: String,

    last_verified_date: Date,

    freshness_status: {
      type: String,
      enum: ["fresh", "stale", "unverified"],
      default: "unverified",
    },

    official_portal_url: String,

    is_active: {
      type: Boolean,
      default: true,
    },

    source_providers: [String],

    confidence_score: {
      type: Number,
      min: 0,
      max: 100,
    },

    content_hash: String,

    summary_text: String,
    
    eligibility_examples: [String],
    common_mistakes: [String],
    practical_notes: [String],

    embedding: [Number],

    version_history: [
      {
        version_number: String,
        date: { type: Date, default: Date.now },
        change_type: String,
        modified_fields: [
          {
            field_name: String,
            previous_value: String,
            new_value: String,
          }
        ],
        reason: String,
        verified_source: String,
        verified_by: String,
      }
    ],

    tags: [String],
    department: String,
    contactPhone: String,
    contactEmail: String,
    website: String,
    officeHours: String,
    supportLanguages: [String],
  },
  {
    timestamps: true,
  }
);

// High-Performance Compound & Single-field Indexes
schemeSchema.index({ state_applicability: 1, is_active: 1 });
schemeSchema.index({ category: 1, level: 1 });
schemeSchema.index({ scheme_name: "text", summary_text: "text" });
schemeSchema.index({ "eligibility_rules.income_limit": 1 });
schemeSchema.index({ "eligibility_rules.min_age": 1, "eligibility_rules.max_age": 1 });

export default mongoose.model("Scheme", schemeSchema);