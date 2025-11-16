import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ContactFormDto {
  @ApiProperty({ example: 'Rana Rehman', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @ApiProperty({
    example: 'rana@example.com',
    description: 'Email address of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '03035767675',
    description: 'Phone number of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @ApiProperty({
    example: 'Option 3',
    description: 'What can we help you with? (selected option / subject)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  helpWith?: string;

  @ApiProperty({
    example: 'I would like to know more about your services.',
    description: 'Message content typed by the user',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}


