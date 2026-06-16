import { useQuery } from '@tanstack/react-query';
import { getAnnouncements } from '../api/announcementsApi';

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: getAnnouncements,
  });
}
