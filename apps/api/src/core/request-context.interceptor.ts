import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable, tap } from 'rxjs';
import { PrismaService } from './prisma.service';

export type ContextRequest = Request & {
  requestId?: string;
  user?: { id: string; role: string };
};

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestContextInterceptor.name);
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ContextRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId =
      (typeof request.headers['x-request-id'] === 'string' && request.headers['x-request-id']) ||
      randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    return next.handle().pipe(
      tap(() => {
        if (!['POST', 'PATCH', 'DELETE'].includes(request.method) || !request.user?.id) return;
        void this.prisma.auditLog
          .create({
            data: {
              userId: request.user.id,
              action: request.method,
              resource: request.route?.path ?? request.path,
              resourceId: typeof request.params.id === 'string' ? request.params.id : undefined,
              requestId,
              metadata: { path: request.path },
            },
          })
          .catch((error: unknown) => this.logger.warn(`审计日志写入失败: ${String(error)}`));
      }),
    );
  }
}
