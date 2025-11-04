import { isArray } from 'class-validator';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs';

export interface Response<T> {
  data: T;
}
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler) {
    const call$ = next.handle();
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    return call$.pipe(
      map((data) => {
        return {
          statusCode: data?.status || response.statusCode,
          message: data?.message
            ? data?.message
            : request.method === 'POST'
              ? 'Record saved successfully. ✅'
              : request.method === 'PATCH' || request.method === 'PUT'
                ? 'Record updated successfully. ✅'
                : request.method === 'DELETE'
                  ? 'Record deleted successfully. 🗑️'
                  : 'Operation successful. ✔️',
          data: isArray(data?.data) ? data?.data : data?.data || data || null,
          metadata: data?.metaInfo,
        };
      }),
    );
  }
}
