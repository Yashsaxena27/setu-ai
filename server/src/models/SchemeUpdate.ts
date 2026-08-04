import mongoose from "mongoose";

const schemeUpdateSchema = new mongoose.Schema(
  {
    scheme_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    version_number: String,
    date: {
      type: Date,
      default: Date.now,
    },
    change_type: {
      type: String,
      enum: [
        "Eligibility Change",
        "Income Limit Change",
        "Age Limit Change",
        "Benefit Increase",
        "Benefit Decrease",
        "Document Requirement Added",
        "Document Removed",
        "Application Process Changed",
        "Deadline Changed",
        "Portal Changed",
        "Scheme Closed",
        "Scheme Relaunched",
      ],
      required: true,
    },
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
  },
  {
    timestamps: true,
  }
);

schemeUpdateSchema.index({ scheme_id: 1, date: -1 });

export default mongoose.model("SchemeUpdate", schemeUpdateSchema);
