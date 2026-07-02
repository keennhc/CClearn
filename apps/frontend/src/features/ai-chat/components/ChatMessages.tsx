import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Alert, Box, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { EmptyState } from '../../../components/EmptyState';
import type { AiChatMessage } from '@home-owners-hub/shared-types';

interface ChatMessagesProps {
  messages: AiChatMessage[];
  isSending: boolean;
  error: boolean;
  onSend: (text: string) => void;
}

export function ChatMessages({ messages, isSending, error, onSend }: ChatMessagesProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <Box display="flex" flexDirection="column" sx={{ height: 420 }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {messages.length === 0 ? <EmptyState message="Start a conversation" /> : null}

        <Stack spacing={1}>
          {messages.map((msg) => (
            <Box key={msg.id} alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'} maxWidth="85%">
              <Paper
                sx={{
                  p: 1,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                  color: msg.role === 'user' ? '#fff' : 'text.primary',
                }}
              >
                <Typography variant="body2" whiteSpace="pre-wrap">
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))}

          {isSending ? (
            <Box alignSelf="flex-start">
              <Typography variant="caption" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          ) : null}
        </Stack>
        <div ref={bottomRef} />
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>
          AI assistant is unavailable, please try again.
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} component="form" onSubmit={handleSubmit} sx={{ p: 1.5, pt: 0 }}>
        <TextField
          fullWidth
          placeholder="Ask something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          size="small"
          disabled={isSending}
        />
        <IconButton type="submit" color="primary" disabled={isSending || !text.trim()}>
          <SendIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
