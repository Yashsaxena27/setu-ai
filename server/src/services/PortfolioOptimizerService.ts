import Scheme from "../models/Scheme";
import { aiOrchestrator } from "./AIOrchestratorService";

export interface PortfolioPlan {
  recommendedSchemes: any[];
  sequence: {
    schemeId: string;
    schemeName: string;
    order: number;
    reason: string;
  }[];
  conflicts: {
    schemeA: string;
    schemeB: string;
    reason: string;
  }[];
  dependencies: {
    dependent: string;
    prerequisite: string;
  }[];
  priorities: {
    schemeId: string;
    priority: "High" | "Medium" | "Low";
  }[];
}

export class PortfolioOptimizerService {
  
  static optimizePortfolio(matchedSchemes: any[]): PortfolioPlan {
    const plan: PortfolioPlan = {
      recommendedSchemes: matchedSchemes,
      sequence: [],
      conflicts: [],
      dependencies: [],
      priorities: []
    };

    if (!matchedSchemes || matchedSchemes.length === 0) {
      return plan;
    }

    // 1. Detect Conflicts (e.g. mutually exclusive)
    // using conflict_schemes array in scheme model
    for (let i = 0; i < matchedSchemes.length; i++) {
      for (let j = i + 1; j < matchedSchemes.length; j++) {
        const sA = matchedSchemes[i];
        const sB = matchedSchemes[j];
        
        // Check explicit conflicts
        if (sA.conflict_schemes?.includes(String(sB._id)) || sB.conflict_schemes?.includes(String(sA._id))) {
          plan.conflicts.push({
            schemeA: sA.scheme_name,
            schemeB: sB.scheme_name,
            reason: "These schemes are mutually exclusive according to verified rules."
          });
        }
        
        // Implicit family scheme conflict (e.g. only 1 Awas Yojana)
        const isHousingA = /Awas|Housing/.test(sA.scheme_name);
        const isHousingB = /Awas|Housing/.test(sB.scheme_name);
        if (isHousingA && isHousingB) {
           plan.conflicts.push({
            schemeA: sA.scheme_name,
            schemeB: sB.scheme_name,
            reason: "Household can typically only claim one major housing subsidy."
          });
        }
      }
    }

    // 2. Detect Dependencies & Set Priorities
    matchedSchemes.forEach(scheme => {
      let priority: "High" | "Medium" | "Low" = "Medium";
      
      // High priority if deadline is near
      if (scheme.application_deadline) {
        const diffDays = Math.ceil((new Date(scheme.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 14) {
          priority = "High";
        }
      }

      // Check explicit prerequisites
      if (scheme.prerequisite_schemes && scheme.prerequisite_schemes.length > 0) {
        scheme.prerequisite_schemes.forEach((preReqId: string) => {
          const preReqScheme = matchedSchemes.find(s => String(s._id) === preReqId);
          if (preReqScheme) {
            plan.dependencies.push({
              dependent: scheme.scheme_name,
              prerequisite: preReqScheme.scheme_name
            });
            // Dependent schemes have lower initial priority until prereq is met
            priority = "Low"; 
          } else {
             plan.dependencies.push({
              dependent: scheme.scheme_name,
              prerequisite: "External/Prerequisite Scheme not in matched list"
            });
          }
        });
      }

      plan.priorities.push({
        schemeId: String(scheme._id),
        priority
      });
    });

    // 3. Sequence logic (very basic topological sort approximation for demo)
    // 1st: High Priority without dependencies
    // 2nd: Prerequisites
    // 3rd: Medium/Low priority
    
    let orderCounter = 1;
    const addedToSequence = new Set<string>();

    const getPriorityScore = (id: string) => {
      const p = plan.priorities.find(x => x.schemeId === id)?.priority;
      if (p === "High") return 3;
      if (p === "Medium") return 2;
      return 1;
    };

    // Sort schemes by priority score descending
    const sortedSchemes = [...matchedSchemes].sort((a, b) => getPriorityScore(String(b._id)) - getPriorityScore(String(a._id)));

    sortedSchemes.forEach(scheme => {
      if (!addedToSequence.has(String(scheme._id))) {
        // Check if it's a dependent
        const dep = plan.dependencies.find(d => d.dependent === scheme.scheme_name);
        if (dep) {
          // If prereq is in matched schemes, it should go first
          const prereqScheme = matchedSchemes.find(s => s.scheme_name === dep.prerequisite);
          if (prereqScheme && !addedToSequence.has(String(prereqScheme._id))) {
             plan.sequence.push({
               schemeId: String(prereqScheme._id),
               schemeName: prereqScheme.scheme_name,
               order: orderCounter++,
               reason: `Prerequisite for ${scheme.scheme_name}`
             });
             addedToSequence.add(String(prereqScheme._id));
          }
        }
        
        plan.sequence.push({
          schemeId: String(scheme._id),
          schemeName: scheme.scheme_name,
          order: orderCounter++,
          reason: plan.priorities.find(p => p.schemeId === String(scheme._id))?.priority === "High" ? "High priority / approaching deadline" : "Standard sequence"
        });
        addedToSequence.add(String(scheme._id));
      }
    });

    return plan;
  }
}
