# Hermes / Gmail Read-Only Plan

Account:
atelieros.ops@gmail.com

## Purpose

This account is the operational email interface for AtelierOS and ZEUS/Hermes.

It is not Miguel's personal inbox.

## Phase 1 — Local Safe Mode

Status: active

Hermes analyses local email samples only.

Allowed:
- read local JSON email samples;
- classify messages;
- extract risks;
- extract requested actions;
- detect possible scope changes;
- create local draft replies;
- create local reports.

Blocked:
- sending email;
- deleting email;
- archiving email;
- modifying Gmail;
- promising deadlines;
- accepting scope changes;
- accessing Miguel's personal email.

## Phase 2 — Gmail Read-Only Bridge

Status: planned

Allowed:
- read authorised inbox summaries;
- read selected email bodies;
- classify emails;
- extract risks, deadlines and requests;
- create local reports;
- create local drafts.

Blocked:
- send email;
- delete email;
- archive email;
- label email;
- forward email;
- create external commitments;
- interact with personal/sensitive accounts.

## Phase 3 — Gmail Draft Bridge

Status: planned

Allowed:
- create Gmail drafts for Miguel review;
- update existing drafts after Miguel review.

Blocked:
- send drafts automatically;
- send replies without explicit approval;
- archive/delete messages;
- assume commitments or deadlines.

## Phase 4 — Approval-Gated Send

Status: future

Allowed only with explicit Miguel approval:
- send a specific reviewed draft;
- reply to a specific thread;
- forward a specific message.

Approval format must be explicit:
APPROVE_EMAIL_SEND <draft_id_or_action_id>

## Fixed Rules

1. Hermes prepares. Miguel approves.
2. No email is sent without explicit approval.
3. No message is deleted or archived by default.
4. No deadline is promised without scope and schedule review.
5. No scope change is accepted without checking proposal/honorários.
6. Gmail credentials must never be committed to Git.
7. OAuth tokens/secrets must remain outside the repository.
8. atelieros.ops@gmail.com is operational; Miguel's personal email remains separate.
