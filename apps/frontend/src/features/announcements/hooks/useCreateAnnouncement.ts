import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateAnnouncementDto } from '@home-owners-hub/shared-types';
import { createAnnouncement } from '../api/announcementsApi';

export function useCreateAnnouncement(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateAnnouncementDto) => createAnnouncement(communityId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', communityId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
