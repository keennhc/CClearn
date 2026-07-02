import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AiChatWidgetProvider } from '../context/AiChatWidgetContext';
import { AiChatWidget } from './AiChatWidget';

vi.mock('../api/aiChatApi', () => ({
  getAiChatSessions: vi.fn(),
  createAiChatSession: vi.fn(),
  deleteAiChatSession: vi.fn(),
  getAiChatMessages: vi.fn(),
  sendAiChatMessage: vi.fn(),
}));

import { getAiChatSessions, getAiChatMessages, sendAiChatMessage } from '../api/aiChatApi';

const mockGetSessions = getAiChatSessions as ReturnType<typeof vi.fn>;
const mockGetMessages = getAiChatMessages as ReturnType<typeof vi.fn>;
const mockSendMessage = sendAiChatMessage as ReturnType<typeof vi.fn>;

const SESSION = { id: 's-1', title: 'New chat', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' };
const MESSAGES = [
  { id: 'm-1', sessionId: 's-1', role: 'user' as const, content: 'Hi there', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'm-2', sessionId: 's-1', role: 'model' as const, content: 'Hello, how can I help?', createdAt: '2024-01-01T00:00:01.000Z' },
];

function renderWidget() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AiChatWidgetProvider>
        <AiChatWidget />
      </AiChatWidgetProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'Audio',
    vi.fn().mockImplementation(() => ({ play: vi.fn().mockResolvedValue(undefined) })),
  );
  mockGetSessions.mockResolvedValue([SESSION]);
  mockGetMessages.mockResolvedValue(MESSAGES);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AiChatWidget', () => {
  it('renders existing messages after opening the panel', async () => {
    renderWidget();

    fireEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));

    expect(await screen.findByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
  });

  it('disables the input while a message is sending', async () => {
    let resolveSend: (value: unknown) => void = () => {};
    mockSendMessage.mockReturnValue(new Promise((resolve) => { resolveSend = resolve; }));
    renderWidget();

    fireEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));
    await screen.findByText('Hi there');

    fireEvent.change(screen.getByPlaceholderText('Ask something...'), { target: { value: 'Another question' } });
    fireEvent.submit(screen.getByPlaceholderText('Ask something...').closest('form')!);

    await waitFor(() => expect(screen.getByPlaceholderText('Ask something...')).toBeDisabled());

    resolveSend({
      userMessage: { id: 'm-3', sessionId: 's-1', role: 'user', content: 'Another question', createdAt: '2024-01-01T00:00:02.000Z' },
      reply: { id: 'm-4', sessionId: 's-1', role: 'model', content: 'Sure!', createdAt: '2024-01-01T00:00:03.000Z' },
    });

    await waitFor(() => expect(screen.getByPlaceholderText('Ask something...')).not.toBeDisabled());
  });

  it('shows an error alert when sending fails', async () => {
    mockSendMessage.mockRejectedValue(new Error('AI assistant is unavailable'));
    renderWidget();

    fireEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));
    await screen.findByText('Hi there');

    fireEvent.change(screen.getByPlaceholderText('Ask something...'), { target: { value: 'Will this fail?' } });
    fireEvent.submit(screen.getByPlaceholderText('Ask something...').closest('form')!);

    expect(await screen.findByText('AI assistant is unavailable, please try again.')).toBeInTheDocument();
  });

  it('closes when clicking outside the panel', async () => {
    renderWidget();

    fireEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));
    await screen.findByText('Hi there');

    fireEvent.click(document.body);

    await waitFor(() => expect(screen.queryByLabelText('Close chat')).not.toBeInTheDocument());
  });

  it('closes on Escape while focus is inside the panel', async () => {
    renderWidget();

    fireEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));
    await screen.findByText('Hi there');

    fireEvent.keyDown(screen.getByPlaceholderText('Ask something...'), { key: 'Escape' });

    await waitFor(() => expect(screen.queryByLabelText('Close chat')).not.toBeInTheDocument());
  });

  it('toggles closed when the FAB is clicked again while open', async () => {
    renderWidget();

    const fab = screen.getByRole('button', { name: 'AI Assistant' });
    fireEvent.click(fab);
    await screen.findByText('Hi there');

    fireEvent.click(fab);

    await waitFor(() => expect(screen.queryByLabelText('Close chat')).not.toBeInTheDocument());
  });
});
