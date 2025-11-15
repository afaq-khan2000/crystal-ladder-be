import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Child } from '@/entities/child.entity';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';
import { Helper } from '@/utils';
import { User } from '@/entities/user.entity';
import { Role } from '@/common/enums/roles.enum';

@Injectable()
export class ChildrenService {
  constructor(
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new child record
   * @param createChildDto - Child data
   * @param parentId - Parent user ID
   * @returns Created child
   */
  async create(createChildDto: CreateChildDto, parentId: number): Promise<Child> {
    // Verify parent exists
    const parent = await this.userRepository.findOne({
      where: { id: parentId, role: Role.Parent },
    });

    if (!parent) {
      throw new HttpException('Parent not found', HttpStatus.NOT_FOUND);
    }

    // If therapist is assigned, verify user exists (can be any user)
    if (createChildDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: createChildDto.therapistId },
      });

      if (!therapist) {
        throw new HttpException('Therapist not found', HttpStatus.NOT_FOUND);
      }
    }

    const child = this.childRepository.create({
      ...createChildDto,
      parentId,
    });

    return await this.childRepository.save(child);
  }

  /**
   * Find all children for a parent
   * @param parentId - Parent user ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated list of children
   */
  async findAllByParent(
    parentId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const [children, total] = await this.childRepository.findAndCount({
      where: { parentId },
      relations: ['parent', 'therapist'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Helper.paginateResponse({ data: [children, total], page, limit });
  }

  /**
   * Find all children (admin only)
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated list of children
   */
  async findAll(page: number = 1, limit: number = 10) {
    const [children, total] = await this.childRepository.findAndCount({
      relations: ['parent', 'therapist'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Helper.paginateResponse({ data: [children, total], page, limit });
  }


  /**
   * Find one child by ID
   * @param id - Child ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Child record
   */
  async findOne(id: number, userId?: number, userRole?: Role): Promise<Child> {
    const child = await this.childRepository.findOne({
      where: { id },
      relations: ['parent', 'therapist'],
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Check authorization: parent can only see their own children
    if (userRole === Role.Parent && child.parentId !== userId) {
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }

    // Admins can access all children

    return child;
  }

  /**
   * Update child record
   * @param id - Child ID
   * @param updateChildDto - Updated child data
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Updated child
   */
  async update(
    id: number,
    updateChildDto: UpdateChildDto,
    userId?: number,
    userRole?: Role,
  ): Promise<Child> {
    // If userId/userRole are not provided, skip authorization check (admin case)
    const child = userId && userRole
      ? await this.findOne(id, userId, userRole)
      : await this.childRepository.findOne({
          where: { id },
          relations: ['parent', 'therapist'],
        });
    
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Verify therapist if being assigned (can be any user)
    if (updateChildDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: updateChildDto.therapistId },
      });

      if (!therapist) {
        throw new HttpException('Therapist not found', HttpStatus.NOT_FOUND);
      }
    }

    Object.assign(child, updateChildDto);
    return await this.childRepository.save(child);
  }

  /**
   * Remove child record (soft delete)
   * @param id - Child ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   */
  async remove(id: number, userId?: number, userRole?: Role): Promise<void> {
    // If userId/userRole are not provided, skip authorization check (admin case)
    const child = userId && userRole
      ? await this.findOne(id, userId, userRole)
      : await this.childRepository.findOne({
          where: { id },
          relations: ['parent', 'therapist'],
        });
    
    if (!child) {
      throw new NotFoundException('Child not found');
    }
    
    await this.childRepository.softRemove(child);
  }
}

