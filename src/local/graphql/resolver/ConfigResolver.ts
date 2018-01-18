import { Resolver , Query , Mutation } from '@nestjs/graphql'
import { ConfigService } from '../../service/ConfigService'

/* 本地存储配置的resolver */
@Resolver('Config')
export class ConfigResolver{

    constructor(
        private readonly configService:ConfigService
    ){}

    /* 空间配置的resolver，与云存储不同，只配置空间目录即可，私有空间要配置token超时与密钥 */
    @Mutation('bucket')
    async bucket(req , body ):Promise<any>{
        let data = {
            code : 200,
            message:''
        }
        let {isPublic,directory,token_expire,token_secret_key} = body
        //验证参数
        if(isPublic===undefined||!directory){
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        if(isPublic!==true&&isPublic!==false){
            data.code = 400
            data.message = 'isPublic参数不正确'
            return data
        }
        if(!isPublic&&(!token_expire||!token_secret_key)){
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //进行保存
        await  this.configService.saveBucketConfig(data,body)
        return data
    }
}