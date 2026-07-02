# AI Chat Assistant -- Implementation Tutorial

Step-by-step walkthrough for building the feature described in `AIChatPlan.md`. Each step shows the actual code for a new (or changed) file, with comments explaining what that piece does. This is an onboarding reference, not a file to keep in sync forever -- the real source files should still follow the repo's normal comment convention (comment only the non-obvious).

Follow the steps in order; later steps depend on earlier ones (e.g. the service depends on the entities and the Gemini client).

---

## 1. Install the Gemini SDK

```bash
pnpm --filter backend add @google/genai
```

This adds Google's official Gen AI SDK to the backend only -- the frontend never talks to Gemini directly, so the API key never reaches the browser.

---

## 2. Environment variables

Add to the backend `.env` (and `docker-compose.full.yml` backend service env):

```
GEMINI_API_KEY=your-key-from-ai-studio
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` is required; `GEMINI_MODEL` is optional and defaults in code (step 5).

---

## 3. Migration + entities

Follows the same raw-SQL style as the existing migrations (see `1700000000004-AddCommunities.ts`) rather than the TypeORM `Table` builder API, for consistency.

### `apps/backend/src/database/migrations/1700000000007-AddAiChat.ts`

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiChat1700000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Holds one conversation thread per admin user.
    await queryRunner.query(`
      CREATE TABLE "ai_chat_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_chat_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_chat_sessions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Individual turns within a session; role distinguishes the human prompt
    // from the model's reply (plain varchar, not an enum, mirrors how
    // community_messages.attachmentType is modeled -- only two values, not
    // worth a Postgres enum type).
    await queryRunner.query(`
      CREATE TABLE "ai_chat_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "role" character varying NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_chat_messages_sessionId" FOREIGN KEY ("sessionId") REFERENCES "ai_chat_sessions"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_chat_messages"`);
    await queryRunner.query(`DROP TABLE "ai_chat_sessions"`);
  }
}
```

### `apps/backend/src/modules/ai-chat/entities/ai-chat-session.entity.ts`

```ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AiChatMessage } from './ai-chat-message.entity';

@Entity('ai_chat_sessions')
export class AiChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  // Auto-derived from the first user message (see AiChatService.createSession) so the
  // session list is scannable without opening every conversation.
  @Column()
  title: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => AiChatMessage, (message) => message.session)
  messages: AiChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### `apps/backend/src/modules/ai-chat/entities/ai-chat-message.entity.ts`

```ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AiChatSession } from './ai-chat-session.entity';

@Entity('ai_chat_messages')
export class AiChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  // 'user' for what the admin typed, 'model' for Gemini's reply -- matches the SDK's
  // own role vocabulary so history can be passed straight into chats.create().
  @Column()
  role: 'user' | 'model';

  @Column('text')
  content: string;

  @ManyToOne(() => AiChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: AiChatSession;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 4. Shared types

### `packages/shared-types/src/ai-chat.ts`

```ts
// Wire types shared between backend responses and frontend consumption --
// keeps the two apps from drifting out of sync on the chat contract.
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

// Shape returned by POST /ai-chat/sessions/:id/messages -- both halves of the
// turn (what the admin sent, what Gemini replied) come back in one response.
export interface SendAiChatMessageResponse {
  userMessage: AiChatMessage;
  reply: AiChatMessage;
}
```

Add `export * from './ai-chat';` to `packages/shared-types/src/index.ts`.

---

## 5. Gemini client wrapper

### `apps/backend/src/modules/ai-chat/gemini.client.ts`

```ts
import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiClient {
  // Constructed once per process; the SDK client itself is stateless per-request.
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Isolated in its own class (rather than called directly from AiChatService)
  // purely so tests can mock this one method instead of hitting the network.
  async reply(history: { role: 'user' | 'model'; text: string }[], message: string): Promise<string> {
    const chat = this.ai.chats.create({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
      // Replays prior turns so the model has conversational context -- the SDK
      // expects alternating user/model Content entries starting with 'user'.
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

---

## 6. Service

### `apps/backend/src/modules/ai-chat/dto/send-message.dto.ts`

```ts
import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  message: string;
}
```

### `apps/backend/src/modules/ai-chat/ai-chat.service.ts`

```ts
import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiChatSession as AiChatSessionDto, AiChatMessage as AiChatMessageDto } from '@home-owners-hub/shared-types';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { GeminiClient } from './gemini.client';

@Injectable()
export class AiChatService {
  constructor(
    @InjectRepository(AiChatSession) private readonly sessionRepo: Repository<AiChatSession>,
    @InjectRepository(AiChatMessage) private readonly messageRepo: Repository<AiChatMessage>,
    private readonly gemini: GeminiClient,
  ) {}

  async listSessions(userId: string): Promise<AiChatSessionDto[]> {
    const sessions = await this.sessionRepo.find({ where: { userId }, order: { updatedAt: 'DESC' } });
    return sessions.map((s) => this.toSessionDto(s));
  }

  async createSession(userId: string): Promise<AiChatSessionDto> {
    // Starts untitled; the title fills in once the first message arrives (see sendMessage).
    const session = this.sessionRepo.create({ userId, title: 'New chat' });
    const saved = await this.sessionRepo.save(session);
    return this.toSessionDto(saved);
  }

  async listMessages(userId: string, sessionId: string): Promise<AiChatMessageDto[]> {
    const session = await this.getOwnedSession(userId, sessionId);
    const messages = await this.messageRepo.find({ where: { sessionId: session.id }, order: { createdAt: 'ASC' } });
    return messages.map((m) => this.toMessageDto(m));
  }

  async sendMessage(userId: string, sessionId: string, content: string) {
    const session = await this.getOwnedSession(userId, sessionId);

    const priorMessages = await this.messageRepo.find({ where: { sessionId: session.id }, order: { createdAt: 'ASC' } });

    // Persist the user's turn before calling the model, so it's never lost
    // even if the Gemini call fails.
    const userMessage = await this.messageRepo.save(
      this.messageRepo.create({ sessionId: session.id, role: 'user', content }),
    );

    if (priorMessages.length === 0) {
      // First message in the session -- use it (truncated) as the session
      // title. Not saved yet; folded into the single save() below.
      session.title = content.slice(0, 40);
    }

    let replyText: string;
    try {
      replyText = await this.gemini.reply(
        priorMessages.map((m) => ({ role: m.role, text: m.content })),
        content,
      );
    } catch (error) {
      throw this.mapGeminiError(error);
    }

    const reply = await this.messageRepo.save(
      this.messageRepo.create({ sessionId: session.id, role: 'model', content: replyText }),
    );

    // One save covers both the possible title change above and the
    // updatedAt bump -- @UpdateDateColumn refreshes it automatically on any
    // update, which is what lets the session list sort by most-recently-active.
    await this.sessionRepo.save(session);

    return { userMessage: this.toMessageDto(userMessage), reply: this.toMessageDto(reply) };
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.getOwnedSession(userId, sessionId);
    await this.sessionRepo.remove(session);
  }

  // Every read/write goes through this so a user can never touch another
  // user's session -- including SUPER_ADMIN, who has no special case here.
  private async getOwnedSession(userId: string, sessionId: string): Promise<AiChatSession> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }

  // The SDK's documented error shape exposes `.status` on any thrown error
  // (see @google/genai's ApiError family) -- checked by value rather than an
  // `instanceof` on a specific error class, since that keeps this working
  // even if the SDK reorganizes its exported error classes across versions.
  private mapGeminiError(error: unknown): HttpException {
    const status = (error as { status?: number })?.status;
    if (status === 429) {
      return new HttpException('AI assistant is busy, try again shortly', HttpStatus.TOO_MANY_REQUESTS);
    }
    return new HttpException('AI assistant is unavailable', HttpStatus.BAD_GATEWAY);
  }

  private toSessionDto(session: AiChatSession): AiChatSessionDto {
    return {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  private toMessageDto(message: AiChatMessage): AiChatMessageDto {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
```

---

## 7. Admin guard

`/ai-chat/*` isn't scoped to one `:communityId`, so the existing `CommunityAdminGuard` doesn't fit. Add a sibling guard that answers "is this user an admin of *anything*":

### `apps/backend/src/common/guards/admin.guard.ts`

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CommunityMemberRole, UserRole } from '@home-owners-hub/shared-types';
import { CommunitiesService } from '../../modules/communities/communities.service';

// Allows SUPER_ADMIN, or a COMMUNITY_ADMIN of at least one community --
// for routes with no single :communityId to check against (unlike CommunityAdminGuard).
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

---

## 8. Controller

Applying `AdminGuard` once at the controller level keeps every handler a thin pass-through to the service -- no per-method access check to remember to add.

### `apps/backend/src/modules/ai-chat/ai-chat.controller.ts`

```ts
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiChatService } from './ai-chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get('sessions')
  listSessions(@CurrentUser() user: { id: string }) {
    return this.aiChatService.listSessions(user.id);
  }

  @Post('sessions')
  createSession(@CurrentUser() user: { id: string }) {
    return this.aiChatService.createSession(user.id);
  }

  @Get('sessions/:id/messages')
  listMessages(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.aiChatService.listMessages(user.id, id);
  }

  @Post('sessions/:id/messages')
  sendMessage(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.aiChatService.sendMessage(user.id, id, dto.message);
  }

  @Delete('sessions/:id')
  deleteSession(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.aiChatService.deleteSession(user.id, id);
  }
}
```

---

## 9. Module wiring

### `apps/backend/src/modules/ai-chat/ai-chat.module.ts`

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesModule } from '../communities/communities.module';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { GeminiClient } from './gemini.client';

@Module({
  // CommunitiesModule imported so AdminGuard can resolve CommunitiesService --
  // same pattern CommunityModule already uses for CommunityAdminGuard.
  imports: [TypeOrmModule.forFeature([AiChatSession, AiChatMessage]), CommunitiesModule],
  controllers: [AiChatController],
  providers: [AiChatService, GeminiClient],
})
export class AiChatModule {}
```

Register `AiChatModule` in `apps/backend/src/app.module.ts`'s `imports` array alongside the other feature modules.

---

## 10. API.md

Add a `## AI Chat` section documenting the five endpoints (see `AIChatPlan.md` for the exact request/response shapes) in the same format as the rest of the file.

---

## 11. Frontend -- API layer

Mirrors the existing `announcementsApi.ts` pattern: named exported functions using the shared `api` axios instance and `unwrap` helper, rather than a hand-rolled client.

### `apps/frontend/src/features/ai-chat/api/aiChatApi.ts`

```ts
import type { ApiResponse, AiChatSession, AiChatMessage, SendAiChatMessageResponse } from '@home-owners-hub/shared-types';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

export async function getAiChatSessions(): Promise<AiChatSession[]> {
  const response = await api.get<ApiResponse<AiChatSession[]>>('/ai-chat/sessions');
  return unwrap(response);
}

export async function createAiChatSession(): Promise<AiChatSession> {
  const response = await api.post<ApiResponse<AiChatSession>>('/ai-chat/sessions');
  return unwrap(response);
}

export async function deleteAiChatSession(id: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/ai-chat/sessions/${id}`);
}

export async function getAiChatMessages(sessionId: string): Promise<AiChatMessage[]> {
  const response = await api.get<ApiResponse<AiChatMessage[]>>(`/ai-chat/sessions/${sessionId}/messages`);
  return unwrap(response);
}

export async function sendAiChatMessage(sessionId: string, message: string): Promise<SendAiChatMessageResponse> {
  const response = await api.post<ApiResponse<SendAiChatMessageResponse>>(
    `/ai-chat/sessions/${sessionId}/messages`,
    { message },
  );
  return unwrap(response);
}
```

---

## 12. Frontend -- hooks

One hook per query/mutation, matching the existing `useAnnouncements` / `useCreateAnnouncement` split rather than bundling everything into one hook per resource.

### `apps/frontend/src/features/ai-chat/hooks/useAiChatSessions.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { getAiChatSessions } from '../api/aiChatApi';

export function useAiChatSessions() {
  return useQuery({ queryKey: ['ai-chat-sessions'], queryFn: getAiChatSessions });
}
```

### `apps/frontend/src/features/ai-chat/hooks/useCreateAiChatSession.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAiChatSession } from '../api/aiChatApi';

export function useCreateAiChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAiChatSession,
    // Refetches the list so the new session shows up in the switcher immediately.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] }),
  });
}
```

### `apps/frontend/src/features/ai-chat/hooks/useDeleteAiChatSession.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAiChatSession } from '../api/aiChatApi';

export function useDeleteAiChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAiChatSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] }),
  });
}
```

### `apps/frontend/src/features/ai-chat/hooks/useAiChatMessages.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { getAiChatMessages } from '../api/aiChatApi';

export function useAiChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['ai-chat-messages', sessionId],
    queryFn: () => getAiChatMessages(sessionId!),
    enabled: !!sessionId, // no session selected yet -- don't fire the request
  });
}
```

### `apps/frontend/src/features/ai-chat/hooks/useSendAiChatMessage.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAiChatMessage } from '../api/aiChatApi';

export function useSendAiChatMessage(sessionId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) => sendAiChatMessage(sessionId!, message),
    // Keeps running to completion regardless of whether AiChatWidget's panel
    // is open or closed -- this hook lives in the widget component, which
    // stays mounted either way (see step 13).
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat-messages', sessionId] }),
  });
}
```

---

## 13. Frontend -- widget context (survives panel close)

### `apps/frontend/src/features/ai-chat/context/AiChatWidgetContext.tsx`

```tsx
import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import notificationSound from '../assets/notification.mp3';

interface AiChatWidgetState {
  isOpen: boolean;
  hasUnread: boolean;
  open: () => void;
  close: () => void;
  notifyReplyReady: () => void; // called by the widget when a reply resolves
}

const AiChatWidgetContext = createContext<AiChatWidgetState | null>(null);

export function AiChatWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  // One shared Audio instance, primed on first open so later play() calls
  // aren't blocked by browser autoplay restrictions.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const open = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(notificationSound);
    }
    setIsOpen(true);
    setHasUnread(false); // reopening clears any pending notification
  };

  const close = () => setIsOpen(false);

  const notifyReplyReady = () => {
    if (isOpen) return; // user is already watching it appear -- no need to alert
    setHasUnread(true);
    audioRef.current?.play().catch(() => {
      // Autoplay can still be blocked in some browsers/tabs -- the badge
      // alone is enough of a fallback, so this failure is intentionally silent.
    });
  };

  return (
    <AiChatWidgetContext.Provider value={{ isOpen, hasUnread, open, close, notifyReplyReady }}>
      {children}
    </AiChatWidgetContext.Provider>
  );
}

export function useAiChatWidget() {
  const ctx = useContext(AiChatWidgetContext);
  if (!ctx) throw new Error('useAiChatWidget must be used within AiChatWidgetProvider');
  return ctx;
}
```

---

## 14. Frontend -- the widget itself

`ChatSessionMenu` and `ChatMessages` are left as plain MUI presentational components (a `Select`/list and a scrollable message list + `TextField`, respectively) -- omitted here since they're standard list/form rendering with no logic specific to this feature; everything feature-specific (state, timing of the badge/sound) lives in `AiChatWidget`.

### `apps/frontend/src/features/ai-chat/components/AiChatWidget.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Badge, Fab, Paper } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useAiChatWidget } from '../context/AiChatWidgetContext';
import { useAiChatSessions } from '../hooks/useAiChatSessions';
import { useCreateAiChatSession } from '../hooks/useCreateAiChatSession';
import { useAiChatMessages } from '../hooks/useAiChatMessages';
import { useSendAiChatMessage } from '../hooks/useSendAiChatMessage';
import { ChatMessages } from './ChatMessages';
import { ChatSessionMenu } from './ChatSessionMenu';

export function AiChatWidget() {
  const { isOpen, hasUnread, open, close, notifyReplyReady } = useAiChatWidget();
  const sessions = useAiChatSessions();
  const createSession = useCreateAiChatSession();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messages = useAiChatMessages(activeSessionId);
  const sendMessage = useSendAiChatMessage(activeSessionId);

  // Fires the badge/sound path exactly when a send settles (success OR
  // failure) -- independent of whether the panel is currently rendered,
  // since this component (and therefore this effect) never unmounts on
  // route change. useMutation resets isSuccess/isError to false on each new
  // mutate() call, so this correctly re-fires per message, not just once.
  useEffect(() => {
    if (sendMessage.isSuccess || sendMessage.isError) notifyReplyReady();
  }, [sendMessage.isSuccess, sendMessage.isError]);

  return (
    <>
      {isOpen && (
        <Paper
          elevation={6}
          sx={{ position: 'fixed', bottom: 96, right: 24, width: 360, maxHeight: '70vh', zIndex: (t) => t.zIndex.drawer + 1 }}
        >
          <ChatSessionMenu
            sessions={sessions.data ?? []}
            activeSessionId={activeSessionId}
            onSelect={setActiveSessionId}
            onCreate={() => createSession.mutate()}
            onClose={close}
          />
          <ChatMessages
            messages={messages.data ?? []}
            isSending={sendMessage.isPending}
            error={sendMessage.isError}
            onSend={(text) => sendMessage.mutate(text)}
          />
        </Paper>
      )}

      {/* bottom:24/right:24 is reserved for this widget -- any future floating
          button must use the opposite side or stack above with extra offset. */}
      <Fab
        color="primary"
        onClick={open}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Badge color="error" variant="dot" invisible={!hasUnread}>
          <ChatIcon />
        </Badge>
      </Fab>
    </>
  );
}
```

### Mount point -- `apps/frontend/src/layouts/AdminLayout.tsx`

Added as a sibling of the main content `Box`, inside the same top-level `Box sx={{ display: 'flex' }}` returned by `AdminLayout` (fixed positioning means it doesn't matter where in the tree it sits, only that it's rendered):

```tsx
import { AiChatWidgetProvider } from '../features/ai-chat/context/AiChatWidgetContext';
import { AiChatWidget } from '../features/ai-chat/components/AiChatWidget';

// ...inside the returned JSX, after the existing <Box component="main">...</Box>:
<AiChatWidgetProvider>
  <AiChatWidget />
</AiChatWidgetProvider>
```

No extra role check needed here -- `AdminLayout` is only ever reached through `ProtectedRoute`, which already gates on `isSuperAdmin || isCommunityAdmin`.

---

## 15. Notification sound asset

Add a short (under 1s) notification sound at `apps/frontend/src/features/ai-chat/assets/notification.mp3`. Any royalty-free UI "ping" works -- this is imported directly in step 12 via Vite's asset handling (`import notificationSound from '../assets/notification.mp3'`).

---

## 16. Manual verification checklist

- Set a real `GEMINI_API_KEY` in local `.env`, restart the backend.
- Log in as `COMMUNITY_ADMIN`, confirm the FAB appears bottom-right and doesn't overlap anything else on screen.
- Send a message, confirm a reply comes back and both are persisted (refresh the page, reopen the session, history is still there).
- Send a message, immediately close the panel, navigate to another admin page, and confirm: the badge appears on the FAB once the reply lands, the notification sound plays once, and reopening the panel shows the reply and clears the badge.
- Log in as a plain `USER` (no community admin membership) and confirm `/ai-chat/*` returns 403.
