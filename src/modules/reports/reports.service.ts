import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Report } from '@/entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Helper } from '@/utils';
import { User } from '@/entities/user.entity';
import { Child } from '@/entities/child.entity';
import { Role } from '@/common/enums/roles.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Child)
    private childRepository: Repository<Child>,
  ) {}

  /**
   * Create a new report
   * @param createReportDto - Report data
   * @param adminId - Admin user ID
   * @returns Created report
   */
  async create(
    createReportDto: CreateReportDto,
    adminId: number,
  ): Promise<Report> {
    // Verify admin exists
    const admin = await this.userRepository.findOne({
      where: { id: adminId, role: Role.Admin },
    });

    if (!admin) {
      throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
    }

    // Verify child exists
    const child = await this.childRepository.findOne({
      where: { id: createReportDto.childId },
    });

    if (!child) {
      throw new HttpException('Child not found', HttpStatus.NOT_FOUND);
    }

    const report = this.reportRepository.create({
      ...createReportDto,
      therapistId: adminId, // Using therapistId field but storing admin ID
    });

    return await this.reportRepository.save(report);
  }

  /**
   * Find all reports (paginated)
   * @param page - Page number
   * @param limit - Items per page
   * @param childId - Filter by child ID
   * @param therapistId - Filter by therapist ID
   * @param userId - User ID (for filtering)
   * @param userRole - User role (for filtering)
   * @returns Paginated list of reports
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    childId?: number,
    therapistId?: number,
    userId?: number,
    userRole?: Role,
  ) {
    const where: any = {};

    if (therapistId) {
      where.therapistId = therapistId;
    }

    // Parents can only see reports for their children
    if (userRole === Role.Parent) {
      // Get all children of the parent
      const children = await this.childRepository.find({
        where: { parentId: userId },
      });
      const childIds = children.map((child) => child.id);
      
      if (childId) {
        // If a specific childId is provided, verify it belongs to the parent
        if (!childIds.includes(childId)) {
          // Return empty result if child doesn't belong to parent
          return Helper.paginateResponse({ data: [[], 0], page, limit });
        }
        where.childId = childId;
      } else {
        // Use In operator for multiple child IDs
        if (childIds.length > 0) {
          where.childId = In(childIds);
        } else {
          // No children, return empty result
          return Helper.paginateResponse({ data: [[], 0], page, limit });
        }
      }
    } else if (childId) {
      // For non-parents, use the provided childId
      where.childId = childId;
    }

    // Admins can see all reports (no filter applied)

    const [reports, total] = await this.reportRepository.findAndCount({
      where,
      relations: ['child', 'therapist'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Helper.paginateResponse({ data: [reports, total], page, limit });
  }

  /**
   * Find one report by ID
   * @param id - Report ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Report record
   */
  async findOne(
    id: number,
    userId?: number,
    userRole?: Role,
  ): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['child', 'therapist'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Check authorization
    if (userRole === Role.Parent) {
      const child = await this.childRepository.findOne({
        where: { id: report.childId, parentId: userId },
      });

      if (!child) {
        throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
      }
    }

    // Admins can access all reports

    return report;
  }

  /**
   * Update report record
   * @param id - Report ID
   * @param updateReportDto - Updated report data
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   * @returns Updated report
   */
  async update(
    id: number,
    updateReportDto: UpdateReportDto,
    userId?: number,
    userRole?: Role,
  ): Promise<Report> {
    const report = await this.findOne(id, userId, userRole);

    // Only admin can update reports
    if (userRole !== Role.Admin) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    Object.assign(report, updateReportDto);
    return await this.reportRepository.save(report);
  }

  /**
   * Remove report record (soft delete)
   * @param id - Report ID
   * @param userId - User ID (for authorization check)
   * @param userRole - User role (for authorization check)
   */
  async remove(
    id: number,
    userId?: number,
    userRole?: Role,
  ): Promise<void> {
    const report = await this.findOne(id, userId, userRole);

    // Only admin can delete
    if (userRole !== Role.Admin) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }

    await this.reportRepository.softRemove(report);
  }
}

