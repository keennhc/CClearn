import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { UnregisterTokenDto } from './dto/unregister-token.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  registerToken(@CurrentUser() user: { id: string }, @Body() dto: RegisterTokenDto) {
    return this.notificationsService.registerToken(user.id, dto);
  }

  @Delete('register-token')
  unregisterToken(@CurrentUser() user: { id: string }, @Body() dto: UnregisterTokenDto) {
    return this.notificationsService.unregisterToken(user.id, dto.token);
  }
}
