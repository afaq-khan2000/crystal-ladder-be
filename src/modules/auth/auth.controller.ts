import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { RegisterUserDto } from '@/modules/auth/dto/registration.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  @ApiOperation({ summary: 'Request password reset (send OTP to email)' })
  @ApiOkResponse()
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiOkResponse()
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }
}
