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
