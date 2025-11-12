import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Role } from '@/common/enums/roles.enum';

export class UpdateUserDto {
  @ApiProperty({
    description: 'First name',
    required: false,
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    required: false,
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Email address',
    required: false,
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Phone number',
    required: false,
    example: '(555) 123-4567',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Address',
    required: false,
    example: '123 Main St, City, State 12345',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Is email verified',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiProperty({
    description: 'Is profile complete',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isProfileComplete?: boolean;

  @ApiProperty({
    description: 'Is approved',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    required: false,
    example: Role.Parent,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}

