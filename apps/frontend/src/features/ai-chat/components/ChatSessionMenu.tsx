import { Box, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { AiChatSession } from '@home-owners-hub/shared-types';

interface ChatSessionMenuProps {
  sessions: AiChatSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function ChatSessionMenu({ sessions, activeSessionId, onSelect, onCreate, onClose }: ChatSessionMenuProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
        AI Assistant
      </Typography>

      <Box flex={1}>
        {sessions.length > 0 ? (
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={activeSessionId ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            // Without this, the dropdown renders in a portal outside the
            // widget's DOM subtree, so picking a session would be
            // misread as a click-away and close the whole chat.
            MenuProps={{ disablePortal: true }}
          >
            <MenuItem value="" disabled>
              Select a conversation
            </MenuItem>
            {sessions.map((session) => (
              <MenuItem key={session.id} value={session.id}>
                {session.title}
              </MenuItem>
            ))}
          </Select>
        ) : null}
      </Box>

      <IconButton size="small" onClick={onCreate} aria-label="New chat">
        <AddIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onClose} aria-label="Close chat">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
