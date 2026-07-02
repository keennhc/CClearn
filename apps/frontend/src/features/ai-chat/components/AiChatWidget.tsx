import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Badge, Box, ClickAwayListener, Fab, Grow, Paper } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useAiChatWidget } from '../context/AiChatWidgetContext';
import { useAiChatSessions } from '../hooks/useAiChatSessions';
import { useCreateAiChatSession } from '../hooks/useCreateAiChatSession';
import { useAiChatMessages } from '../hooks/useAiChatMessages';
import { useSendAiChatMessage } from '../hooks/useSendAiChatMessage';
import { ChatMessages } from './ChatMessages';
import { ChatSessionMenu } from './ChatSessionMenu';

export function AiChatWidget() {
  const { isOpen, hasUnread, open, close, notifyReplyReady } = useAiChatWidget();
  const sessions = useAiChatSessions();
  const createSession = useCreateAiChatSession();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const messages = useAiChatMessages(activeSessionId);
  const sendMessage = useSendAiChatMessage();

  // Resume the most recently active conversation once sessions load, if none picked yet.
  useEffect(() => {
    if (!activeSessionId && sessions.data && sessions.data.length > 0) {
      setActiveSessionId(sessions.data[0].id);
    }
  }, [sessions.data, activeSessionId]);

  // Fires the badge/sound path exactly when a send settles (success OR
  // failure) -- independent of whether the panel is currently rendered,
  // since this component never unmounts on route change. useMutation resets
  // isSuccess/isError to false on each new mutate() call, so this correctly
  // re-fires per message, not just once.
  useEffect(() => {
    if (sendMessage.isSuccess || sendMessage.isError) notifyReplyReady();
  }, [sendMessage.isSuccess, sendMessage.isError]);

  // Escape closes the panel, matching standard popover/dialog dismissal.
  // A React onKeyDown (rather than a window listener) so it naturally
  // respects stopPropagation() from nested MUI popovers -- e.g. the session
  // Select's own dropdown also closes on Escape and stops the event there,
  // which would otherwise also bubble to a window-level listener and close
  // the whole widget when the user only meant to dismiss the dropdown.
  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  const handleSend = async (text: string) => {
    // No session yet (brand new user, or "Start a conversation" state) --
    // create one first and send into it directly, rather than waiting for a
    // re-render to observe the new activeSessionId.
    const sessionId = activeSessionId ?? (await createSession.mutateAsync()).id;
    if (sessionId !== activeSessionId) setActiveSessionId(sessionId);
    sendMessage.mutate({ sessionId, message: text });
  };

  return (
    // Clicking anywhere outside the widget dismisses the panel, same as a
    // standard popover -- the explicit close button is a backup affordance,
    // not the only way out.
    <ClickAwayListener onClickAway={() => isOpen && close()}>
      <Box onKeyDown={handleKeyDown}>
        <Grow in={isOpen} unmountOnExit style={{ transformOrigin: 'bottom right' }}>
          <Paper
            elevation={6}
            sx={{
              position: 'fixed',
              bottom: 96,
              right: 24,
              width: 360,
              maxWidth: 'calc(100vw - 48px)',
              zIndex: (t) => t.zIndex.drawer + 1,
            }}
          >
            <ChatSessionMenu
              sessions={sessions.data ?? []}
              activeSessionId={activeSessionId}
              onSelect={setActiveSessionId}
              onCreate={() => createSession.mutate(undefined, { onSuccess: (session) => setActiveSessionId(session.id) })}
              onClose={close}
            />
            <ChatMessages
              messages={messages.data ?? []}
              isSending={sendMessage.isPending || createSession.isPending}
              error={sendMessage.isError}
              onSend={handleSend}
            />
          </Paper>
        </Grow>

        {/* bottom:24/right:24 is reserved for this widget -- any future floating
            button must use the opposite side or stack above with extra offset. */}
        <Fab
          color="primary"
          onClick={() => (isOpen ? close() : open())}
          aria-label="AI Assistant"
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: (t) => t.zIndex.drawer + 1 }}
        >
          <Badge color="error" variant="dot" invisible={!hasUnread}>
            <ChatIcon />
          </Badge>
        </Fab>
      </Box>
    </ClickAwayListener>
  );
}
