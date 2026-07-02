import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class GeminiClient {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    const geminiConfig = configService.get('gemini', { infer: true });
    this.ai = new GoogleGenAI({ apiKey: geminiConfig.apiKey });
    this.model = geminiConfig.model;
  }

  // Isolated in its own class (rather than called directly from AiChatService)
  // purely so AiChatService's tests can mock this one method instead of hitting the network.
  async reply(history: { role: 'user' | 'model'; text: string }[], message: string): Promise<string> {
    const chat = this.ai.chats.create({
      model: this.model,
      history: history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      config: {
        systemInstruction:
          'You are an assistant for admins of Home Owners Hub, a multi-community homeowner platform. Be concise and helpful.',
      },
    });
    const response = await chat.sendMessage({ message });
    return response.text ?? '';
  }
}
