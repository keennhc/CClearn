import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: { firstName?: string; lastName?: string; profileImageUrl?: string | null },
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
