import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '@home-owners-hub/shared-types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const responseMessage = (exceptionResponse as { message?: string | string[] }).message;
      message = Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : responseMessage ?? HttpStatus[status];
    }

    const body: ApiErrorResponse = { success: false, message };
    response.status(status).json(body);
  }
}
