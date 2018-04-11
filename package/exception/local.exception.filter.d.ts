import { ExceptionFilter, HttpException } from "@nestjs/common";
export declare class LocalExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, response: any): void;
}
