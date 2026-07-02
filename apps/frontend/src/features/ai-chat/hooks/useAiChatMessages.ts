import { useQuery } from '@tanstack/react-query';
import { getAiChatMessages } from '../api/aiChatApi';

export function useAiChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ['ai-chat-messages', sessionId],
    queryFn: () => getAiChatMessages(sessionId!),
    enabled: !!sessionId,
  });
}
