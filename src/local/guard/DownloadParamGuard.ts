
import { Guard, CanActivate, ExecutionContext ,HttpException} from '@nestjs/common';
import { MissingParameterException } from '../exception/MissingParameterException';
import { Observable } from 'rxjs/Observable';

@Guard()
export class DownloadParamGuard implements CanActivate {
    canActivate(req, context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        let { bucket_name , fileName } = req.headers 
        if(!bucket_name){
            throw new MissingParameterException('bucket_name')
        }
        if(!fileName){
            throw new MissingParameterException('fileName')
        }
        return true
    }
}