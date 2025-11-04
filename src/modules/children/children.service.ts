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

    // If therapist is assigned, verify therapist exists
    if (createChildDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: createChildDto.therapistId, role: Role.Therapist },
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
   * Find all children (admin/therapist only)
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
   * Find children by therapist
   * @param therapistId - Therapist user ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated list of children
   */
  async findByTherapist(
    therapistId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const [children, total] = await this.childRepository.findAndCount({
      where: { therapistId },
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

    // Therapist can only see their assigned children
    if (userRole === Role.Therapist && child.therapistId !== userId) {
      throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
    }

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
    const child = await this.findOne(id, userId, userRole);

    // Verify therapist if being assigned
    if (updateChildDto.therapistId) {
      const therapist = await this.userRepository.findOne({
        where: { id: updateChildDto.therapistId, role: Role.Therapist },
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
    const child = await this.findOne(id, userId, userRole);
    await this.childRepository.softRemove(child);
  }
}

