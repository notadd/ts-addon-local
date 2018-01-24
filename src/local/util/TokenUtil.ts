import { Component} from '@nestjs/common';
import * as crypto from 'crypto'
import { Bucket } from '../model/Bucket'

@Component()
export class TokenUtil{

    constructor(){}

    getToken(url:string,bucket:Bucket):string{
        if(bucket.public_or_private==='public'){
            throw new Error('公有空间不需要token')
        }
        //获取超时GMT时间戳，单位为秒
        let expire:number = (+new Date())/1000+bucket.token_expire
        //拼接要签名的字符串
        let str = url+expire+bucket.token_secret_key
        let md5 = crypto.createHash('md5').update(str).digest('hex')
        return md5+expire
    }

}