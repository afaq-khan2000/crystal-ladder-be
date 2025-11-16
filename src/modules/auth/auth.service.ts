import { Injectable, HttpException, HttpStatus, Global } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { JwtPayload } from './interface/Jwt.interface';
import { UserService } from '../user/user.service';
import { RegisterUserDto } from './dto/registration.dto';
import { Helper as helper } from '@/utils';
import { EmailService } from '@/shared/email/email.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
@Global()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private readonly config: ConfigService,
    private emailService: EmailService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async login(body: AuthDto): Promise<unknown> {
    const user = await this.usersService.getByUserByEmail(body.email);

    if (!user)
      throw new HttpException('Invalid email/password', HttpStatus.NOT_FOUND);

    const { password, ...rest } = user;

    const verifyPassword = await helper.comparePassword(
      body.password,
      password,
    );

    if (!verifyPassword)
      throw new HttpException('Invalid email/password', HttpStatus.NOT_FOUND);

    const jwt_token = await this.createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      status: HttpStatus.OK,
      message: 'Logged in successfully. ✔️',
      data: {
        ...rest,
        access_token: jwt_token,
      },
    };
  }

  async registration(body: RegisterUserDto) {
    const user = await this.usersService.register(body);
    
    // Generate OTP and send verification email
    const otpCode = helper.generateOTP();
    user.otpCode = otpCode;
    await this.userRepository.save(user);
    
    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, otpCode);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, otpCode: _, ...rest } = user;
    return {
      status: HttpStatus.OK,
      message: 'Registration successful. Please verify your email with the OTP sent to your email address.',
      data: {
        ...rest,
      },
    };
  }

  /**
   * Forgot password - send reset OTP to email
   * @param body - Forgot password payload
   */
  async forgotPassword(body: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Generate OTP for password reset
    const otpCode = helper.generateOTP();
    user.otpCode = otpCode;
    user.isPasswordForget = true;
    await this.userRepository.save(user);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, otpCode);

    return {
      status: HttpStatus.OK,
      message: 'Password reset OTP sent successfully to your email address.',
    };
  }

  /**
   * Reset password using email + OTP
   * @param body - Reset password payload
   */
  async resetPassword(body: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: body.email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.isPasswordForget) {
      throw new HttpException(
        'Password reset request not found or already used',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.otpCode || user.otpCode !== body.otpCode) {
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    // Update password
    user.password = await helper.hashPassword(body.password);
    user.isPasswordForget = false;
    user.otpCode = null;
    await this.userRepository.save(user);

    return {
      status: HttpStatus.OK,
      message: 'Password has been reset successfully. You can now log in.',
    };
  }

  /**
   * Verify email with OTP
   * @param email - User email
   * @param otpCode - OTP code
   * @returns Success message
   */
  async verifyEmail(email: string, otpCode: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new HttpException('Email already verified', HttpStatus.BAD_REQUEST);
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    // Verify email
    user.isEmailVerified = true;
    user.otpCode = null;
    await this.userRepository.save(user);

    return {
      status: HttpStatus.OK,
      message: 'Email verified successfully',
    };
  }

  /**
   * Resend verification OTP
   * @param email - User email
   * @returns Success message
   */
  async resendVerificationOTP(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new HttpException('Email already verified', HttpStatus.BAD_REQUEST);
    }

    // Generate new OTP
    const otpCode = helper.generateOTP();
    user.otpCode = otpCode;
    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.sendVerificationEmail(user.email, otpCode);

    return {
      status: HttpStatus.OK,
      message: 'Verification OTP sent successfully',
    };
  }

  public async createAccessToken(payload: JwtPayload): Promise<unknown> {
    const result = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
    });

    return result;
  }
}
