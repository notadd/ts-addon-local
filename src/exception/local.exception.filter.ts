import { ExceptionFilter, Catch, HttpException } from "@nestjs/common";

/*错误码表

*/
@Catch(HttpException)
export class LocalExceptionFilter implements ExceptionFilter {

    catch(exception: HttpException, response) {
        const status = exception.getStatus();
        const message = exception.getResponse();
        response
            .status(status)
            .json({
                code: status,
                message
            });
    }
}
