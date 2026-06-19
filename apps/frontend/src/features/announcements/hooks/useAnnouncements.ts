import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../api/announcementsApi';

export function useAnnouncements(communityId: string) {
  return useQuery({
    queryKey: ['announcements', communityId],
    queryFn: () => getAnnouncements(communityId),
    enabled: !!communityId,
  });
}
