import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
