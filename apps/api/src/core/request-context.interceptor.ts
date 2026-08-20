import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId =
      (typeof request.headers['x-request-id'] === 'string' && request.headers['x-request-id']) ||
      randomUUID();
    response.setHeader('x-request-id', requestId);
    return next.handle();
  }
}
