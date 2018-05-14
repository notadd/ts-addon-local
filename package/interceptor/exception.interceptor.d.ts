import { NestInterceptor } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context.host";
import { Observable } from "rxjs";
import "rxjs/add/operator/catch";
export declare class ExceptionInterceptor implements NestInterceptor {
    intercept(context: ExecutionContextHost, stream$: Observable<any>): Observable<any>;
}
