import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOkResponse, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { RegisterUserDto } from '@/modules/auth/dto/registration.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse()
  @HttpCode(200)
  @Post('login')
  async login(@Body() body: AuthDto) {
    return this.authService.login(body);
  }

  @ApiOperation({ summary: 'User registration' })
  @ApiOkResponse()
  @ApiResponse({ status: 201, description: 'User registered successfully. Verification OTP sent to email.' })
  @HttpCode(201)
  @Post('register')
  register(@Body() body: RegisterUserDto) {
    return this.authService.registration(body);
  }

  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiOkResponse()
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(200)
  @Post('verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.otpCode);
  }

  @ApiOperation({ summary: 'Resend verification OTP' })
  @ApiOkResponse()
  @ApiResponse({ status: 200, description: 'Verification OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(200)
  @Post('resend-otp')
  resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendVerificationOTP(body.email);
  }
}
