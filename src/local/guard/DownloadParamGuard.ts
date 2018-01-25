
import { Guard, CanActivate, ExecutionContext ,HttpException} from '@nestjs/common';
import { MissingParameterException } from '../exception/MissingParameterException';
import { Observable } from 'rxjs/Observable';

@Guard()
export class DownloadParamGuard implements CanActivate {
    canActivate(req, context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        let { bucket_name , fileName } = req.params 
        if(!bucket_name||!fileName){
            throw new MissingParameterException()
        }
        return true
    }
}