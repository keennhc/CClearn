# AI Chat Assistant -- Implementation Plan

## Summary

Add a general-purpose AI chat assistant to the admin portal, available to `SUPER_ADMIN` and `COMMUNITY_ADMIN` users. Powered by the Gemini API (Google AI Studio) using its free tier. Conversations are plain chat (no access to live platform data) and are persisted per user in the database.

Out of scope for this plan: tool calling against platform data, streaming responses, per-community scoping of conversations, and any homeowner-facing (non-admin) chat.

---

## Provider

**Gemini API via Google AI Studio** (not Vertex AI) -- API key only, no GCP project/billing setup required.

- SDK: `@google/genai` (official Google Gen AI SDK for Node.js/TypeScript)
- Model: `gemini-2.5-flash` (good free-tier quota, fast, capable enough for a general assistant)
- Backend calls the SDK server-side only. The API key is never sent to the frontend.

```bash
pnpm --filter backend add @google/genai
```

---

## Environment Variables

Add to backend env:

```
GEMINI_API_KEY
GEMINI_MODEL   # defaults to gemini-2.5-flash if unset
```

Update `apps/backend/src/config/` env validation to include `GEMINI_API_KEY` (required) and `GEMINI_MODEL` (optional). Add both to `docker-compose.full.yml` backend service env and to any `.env.example`.

---

## Data Model

Two new tables, added via a TypeORM migration (never `synchronize: true`).

### AiChatSession

| Field | Type |
|---|---|
| id | uuid |
| userId | FK -> users |
| title | varchar (first ~40 chars of the first user message) |
| createdAt | timestamp |
| updatedAt | timestamp |

### AiChatMessage

| Field | Type |
|---|---|
| id | uuid |
| sessionId | FK -> ai_chat_sessions, onDelete CASCADE |
| role | varchar (`user` \| `model`) |
| content | text |
| createdAt | timestamp |

Migration file: `apps/backend/src/database/migrations/<timestamp>-AddAiChat.ts`, following the existing numbered-timestamp naming convention.

---

## Backend Module

New module at `apps/backend/src/modules/ai-chat/`:

```
ai-chat/
├── entities/
│   ├── ai-chat-session.entity.ts
│   └── ai-chat-message.entity.ts
├── dto/
│   └── send-message.dto.ts
├── ai-chat.controller.ts
├── ai-chat.service.ts
├── ai-chat.service.spec.ts
├── gemini.client.ts
└── ai-chat.module.ts
```

### gemini.client.ts

Thin injectable wrapper around `GoogleGenAI`, so `AiChatService` stays unit-testable without hitting the network:

```ts
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiClient {
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  async reply(history: { role: 'user' | 'model'; text: string }[], message: string): Promise<string> {
    const chat = this.ai.chats.create({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      history: history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      config: {
        systemInstruction:
          'You are an assistant for admins of Home Owners Hub, a multi-community homeowner platform. Be concise and helpful.',
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  }
}
```

### Access control

No existing guard covers "SUPER_ADMIN or COMMUNITY_ADMIN of any community" -- `CommunityAdminGuard`/`CommunityMemberGuard` are scoped to a specific `:communityId` route param, which `/ai-chat/*` doesn't have. Rather than repeat an inline check in every controller method, add one small reusable guard next to the existing ones:

`apps/backend/src/common/guards/admin.guard.ts`, following the same shape as `CommunityAdminGuard`:

```ts
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly communitiesService: CommunitiesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user;
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;

    const memberships = await this.communitiesService.getUserCommunityMemberships(user.id);
    return memberships.some((m) => m.role === CommunityMemberRole.COMMUNITY_ADMIN);
  }
}
```

Applied once, at the controller level: `@UseGuards(JwtAuthGuard, AdminGuard)`. Keeps the controller thin, per the project's coding standards.

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/ai-chat/sessions` | List the current user's sessions, newest first |
| POST | `/ai-chat/sessions` | Create a new empty session |
| GET | `/ai-chat/sessions/:id/messages` | Get all messages in a session (oldest first) |
| POST | `/ai-chat/sessions/:id/messages` | Send a message; persists it, calls Gemini, persists and returns the reply |
| DELETE | `/ai-chat/sessions/:id` | Delete a session and its messages |

All endpoints scoped to `sessionId` owned by the requesting user (a user can never read/delete another user's session, including `SUPER_ADMIN`).

`POST /ai-chat/sessions/:id/messages` body:

```json
{ "message": "string" }
```

Response:

```json
{
  "success": true,
  "data": {
    "userMessage": { "id": "uuid", "role": "user", "content": "string", "createdAt": "ISO8601" },
    "reply": { "id": "uuid", "role": "model", "content": "string", "createdAt": "ISO8601" }
  }
}
```

### Error handling

`@google/genai` throws typed errors (`RateLimitError`, `AuthenticationError`, `APIError`, etc.). Catch in `AiChatService` and map to the project's error envelope:

- `RateLimitError` -> 429, `{ success: false, message: "AI assistant is busy, try again shortly" }`
- Anything else -> 502, `{ success: false, message: "AI assistant is unavailable" }`

Never leak raw SDK error messages or the API key to the client.

---

## Shared Types

New file `packages/shared-types/src/ai-chat.ts`:

```ts
export interface AiChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface SendAiChatMessageResponse {
  userMessage: AiChatMessage;
  reply: AiChatMessage;
}
```

Export from `packages/shared-types/src/index.ts`.

---

## Frontend

Delivered as a persistent floating widget (support-widget style), not a dedicated nav page -- it must be reachable from every admin screen without losing an in-flight request.

New feature at `apps/frontend/src/features/ai-chat/`:

```
ai-chat/
├── api/
│   └── aiChatApi.ts              # axios calls via the shared `api`/`unwrap` helpers
├── hooks/
│   ├── useAiChatSessions.ts      # query: list sessions
│   ├── useCreateAiChatSession.ts # mutation
│   ├── useDeleteAiChatSession.ts # mutation
│   ├── useAiChatMessages.ts      # query: list messages for a session
│   └── useSendAiChatMessage.ts   # mutation
├── context/
│   └── AiChatWidgetContext.tsx   # open/closed, active session id, hasUnread -- lives above the panel so it survives close
├── components/
│   ├── AiChatWidget.tsx          # the FAB + anchored panel
│   ├── ChatSessionMenu.tsx       # compact switcher: recent sessions + "New chat"
│   └── ChatMessages.tsx
└── assets/
    └── notification.mp3
```

Mounted once inside `AdminLayout.tsx` (sibling to the routed `<Outlet />`), so it never unmounts on navigation and an in-flight reply keeps running even while the user browses other admin pages. `AdminLayout` is only reachable through `ProtectedRoute`, which already restricts it to `isSuperAdmin || isCommunityAdmin` -- the widget itself needs no additional role check.

### Layout and positioning

Checked the current codebase: there are no other floating/fixed-position buttons in the admin portal today, so this is a fresh reserved zone, not a fix for an existing collision.

- FAB: `position: fixed`, `bottom: 24px`, `right: 24px`, `zIndex: theme.zIndex.drawer + 1` (above content, below MUI modals/dialogs).
- Panel: anchored directly above the FAB when open -- `bottom: 96px`, `right: 24px` (56px FAB height + 16px gap), width ~360px, max-height ~70vh, so the open panel never covers the FAB itself.
- Treat `bottom: 24px; right: 24px` as reserved exclusively for this widget. If any other floating action button is added later (e.g. a "scroll to top" button), it must be placed on the opposite side (`left: 24px`) or stacked with enough offset (`bottom: 96px+`) to avoid overlap -- call this out as a one-line comment at the FAB's `sx` definition so it isn't accidentally reused.

### Behavior

1. FAB is visible on every admin route, for both `SUPER_ADMIN` and `COMMUNITY_ADMIN` views.
2. Click FAB -> opens the panel showing the active session (or an empty state: "Start a conversation").
3. The panel's close (X) button hides the panel only -- `AiChatWidget` itself, its React Query hooks, and any in-flight `sendMessage` mutation stay mounted and keep running.
4. While a reply is in flight with the panel **open**: input disabled, typing indicator shown. No badge/sound in this case -- the user is already watching it resolve.
5. While a reply is in flight with the panel **closed** and it then resolves:
   - Success: `AiChatWidgetContext` sets `hasUnread = true`, rendering an MUI `Badge` dot on the FAB, and plays `notification.mp3` once.
   - Failure: same badge treatment; the error surfaces as an `Alert` inside the panel once reopened.
6. Opening the panel clears `hasUnread` (badge disappears immediately); the sound never replays for an already-seen reply.
7. Audio playback requires a prior user gesture in most browsers -- the FAB click that opened the chat satisfies this, so preload/prime a single shared `Audio` instance on first FAB click rather than constructing a new one per reply.

### General UI

- Empty state when a user has no sessions yet ("Start a new conversation").
- Errors from the backend (429/502) surface as an MUI `Alert` in the panel, not a silent failure.
- `ChatSessionMenu` is a small dropdown in the panel header for switching sessions or starting a new one -- kept intentionally lightweight since the widget is a popover, not a full page.

---

## API.md

Add a new `## AI Chat` section documenting the five endpoints above, following the existing request/response format in the file, in the same task as the backend implementation.

---

## Testing

Backend:

- `ai-chat.service.spec.ts`: mock `GeminiClient` and repositories with `jest.fn()`, per project convention. Cases: creates a session, sends a message and persists both user + model messages, rejects access to another user's session (including as `SUPER_ADMIN`), maps a Gemini error with `status: 429` to a `TOO_MANY_REQUESTS` exception.
- `admin.guard.spec.ts`: mirrors the existing `roles.guard.spec.ts` shape. Cases: allows `SUPER_ADMIN`, allows a `COMMUNITY_ADMIN` of any community, denies a plain `USER` with no admin memberships, denies when `request.user` is undefined.

Frontend:

- `useAiChatMessages` hook test with mocked axios (loading -> success, loading -> error).
- `AiChatWidget` component tests: renders messages, disables input while sending, shows error alert on failure.
- `AiChatWidgetContext` test: reply arriving while `open=false` sets `hasUnread` and triggers the notification sound mock; reply arriving while `open=true` does neither; opening the panel clears `hasUnread`.

---

## Implementation Order

1. Migration + entities (`AiChatSession`, `AiChatMessage`)
2. Shared types (`packages/shared-types/src/ai-chat.ts`)
3. `GeminiClient` + `AiChatService` + `AiChatController` + module wiring, backend tests
4. `API.md` updates
5. Frontend feature: context + hooks + `AiChatWidget` (FAB + panel), mounted in `AdminLayout.tsx`
6. Add `notification.mp3` asset and wire up the unread badge + sound
7. Manual verification: send a message end-to-end against the real Gemini API key in local dev; confirm the FAB survives route changes and the panel-closed notification flow (badge + sound) works
8. Write `AIChatTutorial.md` -- a step-by-step walkthrough of this implementation order, with the actual code for every new file and inline comments explaining what each piece does. Intended as an onboarding reference, not something kept in sync long-term, since normal repo comment conventions (comment only the non-obvious) still apply to the real source files.

---

## Future Enhancements (not in this plan)

- Tool calling so the assistant can answer questions using live platform data (member counts, recent announcements, etc.), scoped to what the requesting admin is allowed to see.
- Streaming responses (`chat.sendMessageStream`) for a typing-as-it-generates UX.
- Per-community system prompts for `COMMUNITY_ADMIN` users.
