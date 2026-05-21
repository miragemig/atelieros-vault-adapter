---
type: external_reference
id: external-ai-assistant-patterns-reference
reference_type: manual_note
licence_risk: unknown
atelieros_reuse_policy: clean_room_reimplementation_required
created_at: 2026-05-21T08:19:43.935Z
status: recorded
---

# External Reference — External AI assistant capability patterns reference

## Source
- Label: Private external reference material analysed conceptually
- Path/URL: not_recorded

## Observed capabilities
- development agent
- task queue
- error handling loop
- file processor
- memory manager
- operational HUD
- computer control
- browser control
- voice interface

## Useful patterns
- run -> error -> classify -> repair -> rerun loop
- task states such as pending, running, completed, failed and cancelled
- planner/executor separation
- file processing as a sandboxed capability
- operational cockpit for status, tasks, candidates and approvals
- memory manager with categories, history and linked notes

## Risks
- direct execution without sufficient approval gates
- unknown or incompatible licence restrictions
- risk of contaminating AtelierOS with external source material
- over-expansion into UI, voice and computer control before patch workflow is mature
- unsafe auto-install, auto-apply or external actions if copied blindly

## Licence / contamination assessment
- Licence risk: unknown
- AtelierOS reuse policy: clean_room_reimplementation_required

## Forbidden reuse
- do not copy external source code into ZEUS core
- do not copy external source code into AtelierOS
- do not copy external UI code into AtelierOS
- do not copy external prompts, assets, names or identifiable implementation details
- do not import automation behaviour that bypasses Miguel approval
- do not add paid APIs or external actions by default

## Possible ZEUS tasks
- create patchErrorClassifier.ts from clean-room design
- extend surgicalPatchWorker.ts with run -> classify -> candidate loop
- create task state schema for patch queue
- create ZEUS HUD candidate review surface
- create fileProcessor capability as sandbox-only
- create computer/browser control capability as approval-required

## Notes
External material is used only as private conceptual input. ZEUS must not store names, source paths, prompts, assets, code, UI details or identifiable implementation details from external material. Only abstract capability patterns are recorded. AtelierOS is developed and controlled by ZEUS, but any implementation that reaches AtelierOS must be original, clean-room, approval-gated and licence-safe.

## Rule
This reference may inform ZEUS capabilities and AtelierOS roadmap decisions. Any implementation that reaches AtelierOS must be clean-room, approval-gated and licence-safe.