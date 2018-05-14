import { ExceptionFilter, HttpException, ArgumentsHost } from "@nestjs/common";
export declare class LocalExceptionFilter implements ExceptionFilter<HttpException> {
    catch(exception: any, host: ArgumentsHost): void;
}
