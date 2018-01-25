
import { Guard, CanActivate, ExecutionContext ,HttpException} from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import { MissingParameterException } from '../exception/MissingParameterException'
@Guard()
export class ParameterGuard implements CanActivate {
    canActivate(dataOrRequest, context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        console.dir(dataOrRequest.query)
        console.dir(dataOrRequest.params)
        console.dir(dataOrRequest.body)
        console.dir(context.parent.name)
        console.log(context.handler.name)
        throw new MissingParameterException()
       
    }
}