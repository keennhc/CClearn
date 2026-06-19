import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CommunityMessage } from '@home-owners-hub/shared-types';
import { getMessages } from '../api/communityApi';
import { getSocket } from '../../../services/socket';

const PAGE_SIZE = 20;

function mergeMessages(existing: CommunityMessage[], incoming: CommunityMessage[]): CommunityMessage[] {
  const ids = new Set(existing.map((m) => m.id));
  const newItems = incoming.filter((m) => !ids.has(m.id));
  if (newItems.length === 0) return existing;
  return [...existing, ...newItems].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function useCommunityMessages(communityId: string) {
  const [page, setPage] = useState<number | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);

  useEffect(() => {
    setPage(null);
    setMessages([]);
  }, [communityId]);

  const metaQuery = useQuery({
    queryKey: ['community-messages', communityId, 'meta'],
    queryFn: () => getMessages(communityId, 1, PAGE_SIZE),
    enabled: !!communityId,
  });

  useEffect(() => {
    if (!metaQuery.data || page !== null) return;

    const lastPage = Math.max(1, Math.ceil(metaQuery.data.total / PAGE_SIZE));
    setPage(lastPage);
    if (lastPage === 1) {
      setMessages(metaQuery.data.items);
    }
  }, [metaQuery.data, page]);

  const pageQuery = useQuery({
    queryKey: ['community-messages', communityId, page],
    queryFn: () => getMessages(communityId, page as number, PAGE_SIZE),
    enabled: page !== null && page > 1 && !!communityId,
  });

  useEffect(() => {
    if (pageQuery.data) {
      setMessages((prev) => mergeMessages(prev, pageQuery.data.items));
    }
  }, [pageQuery.data]);

  useEffect(() => {
    if (!communityId) return;
    const socket = getSocket();
    socket.connect();
    socket.emit('join', `community:${communityId}`);

    const handler = (message: CommunityMessage) => {
      if (message.communityId === communityId) {
        setMessages((prev) => mergeMessages(prev, [message]));
      }
    };

    socket.on('new-message', handler);

    return () => {
      socket.off('new-message', handler);
      socket.emit('leave', `community:${communityId}`);
      socket.disconnect();
    };
  }, [communityId]);

  const loadOlder = () => {
    setPage((current) => (current && current > 1 ? current - 1 : current));
  };

  const hasMore = (page ?? 1) > 1;
  const isLoading = metaQuery.isLoading || pageQuery.isLoading;

  return { messages, isLoading, hasMore, loadOlder };
}
