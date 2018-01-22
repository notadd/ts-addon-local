import { InjectRepository } from '@nestjs/typeorm'
import { Component } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Resolver, Query, Mutation } from '@nestjs/graphql'
import { ConfigService } from '../../service/ConfigService'
import { Bucket } from '../../model/Bucket'
import { BucketConfig } from '../../interface/config/BucketConfig'
import { ImageFormat } from '../../interface/config/ImageFormat'
import { AudioFormat } from '../../interface/config/AudioFormat'
import { VideoFormat } from '../../interface/config/VideoFormat'
import { ImageWatermark } from '../../interface/config/ImageWatermark'
import { EnableImageWatermark } from '../../interface/config/EnableImageWatermark'
import * as fs from 'fs'
import { KindUtil } from '../../util/KindUtil';

/* 本地存储配置的resolver */
@Resolver('Config')
export class ConfigResolver {

    private readonly gravity: Set<string>

    constructor(
        private readonly kindUtil: KindUtil,
        private readonly configService: ConfigService,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>
    ) {
        this.gravity = new Set(['northwest', 'north', 'northeast', 'west', 'center', 'east', 'southwest', 'south', 'southeast'])
    }

    /* 空间配置的resolver，与云存储不同，只配置空间目录即可，私有空间要配置token超时与密钥 */
    @Mutation('bucket')
    async bucket(req: any, body: BucketConfig): Promise<any> {
        let data = {
            code: 200,
            message: ''
        }
        let { isPublic, name, token_expire, token_secret_key } = body
        //验证参数
        if (isPublic === undefined || !name) {
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
    async  imageFormat(req: any, body: ImageFormat): Promise<any> {
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

    @Mutation('enableImageWatermark')
    async  enableImageWatermark(req: any, body: EnableImageWatermark): Promise<any> {
        let data = {
            code: 200,
            message: ''
        }
        //验证参数
        let { enable } = body
        if (enable === null || enable === undefined) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        if (enable !== true && enable !== false) {
            data.code = 400
            data.message = '参数错误'
            return data
        }
        await this.configService.saveEnableImageWatermark(data, body)
        //保存启用水印到数据库失败，无法模仿这个错误
        if (data.code === 401 || data.code === 402) {
            return data
        }
        return data
    }

    @Mutation('imageWatermark')
    async  imageWatermark(req: any, body: ImageWatermark): Promise<any> {
        let data = {
            code: 200,
            message: ''
        }
        let { name, base64, gravity, opacity, x, y, ws } = body
        //保存图片的base64编码为文件
        await new Promise((resolve, reject) => {
            fs.writeFile(__dirname + '/' + name, Buffer.from(base64, 'base64'), (err) => {
                if (err) {
                    data.code = 402
                    data.message = '文件写入错误'
                }
                resolve()
            })
        })
        if (data.code !== 200) {
            return data
        }
        let obj: any = {}
        let file: any = {}
        obj.x = x
        obj.y = y
        obj.opacity = opacity
        obj.ws = ws
        obj.gravity = gravity
        file.name = name
        file.path = __dirname + '/' + name
        if (!this.gravity.has(obj.gravity)) {
            data.code = 400
            data.message = '不允许的水印图片位置'
            return data
        }
        if (!Number.isInteger(obj.x)) {
            data.code = 400
            data.message = 'x偏移不是整数'
            return data
        }
        if (!Number.isInteger(obj.y)) {
            data.code = 400
            data.message = 'y偏移不是整数'
            return data
        }
        if (!Number.isInteger(obj.opacity)) {
            data.code = 400
            data.message = '透明度不是整数'
            return data
        } else if (obj.opacity <= 0) {
            data.code = 400
            data.message = '透明度不大于0'
            return data
        } else if (obj.opacity > 100) {
            data.code = 400
            data.message = '透明度大于100'
            return data
        } else {

        }
        if (!Number.isInteger(obj.ws)) {
            data.code = 400
            data.message = '短边自适应比例不是整数'
            return data
        } else if (obj.ws <= 0) {
            data.code = 400
            data.message = '短边自适应比例不大于0'
            return data
        } else {
            //暂定短边自适应比例可以大于100
        }
        if (!this.kindUtil.isImage(file.name.substr(file.name.lastIndexOf('.') + 1))) {
            data.code = 400
            data.message = '不允许的水印图片类型'
            return data
        }
        //保存后台水印配置
        await this.configService.saveImageWatermark(data, file, obj)

        if (data.code !== 200) {
            return data
        }
        return data
    }

    /* 音频保存格式配置，目前公有空间、私有空间采用一个保存格式，会在两个配置信息中各保存一次 */
    @Mutation('audioFormat')
    async  audioFormat(req, body: AudioFormat): Promise<any> {
        let data = {
            code: 200,
            message: ""
        }
        let format = body.format
        if (!format) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //保存公有空间格式
        await this.configService.saveAudioFormat(data, body)
        //格式参数不正确、配置不存在、保存失败
        if (data.code == 401 || data.code == 402 || data.code == 403) {
            return data
        }
        return data
    }

    /* 视频保存配置，目前公有空间、私有空间采用一个保存格式，会在两个配置信息中各保存一次 */
    @Mutation('videoFormat')
    async videoFormat(req:any, body:VideoFormat): Promise<any> {
        let data = {
            code: 200,
            message: ""
        }
        let { format, resolution } = body
        if (!format || !resolution) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //保存公有空间格式
        await this.configService.saveVideoFormat(data, body)
        //格式参数不正确、配置不存在、保存失败
        if (data.code == 401 || data.code == 402 || data.code == 403) {
            return data
        }
        return data
    }

    /* 获取所有空间信息字段 */
    @Query('buckets')
    async buckets(){
      let data = {
        code:200,
        message:'',
        buckets:[]
      }
      let buckets:Bucket[] = await this.bucketRepository.createQueryBuilder('bucket')
                                                         .select(['bucket.id','bucket.public_or_private','bucket.name'])
                                                         .getMany()
      console.log(await this.bucketRepository.find({ relations: ["audio_config",'image_config','video_config'] }))

      if(buckets.length!==2){
        data.code = 401
        data.message = '空间配置不存在'
        return data
      }
      data.code = 200
      data.message = '获取空间配置成功'
      data.buckets = buckets
      return data
    }
}