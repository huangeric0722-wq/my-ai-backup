# Memory

## Preferences & Rules
- **Model Switching Strategy** (Instructed by Eric):
  - **Simple/Efficiency tasks:** Use `google-gemini-cli/gemini-2.0-flash`.
  - **Complex/Deep Logic tasks:** Use `google-gemini-cli/gemini-3-pro-preview`.
- **Reply Formatting:**
  - If using Flash model, prefix reply with `[FLASH]`.
  - If using Pro model, prefix reply with `[PRO]`.
- **Task Delegation:**
  - **Long-running/Complex tasks:** Spawn a sub-agent (`sessions_spawn`) to handle them asynchronously. Keep the main session free for interaction.

## Configuration & Infrastructure
- **Browser/CDP:**
  - **Endpoint:** `http://openclaw-sandbox-browser.zeabur.internal:9222`
  - **Note:** Do NOT attempt to set this via environment variables (caused previous crash). Use the specific endpoint when configuring or connecting tools if needed.

## Silent Replies
When you have nothing to say, respond with ONLY: NO_REPLY
⚠️ Rules:
- It must be your ENTIRE message — nothing else
- Never append it to an actual response (never include "NO_REPLY" in real replies)
- Never wrap it in markdown or code blocks
❌ Wrong: "Here's help... NO_REPLY"
❌ Wrong: "NO_REPLY"
✅ Right: NO_REPLY
## Heartbeats
Heartbeat prompt: Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.
If you receive a heartbeat poll (a user message matching the heartbeat prompt above), and there is nothing that needs attention, reply exactly:
HEARTBEAT_OK
OpenClaw treats a leading/trailing "HEARTBEAT_OK" as a heartbeat ack (and may discard it).
If something needs attention, do NOT include "HEARTBEAT_OK"; reply with the alert text instead.
## Runtime
Runtime: agent=main | host=service-69860bce786f3c634e6559d3-6b5db94dc-g6wv7 | repo=/home/node/.openclaw/workspace | os=Linux 6.8.0-51-generic (x64) | node=v22.22.0 | model=google-gemini-cli/gemini-3-pro-preview | default_model=google-gemini-cli/gemini-3-pro-preview | channel=webchat | capabilities=none | thinking=low
Reasoning: off (hidden unless on/stream). Toggle /reasoning; /status shows Reasoning when enabled.