import { Guard, CanActivate, ExecutionContext ,HttpException} from '@nestjs/common';
import { Observable } from 'rxjs/Observable';
import { parse } from 'graphql'
@Guard()
export class BucketGuard implements CanActivate {
    canActivate(req,context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        //解析字符串获取一颗节点树，很难获取请求参数
       console.log(parse(req.body.query))
        return true
    }
}