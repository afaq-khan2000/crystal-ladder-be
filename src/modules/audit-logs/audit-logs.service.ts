import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '@/entities/audit-log.entity';
import { Helper } from '@/utils';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create a new audit log entry
   * @param auditData - Audit log data
   * @returns Created audit log
   */
  async create(auditData: {
    action: AuditAction;
    entity: string;
    entityId?: number;
    description?: string;
    changes?: Record<string, unknown>;
    userId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(auditData);
    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * Find all audit logs (paginated)
   * @param page - Page number
   * @param limit - Items per page
   * @param userId - Filter by user ID
   * @param action - Filter by action
   * @param entity - Filter by entity
   * @returns Paginated list of audit logs
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    userId?: number,
    action?: AuditAction,
    entity?: string,
  ) {
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    const [auditLogs, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Helper.paginateResponse({ data: [auditLogs, total], page, limit });
  }

  /**
   * Find one audit log by ID
   * @param id - Audit log ID
   * @returns Audit log record
   */
  async findOne(id: number): Promise<AuditLog> {
    return await this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }
}

