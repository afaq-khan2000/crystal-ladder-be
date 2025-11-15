import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Repository } from 'typeorm';
import { NOT_FOUND_RESPONSE } from '@/common/constants/http-responses.types';
import { RegisterUserDto } from '../auth/dto/registration.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Helper } from '@/utils';
import { Role } from '@/common/enums/roles.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async register(body: RegisterUserDto) {
    const { email } = body;
    const user = await this.userRepo.findOneBy({ email });

    if (user) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }
    return Object.defineProperty(
      await this.userRepo.save(this.userRepo.create(body)),
      'password',
      { enumerable: false },
    );
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: Role,
    isApproved?: boolean,
    isEmailVerified?: boolean,
  ): Promise<unknown> {
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    }

    if (isEmailVerified !== undefined) {
      where.isEmailVerified = isEmailVerified;
    }

    const [users, total] = await this.userRepo.findAndCount({
      where,
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'isEmailVerified',
        'isApproved',
        'isProfileComplete',
        'createdAt',
        'updatedAt',
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Helper.paginateResponse({ data: [users, total], page, limit });
  }

  /**
   * Find one user by ID
   * @param id - User ID
   * @returns User record
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user record
   * @param id - User ID
   * @param updateUserDto - Updated user data
   * @returns Updated user
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepo.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepo.save(user);
  }

  /**
   * Approve a user (Admin only)
   * @param id - User ID
   * @returns Updated user
   */
  async approveUser(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isApproved = true;
    return await this.userRepo.save(user);
  }

  /**
   * Reject/Unapprove a user (Admin only)
   * @param id - User ID
   * @returns Updated user
   */
  async unapproveUser(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isApproved = false;
    return await this.userRepo.save(user);
  }

  async getByUserByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    });
    return user;
  }

  async softDeleteUser(userId: string) {
    const result = await this.userRepo.softDelete(userId);

    if (!result || !result.affected) {
      throw new HttpException(
        NOT_FOUND_RESPONSE.message,
        NOT_FOUND_RESPONSE.status,
      );
    }
    return;
  }
}
