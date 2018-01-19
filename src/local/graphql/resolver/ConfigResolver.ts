import { Resolver, Query, Mutation } from '@nestjs/graphql'
import { ConfigService } from '../../service/ConfigService'
import { BucketConfig } from '../../interface/config/BucketConfig'


/* 本地存储配置的resolver */
@Resolver('Config')
export class ConfigResolver {

    

    constructor(
        private readonly configService: ConfigService
    ) {}

    /* 空间配置的resolver，与云存储不同，只配置空间目录即可，私有空间要配置token超时与密钥 */
    @Mutation('bucket')
    async bucket(req: any, body: BucketConfig): Promise<any> {
        let data = {
            code: 200,
            message: ''
        }
        let { isPublic, directory, token_expire, token_secret_key } = body
        //验证参数
        if (isPublic === undefined || !directory) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        if (isPublic !== true && isPublic !== false) {
            data.code = 400
            data.message = 'isPublic参数不正确'
            return data
        }
        if (!isPublic && (!token_expire || !token_secret_key)) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //进行保存,如果存在就更新
        await this.configService.saveBucketConfig(data, body)
        return data
    }

    /* 图片保存格式配置*/
    @Mutation('imageFormat')
    async  imageFormat(req, body): Promise<any> {
        let data = {
            code: 200,
            message: ""
        }
        let format = body.format
        //验证参数
        if (format == undefined || format.length == 0) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //保存格式
        await this.configService.saveImageFormat(data, body)
        //格式参数不正确、配置不存在、保存失败
        if (data.code == 401 || data.code == 402 || data.code == 403) {
            return data
        }
        return data
    }

}