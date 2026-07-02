import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesModule } from '../communities/communities.module';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { GeminiClient } from './gemini.client';

@Module({
  // CommunitiesModule imported so AdminGuard (referenced via @UseGuards in
  // the controller) can resolve CommunitiesService -- same pattern
  // CommunityModule already uses for CommunityAdminGuard, and neither guard
  // needs to be listed in `providers` for Nest to instantiate it.
  imports: [TypeOrmModule.forFeature([AiChatSession, AiChatMessage]), CommunitiesModule],
  controllers: [AiChatController],
  providers: [AiChatService, GeminiClient],
})
export class AiChatModule {}
