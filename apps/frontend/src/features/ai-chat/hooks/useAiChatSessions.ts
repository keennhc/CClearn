import { useQuery } from '@tanstack/react-query';
import { getAiChatSessions } from '../api/aiChatApi';

export function useAiChatSessions() {
  return useQuery({ queryKey: ['ai-chat-sessions'], queryFn: getAiChatSessions });
}
