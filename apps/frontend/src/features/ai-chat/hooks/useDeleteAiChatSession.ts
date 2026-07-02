import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAiChatSession } from '../api/aiChatApi';

export function useDeleteAiChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAiChatSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] }),
  });
}
