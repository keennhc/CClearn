import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAnnouncement } from '../api/announcementsApi';

export function useDeleteAnnouncement(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(communityId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', communityId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
