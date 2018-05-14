import { Injectable, UseGuards, UseFilters, HttpException, Inject, UseInterceptors } from "@nestjs/common";
import { EnableImageWatermark } from "../interface/config/enable.image.watermark";
import { ExceptionInterceptor } from "../interceptor/exception.interceptor";
import { LocalExceptionFilter } from "../exception/local.exception.filter";
import { ImageWatermark } from "../interface/config/image.watermark";
import { BucketConfig } from "../interface/config/bucket.config";
import { BucketsData } from "../interface/config/buckets.data";
import { ImageFormat } from "../interface/config/image.format";
import { AudioFormat } from "../interface/config/audio.format";
import { VideoFormat } from "../interface/config/video.format";
import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { UploadFile } from "../interface/file/upload.file";
import { ConfigService } from "../service/config.service";
import { InjectRepository } from "@nestjs/typeorm";
import { CommonData } from "../interface/common";
import { Bucket } from "../model/bucket.entity";
import { KindUtil } from "../util/kind.util";
import { FileUtil } from "../util/file.util";
import { Repository } from "typeorm";
import { Request } from "express";
import * as path from "path";

/* 本地存储配置的resolver */
@Resolver("Config")
@UseInterceptors(ExceptionInterceptor)
export class ConfigResolver {

    // 图片水印方位的集合，九宫格
    private readonly gravity: Set<string>;

    private readonly _imageFormat: Set<string>;

    private readonly _audioFormat: Set<string>;

    private readonly _videoFormat: Set<string>;

    private readonly _videoResolution: Set<string>;

    constructor(
        @Inject(FileUtil) private readonly fileUtil: FileUtil,
        @Inject(KindUtil) private readonly kindUtil: KindUtil,
        @Inject(ConfigService) private readonly configService: ConfigService,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>
    ) {
        this._imageFormat = new Set(["raw", "webp_damage", "webp_undamage"]);
        this._audioFormat = new Set(["raw", "mp3", "aac"]);
        this._videoFormat = new Set(["raw", "vp9", "h264", "h265"]);
        this._videoResolution = new Set(["raw", "p1080", "p720", "p480"]);
        this.gravity = new Set(["northwest", "north", "northeast", "west", "center", "east", "southwest", "south", "southeast"]);
    }

    /* 空间配置的resolver，与云存储不同，只配置空间名即可，空间名即是store目录下的空间目录名，私有空间要配置token超时与密钥 */
    @Mutation("bucket")
    async bucket(req: Request, body: BucketConfig): Promise<CommonData> {
        const { isPublic, name, tokenExpire, tokenSecretKey } = body;
        // 验证参数存在
        if (isPublic === undefined || isPublic === null || !name) {
            throw new HttpException("缺少参数", 400);
        }
        // 验证参数正确与否
        if (isPublic !== true && isPublic !== false) {
            throw new HttpException("isPublic参数不正确", 400);
        }
        if (!isPublic) {
            if (!tokenExpire || !tokenSecretKey) {
                throw new HttpException("缺少参数", 400);
            } else if (tokenExpire < 0 || tokenExpire > 1800) {
                throw new HttpException("token超时不正确", 400);
            }
        }
        // 进行保存,如果存在就更新
        await this.configService.saveBucketConfig(body);
        return { code: 200, message: "空间配置保存成功" };
    }

    /* 图片保存格式配置*/
    @Mutation("imageFormat")
    async imageFormat(req: Request, body: ImageFormat): Promise<CommonData> {
        const format: string = body.format;
        // 验证参数
        if (format === undefined || format.length === 0) {
            throw new HttpException("缺少参数", 400);
        }
        if (!this._imageFormat.has(format)) {
            throw new HttpException("保存格式不正确", 400);
        }
        // 保存格式
        await this.configService.saveImageFormat(body);
        return { code: 200, message: "图片保存格式配置保存成功" };
    }

    /* 图片水印启用配置 */
    @Mutation("enableImageWatermark")
    async enableImageWatermark(req: Request, body: EnableImageWatermark): Promise<CommonData> {
        // 验证参数
        const enable: boolean = body.enable;
        // 验证参数存在
        if (enable === null || enable === undefined) {
            throw new HttpException("缺少参数", 400);
        }
        // 验证参数正确
        if (enable !== true && enable !== false) {
            throw new HttpException("参数enable错误", 400);
        }
        // 保存配置
        await this.configService.saveEnableImageWatermark(body);
        return { code: 200, message: "图片水印启用配置保存成功" };
    }

    /* 图片水印配置,其中水印图片以base64编码传输 */
    @Mutation("imageWatermark")
    async imageWatermark(req: Request, body: ImageWatermark): Promise<CommonData> {
        // 水印图片临时保存路径
        let tempPath = "";
        try {
            const { name, gravity, opacity, x, y, ws } = body;
            // 验证参数存在，其中数字为0也可以
            if (!name || !body.base64 || !gravity || (opacity !== 0 && !opacity) || (x !== 0 && !x) || (y !== 0 && !y) || (ws !== 0 && !ws)) {
                throw new HttpException("缺少参数", 400);
            }
            // 验证参数正确
            if (!this.gravity.has(gravity)) {
                throw new HttpException("不允许的水印图片位置", 400);
            }
            if (!Number.isInteger(x)) {
                throw new HttpException("x偏移不是整数", 400);
            }
            if (!Number.isInteger(y)) {
                throw new HttpException("y偏移不是整数", 400);
            }
            if (!Number.isInteger(opacity)) {
                throw new HttpException("透明度不是整数", 400);
            } else if (opacity <= 0) {
                throw new HttpException("透明度小于0", 400);
            } else if (opacity > 100) {
                throw new HttpException("透明度大于100", 400);
            } else {

            }
            if (!Number.isInteger(ws)) {
                throw new HttpException("短边自适应比例不是整数", 400);
            } else if (ws <= 0) {
                throw new HttpException("短边自适应比例不大于0", 400);
            } else {
                // 暂定短边自适应比例可以大于100
            }
            // 保存图片的base64编码为文件，保存目录为临时目录下
            tempPath = path.resolve(process.cwd(), "storages", "local", "temp", name);
            await this.fileUtil.write(tempPath, Buffer.from(body.base64, "base64"));
            // 删除base64字符串，太大了
            delete body.base64;
            // 上传文件对象，存储了上传文件名、临时保存路径
            const file: UploadFile = {
                name,
                path: tempPath
            };
            if (!this.kindUtil.isImage(file.name.substr(file.name.lastIndexOf(".") + 1))) {
                throw new HttpException("不允许的水印图片类型", 400);
            }
            // 保存后台水印配置
            await this.configService.saveImageWatermark(file, body);
        } catch (err) {
            throw err;
        } finally {
            // 删除保存的临时水印图片，这里有可能没有到保存水印图片这一步就异常了
            // resolver级别生成的临时水印图片，也应该在这个级别删除，不应该留到Service中
            if (tempPath) {
                await this.fileUtil.deleteIfExist(tempPath);
            }
        }
        return { code: 200, message: "图片水印配置成功" };
    }

    /* 音频保存格式配置*/
    @Mutation("audioFormat")
    async audioFormat(req: Request, body: AudioFormat): Promise<CommonData> {
        const format: string = body.format;
        if (!format) {
            throw new HttpException("缺少参数", 400);
        }
        if (format !== "raw" && format !== "mp3" && format !== "aac") {
            throw new HttpException("音频保存格式不正确", 400);
        }
        // 保存格式到数据库
        await this.configService.saveAudioFormat(body);
        return { code: 200, message: "音频保存格式配置保存成功" };
    }

    /* 视频保存配置*/
    @Mutation("videoFormat")
    async videoFormat(req: Request, body: VideoFormat): Promise<CommonData> {
        // 视频编码、分辨率
        const { format, resolution } = body;
        if (!format || !resolution) {
            throw new HttpException("缺少参数", 400);
        }
        if (format !== "raw" && format !== "vp9" && format !== "h264" && format !== "h265") {
            throw new HttpException("编码格式不正确", 400);
        }
        if (resolution !== "raw" && resolution !== "p1080" && resolution !== "p720" && resolution !== "p480") {
            throw new HttpException("分辨率格式不正确", 400);
        }
        // 保存格式到数据库
        await this.configService.saveVideoFormat(body);
        return { code: 200, message: "视频保存格式配置保存成功" };
    }

    /* 获取所有空间信息字段 */
    @Query("buckets")
    async buckets(req: Request): Promise<BucketsData> {
        // 查询出所有空间的三个字段，其他字段保密
        const buckets: Array<Bucket> = await this.bucketRepository.createQueryBuilder("bucket")
            .select(["bucket.id", "bucket.publicOrPrivate", "bucket.name"])
            .getMany();
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        return { code: 200, message: "获取空间配置成功", buckets };
    }
}
