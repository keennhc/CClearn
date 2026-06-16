import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CommunityMessage } from '@home-owners-hub/shared-types';
import { getMessages } from '../api/communityApi';

const PAGE_SIZE = 20;

export function useCommunityMessages() {
  const [page, setPage] = useState<number | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);

  const metaQuery = useQuery({
    queryKey: ['community-messages', 'meta'],
    queryFn: () => getMessages(1, PAGE_SIZE),
  });

  useEffect(() => {
    if (metaQuery.data && page === null) {
      const lastPage = Math.max(1, Math.ceil(metaQuery.data.total / PAGE_SIZE));
      setPage(lastPage);
      if (lastPage === 1) {
        setMessages(metaQuery.data.items);
      }
    }
  }, [metaQuery.data, page]);

  const pageQuery = useQuery({
    queryKey: ['community-messages', page],
    queryFn: () => getMessages(page as number, PAGE_SIZE),
    enabled: page !== null && page > 1,
  });

  useEffect(() => {
    if (pageQuery.data) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const incoming = pageQuery.data.items.filter((m) => !existingIds.has(m.id));
        return [...incoming, ...prev];
      });
    }
  }, [pageQuery.data]);

  const loadOlder = () => {
    setPage((current) => (current && current > 1 ? current - 1 : current));
  };

  const addMessage = (message: CommunityMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const hasMore = (page ?? 1) > 1;
  const isLoading = metaQuery.isLoading || pageQuery.isLoading;

  return { messages, isLoading, hasMore, loadOlder, addMessage };
}
