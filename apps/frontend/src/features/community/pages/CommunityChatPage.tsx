import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { useAuth } from '../../auth/context/AuthContext';
import { useCommunityMessages } from '../hooks/useCommunityMessages';
import { usePostMessage } from '../hooks/usePostMessage';

export function CommunityChatPage() {
  const { messages, isLoading, hasMore, loadOlder, addMessage } = useCommunityMessages();
  const postMutation = usePostMessage();
  const [text, setText] = useState('');
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);

  useEffect(() => {
    if (!isLoading && !hasScrolledInitially.current) {
      bottomRef.current?.scrollIntoView();
      hasScrolledInitially.current = true;
    }
  }, [isLoading]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = text.trim();
    if (!message) {
      return;
    }

    postMutation.mutate(
      { message },
      {
        onSuccess: (created) => {
          addMessage(created);
          setText('');
          requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
        },
      },
    );
  };

  return (
    <Box p={3} display="flex" flexDirection="column" height="calc(100vh - 64px)">
      <Typography variant="h4" fontWeight={600} mb={2}>
        Community Chat
      </Typography>

      <Paper
        variant="outlined"
        sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}
      >
        {isLoading ? <LoadingState /> : null}

        {!isLoading && hasMore ? (
          <Box textAlign="center" mb={1}>
            <Button size="small" onClick={loadOlder}>
              Load older messages
            </Button>
          </Box>
        ) : null}

        {!isLoading && messages.length === 0 ? (
          <EmptyState message="No messages yet. Be the first to say hello!" />
        ) : null}

        <Stack spacing={1.5}>
          {messages.map((message) => (
            <Box
              key={message.id}
              alignSelf={message.userId === user?.id ? 'flex-end' : 'flex-start'}
              maxWidth="70%"
            >
              <Typography variant="caption" color="text.secondary">
                {message.userName} &middot; {new Date(message.createdAt).toLocaleString()}
              </Typography>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: message.userId === user?.id ? 'primary.main' : 'grey.100',
                  color: message.userId === user?.id ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="body2" whiteSpace="pre-wrap">
                  {message.message}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Stack>
        <div ref={bottomRef} />
      </Paper>

      <Stack
        direction="row"
        spacing={1}
        component="form"
        onSubmit={handleSubmit}
        mt={2}
      >
        <TextField
          fullWidth
          placeholder="Write a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          size="small"
        />
        <Button type="submit" variant="contained" disabled={postMutation.isPending || !text.trim()}>
          Send
        </Button>
      </Stack>
    </Box>
  );
}
