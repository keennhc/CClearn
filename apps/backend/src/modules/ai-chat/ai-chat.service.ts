import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@google/genai';
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

  async sendMessage(
    userId: string,
    sessionId: string,
    content: string,
  ): Promise<{ userMessage: AiChatMessageDto; reply: AiChatMessageDto }> {
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

  private mapGeminiError(error: unknown): HttpException {
    if (error instanceof ApiError && error.status === 429) {
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
