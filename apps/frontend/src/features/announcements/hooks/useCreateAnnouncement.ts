import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateAnnouncementDto } from '@home-owners-hub/shared-types';
import { createAnnouncement } from '../api/announcementsApi';

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateAnnouncementDto) => createAnnouncement(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}
