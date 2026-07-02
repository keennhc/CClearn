import { ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiError } from '@google/genai';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatService } from './ai-chat.service';
import { GeminiClient } from './gemini.client';

const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

function makeSession(overrides: Partial<AiChatSession> = {}): AiChatSession {
  return {
    id: SESSION_ID,
    userId: USER_ID,
    title: 'New chat',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: {} as never,
    messages: [],
    ...overrides,
  } as AiChatSession;
}

function makeMessage(overrides: Partial<AiChatMessage> = {}): AiChatMessage {
  return {
    id: 'message-1',
    sessionId: SESSION_ID,
    role: 'user',
    content: 'Hello',
    createdAt: new Date('2024-01-01'),
    session: {} as never,
    ...overrides,
  } as AiChatMessage;
}

describe('AiChatService', () => {
  let service: AiChatService;
  let sessionRepo: { find: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let messageRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let gemini: { reply: jest.Mock };

  beforeEach(async () => {
    sessionRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };
    messageRepo = { find: jest.fn(), create: jest.fn(), save: jest.fn() };
    gemini = { reply: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatService,
        { provide: getRepositoryToken(AiChatSession), useValue: sessionRepo },
        { provide: getRepositoryToken(AiChatMessage), useValue: messageRepo },
        { provide: GeminiClient, useValue: gemini },
      ],
    }).compile();

    service = module.get(AiChatService);
  });

  describe('listSessions', () => {
    it('returns sessions for the user ordered by updatedAt DESC', async () => {
      const session = makeSession();
      sessionRepo.find.mockResolvedValue([session]);

      const result = await service.listSessions(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(session.id);
      expect(sessionRepo.find).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        order: { updatedAt: 'DESC' },
      });
    });
  });

  describe('createSession', () => {
    it('creates a new session titled "New chat"', async () => {
      const session = makeSession();
      sessionRepo.create.mockReturnValue(session);
      sessionRepo.save.mockResolvedValue(session);

      const result = await service.createSession(USER_ID);

      expect(sessionRepo.create).toHaveBeenCalledWith({ userId: USER_ID, title: 'New chat' });
      expect(result.title).toBe('New chat');
    });
  });

  describe('listMessages', () => {
    it('returns messages for a session owned by the user', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      messageRepo.find.mockResolvedValue([makeMessage()]);

      const result = await service.listMessages(USER_ID, SESSION_ID);

      expect(result).toHaveLength(1);
      expect(messageRepo.find).toHaveBeenCalledWith({
        where: { sessionId: SESSION_ID },
        order: { createdAt: 'ASC' },
      });
    });

    it('throws NotFoundException when the session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(service.listMessages(USER_ID, SESSION_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the session belongs to another user', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession({ userId: 'someone-else' }));

      await expect(service.listMessages(USER_ID, SESSION_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage', () => {
    it('persists the user message and the reply, and titles the session from the first message', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession({ title: 'New chat' }));
      messageRepo.find.mockResolvedValue([]);
      const userMessage = makeMessage({ role: 'user', content: 'Hello there' });
      const reply = makeMessage({ id: 'message-2', role: 'model', content: 'Hi, how can I help?' });
      messageRepo.create.mockReturnValueOnce(userMessage).mockReturnValueOnce(reply);
      messageRepo.save.mockResolvedValueOnce(userMessage).mockResolvedValueOnce(reply);
      gemini.reply.mockResolvedValue('Hi, how can I help?');
      sessionRepo.save.mockResolvedValue(makeSession());

      const result = await service.sendMessage(USER_ID, SESSION_ID, 'Hello there');

      expect(result.userMessage.content).toBe('Hello there');
      expect(result.reply.content).toBe('Hi, how can I help?');
      expect(gemini.reply).toHaveBeenCalledWith([], 'Hello there');
      expect(sessionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hello there' }));
    });

    it('passes prior messages as history and keeps the existing title on later messages', async () => {
      const session = makeSession({ title: 'Existing title' });
      sessionRepo.findOne.mockResolvedValue(session);
      const priorMessage = makeMessage({ role: 'user', content: 'First message' });
      messageRepo.find.mockResolvedValue([priorMessage]);
      messageRepo.create.mockReturnValue(makeMessage());
      messageRepo.save.mockResolvedValue(makeMessage());
      gemini.reply.mockResolvedValue('reply text');
      sessionRepo.save.mockResolvedValue(session);

      await service.sendMessage(USER_ID, SESSION_ID, 'Second message');

      expect(gemini.reply).toHaveBeenCalledWith([{ role: 'user', text: 'First message' }], 'Second message');
      expect(sessionRepo.save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Existing title' }));
    });

    it('maps a rate-limit ApiError to a 429 HttpException', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      messageRepo.find.mockResolvedValue([]);
      messageRepo.create.mockReturnValue(makeMessage());
      messageRepo.save.mockResolvedValue(makeMessage());
      gemini.reply.mockRejectedValue(new ApiError({ message: 'rate limited', status: 429 }));

      await expect(service.sendMessage(USER_ID, SESSION_ID, 'Hello')).rejects.toThrow(HttpException);
      await expect(service.sendMessage(USER_ID, SESSION_ID, 'Hello')).rejects.toMatchObject({ status: 429 });
    });

    it('maps any other Gemini failure to a 502 HttpException', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession());
      messageRepo.find.mockResolvedValue([]);
      messageRepo.create.mockReturnValue(makeMessage());
      messageRepo.save.mockResolvedValue(makeMessage());
      gemini.reply.mockRejectedValue(new Error('network error'));

      await expect(service.sendMessage(USER_ID, SESSION_ID, 'Hello')).rejects.toMatchObject({ status: 502 });
    });

    it('throws ForbiddenException when the session belongs to another user', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession({ userId: 'someone-else' }));

      await expect(service.sendMessage(USER_ID, SESSION_ID, 'Hello')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSession', () => {
    it('removes a session owned by the user', async () => {
      const session = makeSession();
      sessionRepo.findOne.mockResolvedValue(session);

      await service.deleteSession(USER_ID, SESSION_ID);

      expect(sessionRepo.remove).toHaveBeenCalledWith(session);
    });

    it('throws ForbiddenException when the session belongs to another user', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession({ userId: 'someone-else' }));

      await expect(service.deleteSession(USER_ID, SESSION_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteSession(USER_ID, SESSION_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
