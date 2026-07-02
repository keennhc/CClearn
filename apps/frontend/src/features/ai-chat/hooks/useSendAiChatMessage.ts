import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAiChatMessage } from '../api/aiChatApi';

interface SendAiChatMessageVariables {
  sessionId: string;
  message: string;
}

export function useSendAiChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    // sessionId is a mutate-time argument, not bound at hook creation, so a
    // caller can create a session and send the first message in it without
    // waiting on a re-render to pick up the new id.
    mutationFn: ({ sessionId, message }: SendAiChatMessageVariables) => sendAiChatMessage(sessionId, message),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });
}
