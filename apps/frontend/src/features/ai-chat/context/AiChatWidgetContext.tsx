import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import notificationSound from '../assets/notification.wav';

interface AiChatWidgetState {
  isOpen: boolean;
  hasUnread: boolean;
  open: () => void;
  close: () => void;
  notifyReplyReady: () => void;
}

const AiChatWidgetContext = createContext<AiChatWidgetState | null>(null);

export function AiChatWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  // One shared Audio instance, primed on first open so later play() calls
  // aren't blocked by browser autoplay restrictions.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const open = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(notificationSound);
    }
    setIsOpen(true);
    setHasUnread(false);
  };

  const close = () => setIsOpen(false);

  const notifyReplyReady = () => {
    if (isOpen) return; // user is already watching it appear -- no need to alert
    setHasUnread(true);
    audioRef.current?.play().catch(() => {
      // Autoplay can still be blocked in some browsers/tabs -- the badge
      // alone is enough of a fallback, so this failure is intentionally silent.
    });
  };

  return (
    <AiChatWidgetContext.Provider value={{ isOpen, hasUnread, open, close, notifyReplyReady }}>
      {children}
    </AiChatWidgetContext.Provider>
  );
}

export function useAiChatWidget() {
  const ctx = useContext(AiChatWidgetContext);
  if (!ctx) throw new Error('useAiChatWidget must be used within AiChatWidgetProvider');
  return ctx;
}
