# Hermes Gmail Draft Bridge Plan

Account:
atelieros.ops@gmail.com

## Purpose

Create Gmail drafts from approved Hermes local drafts.

This is not direct sending.

## Current status

- Hermes can analyse local email samples.
- Hermes can create local draft replies.
- Hermes can parse latest local draft into:
  - to
  - subject
  - body
  - safety marker
- Hermes can create local send requests with Miguel approval.
- Real Gmail sending is still blocked.

## Draft bridge flow

1. Hermes creates a local draft.
2. Miguel reviews the local draft.
3. ZEUS parses the draft.
4. ZEUS creates a Gmail draft in atelieros.ops@gmail.com.
5. Miguel reviews the draft in Gmail.
6. Sending remains blocked until a future send-draft gate exists.

## Required future setup

- Google Cloud project.
- Gmail API enabled.
- OAuth Desktop client.
- credentials file stored outside Git.
- token file stored outside Git.
- Gmail scope limited initially to draft creation.
- No credentials committed to repository.

## Forbidden

- Do not send emails directly in this phase.
- Do not store Gmail credentials in Git.
- Do not archive, delete or label emails automatically.
- Do not use Miguel's personal email.
- Do not bypass --approved-by Miguel gates.

## Fixed rule

Hermes prepares.
ZEUS creates reviewable drafts.
Miguel approves.
Sending is a separate future gate.
