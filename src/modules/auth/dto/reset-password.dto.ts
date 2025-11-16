import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsEmail(undefined, { message: 'email must be a valid email' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @ApiProperty({
    example: 'Password@12',
    description:
      'New password. Must be 6-50 characters long and contain at least one upper-case letter, one lower-case letter, one number and one special character.',
  })
  @IsString()
  @MinLength(6, { message: 'password should be at least 6 characters long' })
  @MaxLength(50, {
    message: 'password should not be longer than 50 characters',
  })
  @Matches(/((?=.*\d)(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'password too weak, password must contain one uppercase letter, one number and one special character',
  })
  password: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code sent to the user email for password reset',
  })
  @IsString()
  @IsNotEmpty({ message: 'otp code is required' })
  otpCode: string;
}


