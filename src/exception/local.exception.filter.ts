import { ExceptionFilter, Catch, HttpException, ArgumentsHost } from "@nestjs/common";

@Catch(HttpException)
export class LocalExceptionFilter implements ExceptionFilter<HttpException> {

    catch(exception, host: ArgumentsHost) {
        const status = exception.getStatus();
        const message = exception.getResponse();
        const response = host.switchToHttp().getResponse();
        response
            .status(status)
            .json({
                code: status,
                message
            });
    }
}
