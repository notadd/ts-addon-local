import { Resolver, Query, Mutation } from '@nestjs/graphql'
import { ConfigService } from '../../service/ConfigService'
import { BucketConfig } from '../../interface/config/BucketConfig'


/* 本地存储配置的resolver */
@Resolver('Config')
export class ConfigResolver {

    private readonly image_format: Set<String>
    private readonly audio_format: Set<String> 
    private readonly video_format: Set<String>
    private readonly video_resolution: Set<String>

    constructor(
        private readonly configService: ConfigService
    ) {
        this.image_format = new Set(['raw','webp_damage','webp_undamage'])
        this.audio_format = new Set(['raw','mp3','aac'])
        this.video_format = new Set(['raw', 'vp9', 'h264','h265'])
        this.video_resolution = new Set(['raw', 'p1080', 'p720','p480'])
    }

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
        if (!this.image_format.has(format)){
            data.code = 400
            data.message = 'format参数不正确'
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