import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Box, Button, Chip, IconButton, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { useAuth } from '../../auth/context/AuthContext';
import { useCommunityMessages } from '../hooks/useCommunityMessages';
import { usePostMessage } from '../hooks/usePostMessage';
import { uploadFile } from '../../../services/uploadApi';
import type { CommunityMessage, CreateMessageDto, UploadResult } from '@home-owners-hub/shared-types';
import { AttachmentType } from '@home-owners-hub/shared-types';

function getRoleBgColor(role: string, isOwn: boolean): string {
  if (isOwn) return 'primary.main';
  if (role === 'SUPER_ADMIN') return '#7b1fa2';
  if (role === 'ADMIN') return '#1565c0';
  return 'grey.100';
}

function getRoleTextColor(role: string, isOwn: boolean): string {
  if (isOwn || role === 'SUPER_ADMIN' || role === 'ADMIN') return '#fff';
  return 'text.primary';
}

function getRoleLabel(role: string): string | null {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'ADMIN') return 'Admin';
  return null;
}

const MAX_CHAT_MEDIA_SIZE = 25 * 1024 * 1024;

function MessageAttachment({ message }: { message: CommunityMessage }) {
  if (!message.attachmentUrl) return null;

  const type = message.attachmentType;

  if (type === AttachmentType.IMAGE || type === AttachmentType.GIF) {
    return (
      <Box mt={0.5}>
        <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={message.attachmentUrl}
            alt={message.attachmentName ?? 'image'}
            style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, display: 'block' }}
          />
        </a>
      </Box>
    );
  }

  if (type === AttachmentType.VIDEO) {
    return (
      <Box mt={0.5}>
        <video
          src={message.attachmentUrl}
          controls
          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, display: 'block' }}
        />
      </Box>
    );
  }

  return (
    <Box mt={0.5}>
      <Link
        href={message.attachmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
      >
        <InsertDriveFileIcon fontSize="small" />
        {message.attachmentName ?? 'Download file'}
      </Link>
    </Box>
  );
}

export function CommunityChatPage() {
  const { messages, isLoading, hasMore, loadOlder } = useCommunityMessages();
  const postMutation = usePostMessage();
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasScrolledInitially = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    if (messages.length > prevMessageCount.current && hasScrolledInitially.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom on first load using a callback ref pattern
  const bottomCallbackRef = (node: HTMLDivElement | null) => {
    bottomRef.current = node;
    if (node && !isLoading && !hasScrolledInitially.current) {
      node.scrollIntoView();
      hasScrolledInitially.current = true;
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_CHAT_MEDIA_SIZE) {
      alert('File must be under 25MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file, 'chat-media');
      setAttachment(result);
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = text.trim();
    if (!message && !attachment) return;

    const dto: CreateMessageDto = {};
    if (message) dto.message = message;
    if (attachment) {
      dto.attachmentUrl = attachment.url;
      dto.attachmentType = attachment.type as AttachmentType;
      dto.attachmentName = attachment.name;
    }

    postMutation.mutate(dto, {
      onSuccess: () => {
        setText('');
        setAttachment(null);
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
      },
    });
  };

  const canSend = !postMutation.isPending && !uploading && (text.trim().length > 0 || attachment !== null);

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
          {messages.map((msg) => (
            <Box
              key={msg.id}
              alignSelf={msg.userId === user?.id ? 'flex-end' : 'flex-start'}
              maxWidth="70%"
            >
              <Typography variant="caption" color="text.secondary">
                {msg.userName}
                {getRoleLabel(msg.userRole) ? (
                  <Chip
                    label={getRoleLabel(msg.userRole)}
                    size="small"
                    sx={{ ml: 0.5, height: 16, fontSize: 10, bgcolor: getRoleBgColor(msg.userRole, false), color: '#fff' }}
                  />
                ) : null}
                {' '}&middot; {new Date(msg.createdAt).toLocaleString()}
              </Typography>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: getRoleBgColor(msg.userRole, msg.userId === user?.id),
                  color: getRoleTextColor(msg.userRole, msg.userId === user?.id),
                }}
              >
                {msg.message ? (
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {msg.message}
                  </Typography>
                ) : null}
                <MessageAttachment message={msg} />
              </Paper>
            </Box>
          ))}
        </Stack>
        <div ref={bottomCallbackRef} />
      </Paper>

      <Box mt={2}>
        {attachment ? (
          <Chip
            label={attachment.name}
            onDelete={() => setAttachment(null)}
            deleteIcon={<CloseIcon />}
            size="small"
            sx={{ mb: 1 }}
          />
        ) : null}
        <Stack direction="row" spacing={1} component="form" onSubmit={handleSubmit}>
          <IconButton
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="small"
          >
            <AttachFileIcon />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.gif,.pdf,.doc,.docx,.txt,.zip"
            hidden
            onChange={handleFileSelect}
          />
          <TextField
            fullWidth
            placeholder={uploading ? 'Uploading...' : 'Write a message...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            size="small"
            disabled={uploading}
          />
          <Button type="submit" variant="contained" disabled={!canSend}>
            Send
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
