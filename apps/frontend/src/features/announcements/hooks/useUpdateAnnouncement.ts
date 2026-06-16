import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateAnnouncementDto } from '@home-owners-hub/shared-types';
import { updateAnnouncement } from '../api/announcementsApi';

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAnnouncementDto }) =>
      updateAnnouncement(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}
