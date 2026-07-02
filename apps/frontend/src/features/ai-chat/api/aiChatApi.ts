import type {
  ApiResponse,
  AiChatSession,
  AiChatMessage,
  SendAiChatMessageResponse,
} from '@home-owners-hub/shared-types';
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
