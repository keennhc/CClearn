import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AiChatWidgetProvider, useAiChatWidget } from './AiChatWidgetContext';

const play = vi.fn().mockResolvedValue(undefined);

function wrapper({ children }: { children: ReactNode }) {
  return <AiChatWidgetProvider>{children}</AiChatWidgetProvider>;
}

beforeEach(() => {
  play.mockClear();
  vi.stubGlobal(
    'Audio',
    vi.fn().mockImplementation(() => ({ play })),
  );
});

describe('AiChatWidgetContext', () => {
  it('starts closed with no unread notification', () => {
    const { result } = renderHook(() => useAiChatWidget(), { wrapper });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.hasUnread).toBe(false);
  });

  it('does not flag unread or play a sound when a reply arrives while open', () => {
    const { result } = renderHook(() => useAiChatWidget(), { wrapper });

    act(() => result.current.open());
    act(() => result.current.notifyReplyReady());

    expect(result.current.hasUnread).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it('flags unread and plays a sound when a reply arrives while closed', () => {
    const { result } = renderHook(() => useAiChatWidget(), { wrapper });

    act(() => result.current.open());
    act(() => result.current.close());
    act(() => result.current.notifyReplyReady());

    expect(result.current.hasUnread).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('clears the unread flag on reopen without replaying the sound', () => {
    const { result } = renderHook(() => useAiChatWidget(), { wrapper });

    act(() => result.current.open());
    act(() => result.current.close());
    act(() => result.current.notifyReplyReady());
    act(() => result.current.open());

    expect(result.current.hasUnread).toBe(false);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useAiChatWidget())).toThrow(
      'useAiChatWidget must be used within AiChatWidgetProvider',
    );
  });
});
