import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateAnnouncementDto } from '@home-owners-hub/shared-types';
import { updateAnnouncement } from '../api/announcementsApi';

export function useUpdateAnnouncement(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAnnouncementDto }) =>
      updateAnnouncement(communityId, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', communityId] });
    },
  });
}
