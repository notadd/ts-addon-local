
import { ExceptionFilter, Catch } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { MissingParameterException } from './MissingParameterException'

@Catch(HttpException,MissingParameterException)
export class LocalExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, response) {
    let status = exception.getStatus()
    let message = exception.getResponse()
    response
      .status(status)
      .json({
        statusCode: status,
        message: message
      });
  }
}