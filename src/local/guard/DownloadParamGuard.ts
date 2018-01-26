import { Guard, CanActivate, ExecutionContext ,HttpException} from '@nestjs/common';
import { Observable } from 'rxjs/Observable';

@Guard()
export class DownloadParamGuard implements CanActivate {
    canActivate(req, context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        let { bucket_name , file_name } = req.headers 
        if(!bucket_name){
            throw new HttpException('缺少参数bucket_name',400)
        }
        if(!file_name){
            throw new HttpException('缺少参数file_name',400)
        }
        return true
    }
}