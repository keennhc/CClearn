import { useMutation } from '@tanstack/react-query';
import type { CreateMessageDto } from '@home-owners-hub/shared-types';
import { postMessage } from '../api/communityApi';

export function usePostMessage(communityId: string) {
  return useMutation({
    mutationFn: (dto: CreateMessageDto) => postMessage(communityId, dto),
  });
}
