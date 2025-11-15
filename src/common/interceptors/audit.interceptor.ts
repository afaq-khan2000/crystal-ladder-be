import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '@/entities/audit-log.entity';
import { User } from '@/entities/user.entity';
import { Request } from 'express';

/**
 * Audit Interceptor
 * Automatically logs admin actions for audit trail
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const { method, url, user, body, params, query } = request;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Determine action based on HTTP method
    let action: AuditAction;
    switch (method) {
      case 'POST':
        action = AuditAction.Create;
        break;
      case 'PATCH':
      case 'PUT':
        action = AuditAction.Update;
        break;
      case 'DELETE':
        action = AuditAction.Delete;
        break;
      case 'GET':
        action = AuditAction.View;
        break;
      default:
        action = AuditAction.View;
    }

    // Extract entity name from URL
    const entityName = url.split('/')[1]?.replace(/s$/, '') || 'unknown';

    return next.handle().pipe(
      tap(async () => {
        // Only log if user is authenticated and is admin
        if (user && user.role === 'admin') {
          try {
            const auditLog = this.auditLogRepository.create({
              action,
              entity: entityName,
              entityId: params?.id ? parseInt(params.id) : undefined,
              description: `${method} ${url}`,
              changes: {
                body: body || {},
                params: params || {},
                query: query || {},
              },
              userId: user.id,
              ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
              userAgent,
            });
            await this.auditLogRepository.save(auditLog);
          } catch (error) {
            // Don't fail the request if audit logging fails
            console.error('Audit logging failed:', error);
          }
        }
      }),
    );
  }
}

