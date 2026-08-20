import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { ContextRequest } from './request-context.interceptor';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<ContextRequest>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = exception instanceof HttpException ? exception.getResponse() : null;
    const messages =
      typeof detail === 'object' && detail && 'message' in detail
        ? (detail as { message: string | string[] }).message
        : typeof detail === 'string'
          ? detail
          : status === 500
            ? '服务暂时不可用'
            : '请求失败';

    response.status(status).json({
      statusCode: status,
      code: HttpStatus[status] ?? 'ERROR',
      message: messages,
      requestId: request.requestId,
      path: request.path,
      timestamp: new Date().toISOString(),
    });
  }
}
