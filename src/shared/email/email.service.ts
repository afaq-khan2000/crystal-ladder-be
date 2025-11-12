import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    this.fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL') || smtpUser;

    if (!smtpUser || !smtpPassword) {
      this.logger.warn('SMTP credentials not configured. Email functionality will be limited.');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('SMTP connection failed:', error);
    }
  }

  /**
   * Send email with HTML content
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param html - HTML content
   * @param text - Plain text content (optional)
   * @returns Promise with message info
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Crystal Ladder" <${this.fromEmail}>`,
        to,
        subject,
        text: text || this.stripHtml(html),
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send email verification OTP
   * @param to - Recipient email address
   * @param otpCode - OTP code
   * @returns Promise with message info
   */
  async sendVerificationEmail(to: string, otpCode: string): Promise<nodemailer.SentMessageInfo> {
    const subject = 'Verify Your Email Address';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Crystal Ladder</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p>Thank you for registering with Crystal Ladder. Please verify your email address by entering the following OTP code:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">Best regards,<br>The Crystal Ladder Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send password reset OTP
   * @param to - Recipient email address
   * @param otpCode - OTP code
   * @returns Promise with message info
   */
  async sendPasswordResetEmail(to: string, otpCode: string): Promise<nodemailer.SentMessageInfo> {
    const subject = 'Password Reset Request';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Crystal Ladder</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset</h2>
            <p>We received a request to reset your password. Use the following OTP code to proceed:</p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email.</p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">Best regards,<br>The Crystal Ladder Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send appointment confirmation email
   * @param to - Recipient email address
   * @param appointmentDetails - Appointment details
   * @returns Promise with message info
   */
  async sendAppointmentConfirmation(
    to: string,
    appointmentDetails: {
      serviceName: string;
      appointmentDate: Date;
      childName?: string;
      notes?: string;
    },
  ): Promise<nodemailer.SentMessageInfo> {
    const subject = 'Appointment Confirmation - Crystal Ladder';
    const formattedDate = new Date(appointmentDetails.appointmentDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Crystal Ladder</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Appointment Confirmed</h2>
            <p>Your appointment has been successfully booked. Here are the details:</p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p><strong>Service:</strong> ${appointmentDetails.serviceName}</p>
              ${appointmentDetails.childName ? `<p><strong>Child:</strong> ${appointmentDetails.childName}</p>` : ''}
              <p><strong>Date & Time:</strong> ${formattedDate}</p>
              ${appointmentDetails.notes ? `<p><strong>Notes:</strong> ${appointmentDetails.notes}</p>` : ''}
            </div>
            <p style="color: #666; font-size: 14px;">We'll review your appointment and confirm shortly. You'll receive another email once it's approved.</p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">Best regards,<br>The Crystal Ladder Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send registration required email
   * @param to - Recipient email address
   * @returns Promise with message info
   */
  async sendRegistrationRequiredEmail(to: string): Promise<nodemailer.SentMessageInfo> {
    const subject = 'Registration Required - Crystal Ladder';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Crystal Ladder</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Registration Required</h2>
            <p>Thank you for your interest in booking an appointment with Crystal Ladder.</p>
            <p>To complete your appointment booking, please register an account first using this email address: <strong>${to}</strong></p>
            <p style="color: #666; font-size: 14px;">Once you've registered and verified your email, you can complete your appointment booking.</p>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">Best regards,<br>The Crystal Ladder Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Strip HTML tags from string (for plain text fallback)
   * @param html - HTML string
   * @returns Plain text string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
}
