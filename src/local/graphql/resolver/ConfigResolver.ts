import { EnableImageWatermark } from '../../interface/config/EnableImageWatermark';
import { ImageWatermark } from '../../interface/config/ImageWatermark';
import { BucketConfig } from '../../interface/config/BucketConfig';
import { ImageFormat } from '../../interface/config/ImageFormat';
import { AudioFormat } from '../../interface/config/AudioFormat';
import { VideoFormat } from '../../interface/config/VideoFormat';
import { Resolver, Query, Mutation } from '@nestjs/graphql';
import { ConfigService } from '../../service/ConfigService';
import { UploadFile } from '../../interface/file/UploadFile'
import { CommonData } from '../../interface/Common';
import { InjectRepository } from '@nestjs/typeorm';
import { KindUtil } from '../../util/KindUtil';
import { Bucket } from '../../model/Bucket';
import { Component } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as fs from 'fs';


/* 本地存储配置的resolver */
@Resolver('Config')
export class ConfigResolver {

    //图片水印方位的集合，九宫格
    private readonly gravity: Set<string>

    constructor(
        private readonly kindUtil: KindUtil,
        private readonly configService: ConfigService,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>
    ) {
        this.gravity = new Set(['northwest', 'north', 'northeast', 'west', 'center', 'east', 'southwest', 'south', 'southeast'])
    }

    /* 空间配置的resolver，与云存储不同，只配置空间名即可，空间名即是store目录下的空间目录名，私有空间要配置token超时与密钥 */
    @Mutation('bucket')
    async bucket(req: any, body: BucketConfig): Promise<CommonData> {
        let data: CommonData = {
            code: 200,
            message: '空间配置保存成功'
        }
        let { isPublic, name, token_expire, token_secret_key } = body
        //验证参数存在
        if (isPublic === undefined || !name) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //验证参数正确与否
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
    async  imageFormat(req: any, body: ImageFormat): Promise<CommonData> {
        let data: CommonData = {
            code: 200,
            message: "图片保存格式配置保存成功"
        }
        let format: string = body.format
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

    /* 图片水印启用配置 */
    @Mutation('enableImageWatermark')
    async  enableImageWatermark(req: any, body: EnableImageWatermark): Promise<CommonData> {
        let data: CommonData = {
            code: 200,
            message: '图片水印启用配置保存成功'
        }
        //验证参数
        let enable: boolean = body.enable
        //验证参数存在
        if (enable === null || enable === undefined) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //验证参数正确
        if (enable !== true && enable !== false) {
            data.code = 400
            data.message = '参数错误'
            return data
        }
        //保存配置
        await this.configService.saveEnableImageWatermark(data, body)
        //保存启用水印到数据库失败，无法模仿这个错误
        if (data.code === 401 || data.code === 402) {
            return data
        }
        return data
    }

    /* 图片水印配置,其中水印图片以base64编码传输 */
    @Mutation('imageWatermark')
    async  imageWatermark(req: any, body: ImageWatermark): Promise<CommonData> {
        let data: CommonData = {
            code: 200,
            message: ''
        }
        let { name, base64, gravity, opacity, x, y, ws } = body
        //验证参数存在，其中数字为0也可以
        if (!name || !base64 || !gravity || (opacity !== 0 && !opacity) || (x !== 0 && !x) || (y !== 0 && !y) || (ws !== 0 && !ws)) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //验证参数正确
        if (!this.gravity.has(gravity)) {
            data.code = 400
            data.message = '不允许的水印图片位置'
            return data
        }
        if (!Number.isInteger(x)) {
            data.code = 400
            data.message = 'x偏移不是整数'
            return data
        }
        if (!Number.isInteger(y)) {
            data.code = 400
            data.message = 'y偏移不是整数'
            return data
        }
        if (!Number.isInteger(opacity)) {
            data.code = 400
            data.message = '透明度不是整数'
            return data
        } else if (opacity <= 0) {
            data.code = 400
            data.message = '透明度不大于0'
            return data
        } else if (opacity > 100) {
            data.code = 400
            data.message = '透明度大于100'
            return data
        } else {

        }
        if (!Number.isInteger(ws)) {
            data.code = 400
            data.message = '短边自适应比例不是整数'
            return data
        } else if (ws <= 0) {
            data.code = 400
            data.message = '短边自适应比例不大于0'
            return data
        } else {
            //暂定短边自适应比例可以大于100
        }
        //保存图片的base64编码为文件，保存目录为当前目录下
        await new Promise((resolve, reject) => {
            fs.writeFile(__dirname + '/' + name, Buffer.from(base64, 'base64'), (err) => {
                if (err) {
                    data.code = 402
                    data.message = '文件写入错误'
                }
                resolve()
            })
        })
        //删除base64字符串，太大了
        delete body.base64
        if (data.code !== 200) {
            return data
        }
        //上传文件对象，存储了上传文件名、临时保存路径
        let file: UploadFile
        file.name = name
        file.path = __dirname + '/' + name
        if (!this.kindUtil.isImage(file.name.substr(file.name.lastIndexOf('.') + 1))) {
            data.code = 400
            data.message = '不允许的水印图片类型'
            return data
        }
        //保存后台水印配置
        await this.configService.saveImageWatermark(data, file, body)
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
    async videoFormat(req: any, body: VideoFormat): Promise<any> {
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
    async buckets() {
        let data = {
            code: 200,
            message: '',
            buckets: []
        }
        let buckets: Bucket[] = await this.bucketRepository.createQueryBuilder('bucket')
            .select(['bucket.id', 'bucket.public_or_private', 'bucket.name'])
            .getMany()
        if (buckets.length !== 2) {
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