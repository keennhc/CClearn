import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiChatService } from './ai-chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get('sessions')
  listSessions(@CurrentUser() user: { id: string }) {
    return this.aiChatService.listSessions(user.id);
  }

  @Post('sessions')
  createSession(@CurrentUser() user: { id: string }) {
    return this.aiChatService.createSession(user.id);
  }

  @Get('sessions/:id/messages')
  listMessages(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.aiChatService.listMessages(user.id, id);
  }

  @Post('sessions/:id/messages')
  sendMessage(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.aiChatService.sendMessage(user.id, id, dto.message);
  }

  @Delete('sessions/:id')
  deleteSession(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.aiChatService.deleteSession(user.id, id);
  }
}
