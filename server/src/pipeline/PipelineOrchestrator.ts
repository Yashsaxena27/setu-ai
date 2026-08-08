import crypto from "crypto";
import { BaseAdapter, StandardizedScheme } from "./BaseAdapter";
import RawSchemeData from "../models/RawSchemeData";
import Scheme from "../models/Scheme";
import SyncLog from "../models/SyncLog";
import ConflictLog from "../models/ConflictLog";
import { generateEmbedding } from "../services/embeddingService";
import { z } from "zod";

const standardizedSchemeSchema = z.object({
  source_id: z.string().min(1),
  source_provider: z.string().min(1),
  scheme_name: z.string().min(1),
  category: z.string().default("General"),
  level: z.string().default("Central"),
  state_applicability: z.array(z.string()).default([]),
  eligibility_rules: z.any().optional(),
  benefits: z.array(z.string()).default([]),
  required_documents: z.array(z.string()).default([]),
  application_steps: z.array(z.string()).default([]),
  official_link: z.string().optional(),
  summary_text: z.string().optional(),
  tags: z.array(z.string()).default([]),
  department: z.string().optional()
});

export class PipelineOrchestrator {
  private adapters: Map<string, BaseAdapter> = new Map();

  registerAdapter(adapter: BaseAdapter) {
    this.adapters.set(adapter.getProviderName(), adapter);
  }

  private computeHash(data: any): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }

  async runSync(providerName: string, syncType: "full" | "incremental" | "manual" = "manual") {
    const adapter = this.adapters.get(providerName);
    if (!adapter) {
      throw new Error(`Adapter ${providerName} not found`);
    }

    const log = new SyncLog({
      source_provider: providerName,
      sync_type: syncType,
    });
    await log.save();

    try {
      const rawRecords = await adapter.fetchAll();
      
      if (!rawRecords || rawRecords.length === 0) {
        throw new Error("Received 0 records from source. Aborting sync to prevent mass deactivation.");
      }
      
      log.records_processed = rawRecords.length;

      const processedSourceIds = new Set<string>();

      for (const raw of rawRecords) {
        try {
          const sourceId = await this.processRecord(adapter, raw, log);
          if (sourceId) processedSourceIds.add(sourceId);
        } catch (recordError: any) {
          console.error(`Error processing record from ${providerName}`, recordError.message);
          log.records_failed += 1;
        }
      }
      
      // Safe Scheme Deactivation: Mark missing schemes as inactive
      const missingRawDocs = await RawSchemeData.find({
        source_provider: providerName,
        source_id: { $nin: Array.from(processedSourceIds) },
        mapped_scheme_id: { $ne: null }
      });
      
      for (const missingDoc of missingRawDocs) {
        const schemeToDeactivate = await Scheme.findById(missingDoc.mapped_scheme_id);
        if (schemeToDeactivate && schemeToDeactivate.is_active !== false) {
          schemeToDeactivate.is_active = false;
          schemeToDeactivate.freshness_status = "unverified";
          await schemeToDeactivate.save();
          log.records_updated += 1; // Count as updated
        }
      }

      log.status = "completed";
      log.end_time = new Date();
      await log.save();
      return log;
    } catch (error: any) {
      log.status = "failed";
      log.error_message = error.message;
      log.end_time = new Date();
      await log.save();
      throw error;
    }
  }

  private async processRecord(adapter: BaseAdapter, rawData: any, log: any) {
    const rawStd = adapter.normalize(rawData);
    
    // 1. Zod Validation
    const validation = standardizedSchemeSchema.safeParse(rawStd);
    if (!validation.success) {
      throw new Error(`Malformed data for scheme ${rawStd.scheme_name || 'unknown'}: ${validation.error.message}`);
    }
    
    const std = validation.data as StandardizedScheme;
    const hash = this.computeHash(std);

    // Check if raw data exists
    let rawDoc = await RawSchemeData.findOne({
      source_provider: std.source_provider,
      source_id: std.source_id
    });

    if (!rawDoc) {
      // New record
      rawDoc = new RawSchemeData({
        source_provider: std.source_provider,
        source_id: std.source_id,
        raw_data: rawData,
        content_hash: hash,
        status: "pending_mapping"
      });
      await rawDoc.save();
      
      // Attempt to auto-map or insert
      await this.upsertScheme(std, rawDoc, log);
    } else {
      // Existing record, check if hash changed
      if (rawDoc.content_hash !== hash) {
        rawDoc.raw_data = rawData;
        rawDoc.content_hash = hash;
        rawDoc.last_synced_at = new Date();
        await rawDoc.save();
        
        // Process update
        await this.updateScheme(std, rawDoc, log);
      } else {
        // No change, just update timestamp
        rawDoc.last_synced_at = new Date();
        await rawDoc.save();
      }
    }
    
    return std.source_id;
  }

  private async upsertScheme(std: StandardizedScheme, rawDoc: any, log: any) {
    // Very simple auto-mapping: match by name
    let scheme = await Scheme.findOne({ scheme_name: std.scheme_name });

    if (!scheme) {
      // Insert new
      scheme = new Scheme({
        scheme_name: std.scheme_name,
        category: std.category,
        level: std.level,
        state_applicability: std.state_applicability,
        eligibility_rules: std.eligibility_rules,
        benefits: std.benefits,
        required_documents: std.required_documents,
        application_steps: std.application_steps,
        official_link: std.official_link,
        summary_text: std.summary_text,
        tags: std.tags,
        department: std.department,
        source_providers: [std.source_provider],
        freshness_status: "fresh",
        last_verified_date: new Date(),
        content_hash: rawDoc.content_hash
      });
      
      // Trigger embedding asynchronously if needed
      try {
        const textToEmbed = `${scheme.scheme_name}\n\n${scheme.category}\n\n${scheme.summary_text}\n\n${scheme.tags?.join(", ")}`;
        const embedding = await generateEmbedding(textToEmbed);
        scheme.embedding = embedding;
      } catch (e: any) {
        console.error("Embedding generation failed", e);
      }
      
      await scheme.save();
      log.records_added += 1;
    } else {
      // Add source provider if not present
      if (!scheme.source_providers) scheme.source_providers = [];
      if (!scheme.source_providers.includes(std.source_provider)) {
        scheme.source_providers.push(std.source_provider);
      }
      
      await scheme.save();
      log.records_updated += 1;
    }

    rawDoc.mapped_scheme_id = scheme._id;
    rawDoc.status = "mapped";
    await rawDoc.save();
  }

  private async updateScheme(std: StandardizedScheme, rawDoc: any, log: any) {
    if (!rawDoc.mapped_scheme_id) return;
    const scheme = await Scheme.findById(rawDoc.mapped_scheme_id);
    if (!scheme) return;

    // Detect field level changes
    const changes = [];
    const fieldsToCheck = ["eligibility_rules", "benefits", "required_documents"];
    
    for (const field of fieldsToCheck) {
      const current = JSON.stringify((scheme as any)[field]);
      const incoming = JSON.stringify((std as any)[field]);
      
      if (current !== incoming) {
        changes.push(field);
        // Create conflict log for manual review instead of auto-overwriting (for safety)
        const conflict = new ConflictLog({
          scheme_id: scheme._id,
          field_name: field,
          current_value: (scheme as any)[field],
          incoming_value: (std as any)[field],
          source_provider: std.source_provider
        });
        await conflict.save();
      }
    }

    if (changes.length > 0) {
      scheme.freshness_status = "unverified"; // Needs review
      // We do NOT update the embedding here because we put it in ConflictLog
      await scheme.save();
    }
    
    log.records_updated += 1;
  }
}

export const orchestrator = new PipelineOrchestrator();
