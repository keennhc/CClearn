import { useMutation } from '@tanstack/react-query';
import type { CreateMessageDto } from '@home-owners-hub/shared-types';
import { postMessage } from '../api/communityApi';

export function usePostMessage() {
  return useMutation({
    mutationFn: (dto: CreateMessageDto) => postMessage(dto),
  });
}
