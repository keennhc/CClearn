import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAiChatSession } from '../api/aiChatApi';

export function useCreateAiChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAiChatSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] }),
  });
}
