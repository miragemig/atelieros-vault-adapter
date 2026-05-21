# Hermes Gmail OAuth Setup Notes

Account:
atelieros.ops@gmail.com

## Purpose

Prepare local ZEUS/Hermes access to Gmail using OAuth.

This setup is required before implementing:
- Gmail draft creation;
- Gmail read-only bridge;
- future approval-gated send.

## Required Google setup

1. Create or open a Google Cloud project.
2. Enable Gmail API.
3. Configure OAuth consent screen.
4. Create OAuth Client ID:
   - Application type: Desktop app.
5. Download the credentials JSON.

## Local file locations

Credentials must be stored outside Git:

founder-command-center/hermes/gmail/secrets/credentials.json

OAuth token must be stored outside Git:

founder-command-center/hermes/gmail/tokens/token.json

These paths are ignored by `.gitignore`.

## Initial scopes

Start with the minimum required scope for draft creation.

Preferred initial scope:
https://www.googleapis.com/auth/gmail.compose

Do not start with full mailbox permissions unless required.

## Forbidden

- Do not commit credentials.
- Do not commit tokens.
- Do not use Miguel personal email.
- Do not send emails directly in the first Gmail bridge phase.
- Do not archive, delete, label or modify inbox messages.
- Do not bypass Miguel approval gates.
- Do not store passwords or app passwords in the repo.

## Bridge order

1. Parse local Hermes draft.
2. Create Gmail draft.
3. Log created draft locally.
4. Miguel reviews draft in Gmail.
5. Future send-draft command sends only an approved Gmail draft.

## Fixed rule

Hermes prepares.
ZEUS creates reviewable drafts.
Miguel approves.
Sending remains a separate explicit gate.
