#!/usr/bin/env tsx
import path from "path";
/**
 * Hestia v2 — Memory Governance, Canonical Entities, Deep Links, Tiers, Snapshots, Identity
 *
 * Categories:
 *   CORE        → status, summary, morning, identity, snapshot
 *   MEMORY      → objective, decision, blocker, session
 *   GRAPH       → graph, graph-stats, find-related, deep-link, canonical
 *   INTELLIGENCE → timeline, timeline-ask
 *   GOVERNANCE  → governance, cleanup, tiers, tiers-scan
 */

import {
  createObjective, getObjective, updateObjectiveStatus,
  listActiveObjectives, listAllObjectives,
  recordDecision, getDecision, listRecentDecisions,
  registerBlocker, resolveBlocker, listActiveBlockers,
  getOrCreateSession, updateSession, addNextStep, clearNextSteps,
  buildCollectiveMemory, formatCollectiveMemorySummary
} from "./hestiaMemoryCore";

import {
  scanEntityGraph, printGraphSummary, readGraph,
  findRelatedEntities, queryGraph, getGraphStats
} from "./hestiaEntityGraph";

import { runGovernanceCheck, formatGovernanceReport, autoCleanup } from "./hestiaGovernance";
import { buildTimelineIntelligence, formatTimelineIntelligence, answerTimelineQuestion } from "./hestiaTimeline";
import { buildOperationalSummary, formatOperationalSummary, quickSummary } from "./hestiaOperationalSummary";

// ── V2: Memory Governance V2 ──
import {
  registerCanonical, resolveToCanonical, searchCanonical,
  mergeCanonical, listCanonicalByType, getCanonicalStats,
  printCanonicalSummary, autoDiscoverFromGraph
} from "./hestiaCanonical";

import { runDeepLinking, printDeepLinkSummary } from "./hestiaDeepLinks";

import {
  promoteToTier, getTierStats, getTierContents,
  autoTier, formatTierSummary, freezeToImmutable
} from "./hestiaMemoryTiers";

import {
  captureSnapshot, getLatestSnapshot, getIdentity,
  formatIdentity, formatSnapshot
} from "./hestiaCognitiveSnapshot";

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "help") {
    console.log([
      "HESTIA v2 — Memory Governance & Operational Identity",
      "",
      "Usage: npx tsx founder-command-center/olympus/hestia.ts <command> [args]",
      "",
      "CORE:",
      "  status                    Quick system health and focus",
      "  summary                   Full operational summary (cognitive synthesis)",
      "  morning                   Morning synthesis",
      "  identity                  Who is ZEUS right now?",
      '  snapshot [label]          Capture a cognitive snapshot',
      "  latest-snapshot           Show the most recent snapshot",
      "",
      "MEMORY:",
      '  objective <title> <desc> [priority]     Create objective',
      '  objective-status <id> <status> [note]   Update objective status',
      "  objectives                List active objectives",
      '  decision <title> <ctx> <dec> <rationale> Record decision',
      "  decisions                 List recent decisions",
      '  blocker <title> <desc> [severity]       Register blocker',
      '  resolve-blocker <id> <resolution>       Resolve blocker',
      "  blockers                  List active blockers",
      "",
      "SESSION:",
      "  session                   Show current session state",
      '  next-step <step>          Add next step to session',
      "  clear-steps               Clear all next steps",
      '  focus <focus>             Update current focus',
      "",
      "GRAPH & LINKS:",
      "  graph                     Scan and display entity graph",
      "  graph-stats               Entity graph statistics",
      '  find-related <entityId>   Find related entities in graph',
      "  deep-link                 Run deep cross-linking (build→task→patch→...)",
      "",
      "CANONICAL ENTITIES:",
      '  canonical <name> [type] [tags...]        Register a canonical entity',
      '  canonical-search <query>                  Search canonical entities',
      '  canonical-merge <sourceId> <targetId>     Merge two canonical entities',
      '  canonical-stats                           Show canonical registry stats',
      "  canonical-discover                        Auto-discover from graph labels",
      "",
      "MEMORY TIERS:",
      "  tiers                     Show memory tier summary",
      "  tiers-scan                Auto-scan and tier memory files",
      "  tiers-freeze <filepath>   Freeze a file to immutable tier",
      "",
      "INTELLIGENCE:",
      "  timeline                  Timeline intelligence",
      '  timeline-ask <question>   Ask a timeline question',
      "",
      "GOVERNANCE:",
      "  governance                Run memory governance check",
      "  cleanup                   Auto-cleanup archived entities",
      ""
    ].join("\n"));
    return;
  }

  switch (command) {
    // ── CORE ──
    case "status":
      console.log(quickSummary());
      return;

    case "summary":
      console.log(formatOperationalSummary(buildOperationalSummary("ON_DEMAND")));
      return;

    case "morning":
      console.log(formatOperationalSummary(buildOperationalSummary("MORNING_SYNTHESIS")));
      return;

    case "identity":
      console.log(formatIdentity(getIdentity()));
      return;

    case "snapshot": {
      const label = args.join(" ") || "manual";
      const snapshot = captureSnapshot(label);
      console.log(formatSnapshot(snapshot));
      return;
    }

    case "latest-snapshot": {
      const snapshot = getLatestSnapshot();
      if (!snapshot) { console.log("No snapshots yet."); return; }
      console.log(formatSnapshot(snapshot));
      return;
    }

    // ── MEMORY: Objectives ──
    case "objective": {
      const title = args[0];
      const description = args[1];
      const priority = (args[2] || "medium") as "critical" | "high" | "medium" | "low";
      if (!title || !description) { throw new Error("Usage: hestia objective <title> <description> [priority]"); }
      const obj = createObjective(title, description, priority);
      console.log(`Objective created: ${obj.id}`);
      console.log(`Title: ${obj.title}`);
      console.log(`Priority: ${obj.priority}`);
      return;
    }

    case "objective-status": {
      const id = args[0];
      const status = args[1] as "active" | "completed" | "blocked" | "abandoned";
      const note = args.slice(2).join(" ") || undefined;
      if (!id || !status) { throw new Error("Usage: hestia objective-status <id> <active|completed|blocked|abandoned> [note]"); }
      const updated = updateObjectiveStatus(id, status, note);
      if (!updated) throw new Error(`Objective not found: ${id}`);
      console.log(`Objective ${id} updated → ${status}`);
      return;
    }

    case "objectives": {
      const active = listActiveObjectives();
      if (active.length === 0) { console.log("No active objectives."); return; }
      console.log("ACTIVE OBJECTIVES (by priority):");
      for (const obj of active) console.log(`  [${obj.priority.toUpperCase()}] ${obj.title} — ${obj.id}`);
      return;
    }

    // ── MEMORY: Decisions ──
    case "decision": {
      const [title, context, decision, ...rationaleParts] = args;
      const rationale = rationaleParts.join(" ");
      if (!title || !context || !decision || !rationale) { throw new Error("Usage: hestia decision <title> <context> <decision> <rationale>"); }
      const dec = recordDecision(title, context, decision, rationale);
      console.log(`Decision recorded: ${dec.id}`);
      return;
    }

    case "decisions": {
      const decisions = listRecentDecisions(10);
      if (decisions.length === 0) { console.log("No decisions recorded yet."); return; }
      console.log("RECENT DECISIONS:");
      for (const d of decisions) console.log(`  ${d.createdAt.slice(0, 16)} | ${d.title} | ${d.id}`);
      return;
    }

    // ── MEMORY: Blockers ──
    case "blocker": {
      const [title, description, severity] = args;
      if (!title || !description) { throw new Error("Usage: hestia blocker <title> <description> [blocking|warning|info]"); }
      const blocker = registerBlocker(title, description, (severity as "blocking" | "warning" | "info") || "warning");
      console.log(`Blocker registered: ${blocker.id} (${blocker.severity})`);
      return;
    }

    case "resolve-blocker": {
      const [id, ...resolutionParts] = args;
      const resolution = resolutionParts.join(" ");
      if (!id || !resolution) { throw new Error("Usage: hestia resolve-blocker <id> <resolution>"); }
      const resolved = resolveBlocker(id, resolution);
      if (!resolved) throw new Error(`Blocker not found: ${id}`);
      console.log(`Blocker resolved: ${id}`);
      return;
    }

    case "blockers": {
      const blockers = listActiveBlockers();
      if (blockers.length === 0) { console.log("No active blockers. ✅"); return; }
      console.log("ACTIVE BLOCKERS:");
      for (const b of blockers) {
        const icon = b.severity === "blocking" ? "🔴" : b.severity === "warning" ? "🟡" : "🟢";
        console.log(`  ${icon} [${b.severity}] ${b.title}: ${b.description}`);
        console.log(`     Areas: ${b.affectedAreas.join(", ") || "none"}`);
      }
      return;
    }

    // ── SESSION ──
    case "session": {
      const session = getOrCreateSession();
      console.log("CURRENT SESSION:");
      console.log(`  ID: ${session.sessionId}`);
      console.log(`  Started: ${session.startedAt}`);
      console.log(`  Last activity: ${session.lastActivity}`);
      console.log(`  Current focus: ${session.currentFocus}`);
      console.log(`  Next steps (${session.nextSteps.length}):`);
      for (const step of session.nextSteps) console.log(`    • ${step}`);
      console.log(`  Summary: ${session.summary}`);
      return;
    }

    case "next-step": {
      const step = args.join(" ");
      if (!step) throw new Error("Usage: hestia next-step <step>");
      const session = addNextStep(step);
      console.log(`Next step added. Total: ${session.nextSteps.length}`);
      return;
    }

    case "clear-steps": {
      clearNextSteps();
      console.log("All next steps cleared.");
      return;
    }

    case "focus": {
      const focus = args.join(" ");
      if (!focus) throw new Error("Usage: hestia focus <focus>");
      updateSession({ currentFocus: focus });
      console.log(`Focus updated: ${focus}`);
      return;
    }

    // ── GRAPH & LINKS ──
    case "graph": {
      scanEntityGraph();
      console.log(printGraphSummary());
      return;
    }

    case "graph-stats": {
      const stats = getGraphStats();
      if (!stats) { console.log("Graph not yet built. Run `hestia graph` first."); return; }
      console.log("ENTITY GRAPH STATS:");
      console.log(`  Total nodes: ${stats.totalNodes}`);
      console.log(`  Total edges: ${stats.totalEdges}`);
      console.log(`  Avg connections/node: ${stats.avgConnectionsPerNode}`);
      console.log("");
      console.log("  Nodes by type:");
      for (const [type, count] of Object.entries(stats.nodeTypeCounts).sort((a, b) => b[1] - a[1]))
        console.log(`    ${type}: ${count}`);
      console.log("");
      console.log("  Relations:");
      for (const [rel, count] of Object.entries(stats.relationCounts).sort((a, b) => b[1] - a[1]))
        console.log(`    ${rel}: ${count}`);
      return;
    }

    case "find-related": {
      const entityId = args[0];
      if (!entityId) throw new Error("Usage: hestia find-related <entityId>");
      const related = findRelatedEntities(entityId);
      if (related.length === 0) { console.log(`No related entities found for: ${entityId}`); return; }
      console.log(`Entities related to ${entityId}:`);
      for (const node of related) console.log(`  ${node.type} | ${node.label} | ${node.id}`);
      return;
    }

    case "deep-link": {
      const result = runDeepLinking();
      console.log(printDeepLinkSummary(result.stats));
      console.log(`Graph updated: ${result.graph.updatedAt}`);
      return;
    }

    // ── CANONICAL ENTITIES ──
    case "canonical": {
      const name = args[0];
      const entityType = (args[1] || "feature") as "task" | "feature" | "module" | "system" | "component" | "provider" | "agent";
      const tags = args.slice(2).filter((t) => !t.startsWith("--"));
      if (!name) { throw new Error("Usage: hestia canonical <name> [type] [tags...]"); }
      const entity = registerCanonical(name, entityType, tags);
      console.log(`Canonical entity registered: ${entity.canonicalId}`);
      console.log(`  Name: ${entity.canonicalName}`);
      console.log(`  Type: ${entity.entityType}`);
      console.log(`  Aliases: ${entity.aliases.length}`);
      return;
    }

    case "canonical-search": {
      const query = args.join(" ");
      if (!query) { console.log(printCanonicalSummary()); return; }
      const results = searchCanonical(query);
      if (results.length === 0) { console.log(`No canonical entities matching: ${query}`); return; }
      console.log(`Canonical entities matching "${query}":`);
      for (const e of results) console.log(`  ${e.canonicalName} [${e.entityType}] — ${e.linkedEntityIds.length} links`);
      return;
    }

    case "canonical-merge": {
      const [sourceId, targetId] = args;
      if (!sourceId || !targetId) { throw new Error("Usage: hestia canonical-merge <sourceId> <targetId>"); }
      const merged = mergeCanonical(sourceId, targetId);
      if (!merged) { console.log("Merge failed — one or both entities not found."); return; }
      console.log(`Merged ${sourceId} → ${targetId}`);
      console.log(`Target now has ${merged.aliases.length} aliases and ${merged.linkedEntityIds.length} links`);
      return;
    }

    case "canonical-stats":
      console.log(printCanonicalSummary());
      return;

    case "canonical-discover": {
      const graph = readGraph();
      if (!graph) { console.log("Graph not built yet. Run `hestia graph` first."); return; }
      const labels = Object.values(graph.nodes).map((n) => n.label);
      const created = autoDiscoverFromGraph(labels);
      console.log(`Auto-discovered ${created.length} canonical entities from ${labels.length} graph labels.`);
      console.log(printCanonicalSummary());
      return;
    }

    // ── MEMORY TIERS ──
    case "tiers":
      console.log(formatTierSummary());
      return;

    case "tiers-scan": {
      const result = autoTier();
      console.log(`Tier scan complete. Promoted: ${result.promoted}, Archived: ${result.archived}`);
      console.log("");
      console.log(formatTierSummary());
      return;
    }

    case "tiers-freeze": {
      const filepath = args[0];
      if (!filepath) throw new Error("Usage: hestia tiers-freeze <filepath>");
      const record = freezeToImmutable(filepath, { type: "report", title: path.basename(filepath), tags: [] });
      console.log(`Frozen to immutable tier: ${record.id}`);
      return;
    }

    // ── INTELLIGENCE ──
    case "timeline": {
      console.log(formatTimelineIntelligence(buildTimelineIntelligence()));
      return;
    }

    case "timeline-ask": {
      const question = args.join(" ");
      if (!question) throw new Error("Usage: hestia timeline-ask <question>");
      console.log(answerTimelineQuestion(question));
      return;
    }

    // ── GOVERNANCE ──
    case "governance":
      console.log(formatGovernanceReport(runGovernanceCheck()));
      return;

    case "cleanup": {
      const result = autoCleanup();
      console.log(`Auto-cleanup complete. Archived: ${result.archived}`);
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        for (const err of result.errors) console.log(`    ⚠️ ${err}`);
      }
      return;
    }

    default:
      throw new Error(`Unknown Hestia command: ${command}. Use 'help' for available commands.`);
  }
}

main();