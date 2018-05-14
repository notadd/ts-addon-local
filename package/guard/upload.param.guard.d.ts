import { CanActivate } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context.host";
export declare class UploadParamGuard implements CanActivate {
    canActivate(context: ExecutionContextHost): Promise<boolean>;
}
