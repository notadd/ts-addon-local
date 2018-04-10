import { Component, HttpException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as  path from "path";
import { Repository } from "typeorm";
import { AudioFormat } from "../interface/config/audio.format";
import { BucketConfig } from "../interface/config/bucket.config";
import { EnableImageWatermark } from "../interface/config/enable.image.watermark";
import { ImageFormat } from "../interface/config/image.format";
import { VideoFormat } from "../interface/config/video.format";
import { ImageMetadata } from "../interface/file/image.metadata";
import { AudioConfig } from "../model/audio.config.entity";
import { Bucket } from "../model/bucket.entity";
import { Image } from "../model/image.entity";
import { ImageConfig } from "../model/image.config.entity";
import { VideoConfig } from "../model/video.config.entity";
import { FileUtil } from "../util/file.util";
import { ImageProcessUtil } from "../util/image.process.util";

@Component()
export class ConfigService {

    constructor(
        @Inject(FileUtil) private readonly fileUtil: FileUtil,
        @Inject(ImageProcessUtil) private readonly imageProcessUtil: ImageProcessUtil,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>,
        @InjectRepository(ImageConfig) private readonly imageConfigRepository: Repository<ImageConfig>,
        @InjectRepository(AudioConfig) private readonly audioConfigRepository: Repository<AudioConfig>,
        @InjectRepository(VideoConfig) private readonly videoConfigRepository: Repository<VideoConfig>
    ) {
    }

    async saveBucketConfig(body: BucketConfig): Promise<void> {
        let exist: Bucket;
        const newBucket: any = {
            name: body.name,
        };
        const directoryPath = path.resolve(__dirname, "../", "store", body.name);
        if (body.isPublic) {
            exist = await this.bucketRepository.findOneById(1);
        } else {
            exist = await this.bucketRepository.findOneById(2);
            newBucket.tokenExpire = Number.parseInt(body.tokenExpire as any);
            newBucket.tokenSecretKey = body.tokenSecretKey;
        }
        if (exist) {
            try {
                await this.bucketRepository.updateById(exist.id, newBucket);
                // 创建新目录，暂定不删除旧目录,只是新建这次配置的目录
                if (!this.fileUtil.exist(directoryPath)) {
                    await this.fileUtil.mkdir(directoryPath);
                }
            } catch (err) {
                throw new HttpException("空间配置更新失败" + err.toString(), 410);
            }
            return;
        }
        const bucket: Bucket = new Bucket();
        const audioConfig: AudioConfig = new AudioConfig();
        const videoConfig: VideoConfig = new VideoConfig();
        const imageConfig: ImageConfig = new ImageConfig();
        if (body.isPublic) {
            bucket.id = 1;
            bucket.publicOrPrivate = "public";
        } else {
            bucket.id = 2;
            bucket.publicOrPrivate = "private";
            bucket.tokenExpire = +body.tokenExpire as any;
            bucket.tokenSecretKey = body.tokenSecretKey as any;
        }
        bucket.name = body.name;
        audioConfig.id = bucket.id;
        videoConfig.id = bucket.id;
        imageConfig.id = bucket.id;
        bucket.audioConfig = audioConfig;
        bucket.videoConfig = videoConfig;
        bucket.imageConfig = imageConfig;
        try {
            await this.bucketRepository.save(bucket);
            if (!this.fileUtil.exist(directoryPath)) {
                await this.fileUtil.mkdir(directoryPath);
            }
        } catch (err) {
            throw new HttpException("空间保存失败" + err.toString(), 410);
        }
    }

    async saveImageFormat(body: ImageFormat): Promise<void> {
        let { format } = body;
        format = format.toLowerCase();
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["imageConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        try {
            await buckets.forEach(async (bucket) => {
                await this.imageConfigRepository.updateById(bucket.imageConfig.id, { format });
            });
        } catch (err) {
            throw new HttpException("图片保存格式更新失败" + err.toString(), 410);
        }
    }

    async saveEnableImageWatermark(body: EnableImageWatermark): Promise<void> {
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["imageConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        let watermarkEnable: number;
        if (body.enable) {
            watermarkEnable = 1;
        } else {
            watermarkEnable = 0;
        }
        try {
            await buckets.forEach(async (bucket) => {
                await this.imageConfigRepository.updateById(bucket.imageConfig.id, { watermarkEnable });
            });
        } catch (err) {
            throw new HttpException("水印启用更新失败" + err.toString(), 410);
        }
    }

    async saveImageWatermark(file: any, obj: any): Promise<void> {
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["imageConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        for (let i = 0; i < buckets.length; i++) {
            let metadata: ImageMetadata = {} as any;
            // 根据format设置处理后文件类型
            const format = buckets[i].imageConfig.format || "raw";
            // 根据不同的图片保存类型，处理并且存储图片，返回处理后元数据
            if (format === "raw") {
                metadata = await this.imageProcessUtil.processAndStore(file.path, buckets[i], {
                    strip: true,
                    watermark: false
                });
            } else if (format === "webp_damage") {
                metadata = await this.imageProcessUtil.processAndStore(file.path, buckets[i], {
                    format: "webp",
                    strip: true,
                    watermark: false
                });
            } else if (format === "webp_undamage") {
                metadata = await this.imageProcessUtil.processAndStore(file.path, buckets[i], {
                    format: "webp",
                    lossless: true,
                    strip: true,
                    watermark: false
                });
            }
            const image: Image = new Image();
            image.bucket = buckets[i];
            image.rawName = file.name;
            image.name = metadata.name;
            image.type = metadata.format;
            image.width = metadata.width;
            image.height = metadata.height;
            image.size = metadata.size;
            const isExist: Image = await this.imageRepository.findOne({ name: metadata.name, bucketId: buckets[i].id });
            // 只有指定路径图片不存在时才会保存
            if (!isExist) {
                try {
                    await this.imageRepository.save(image);
                } catch (err) {
                    // 保存图片出现错误，要删除存储图片
                    await this.fileUtil.delete(path.resolve(__dirname, "../", "store", buckets[i].name, image.name + "." + image.type));
                    throw new HttpException("水印图片保存失败" + err.toString(), 410);
                }
            }
            // 更新图片配置，这里的水印图片路径为图片的绝对路径
            // 不管图片是否已经存在，图片配置都需要更新
            try {
                await this.imageConfigRepository.updateById(buckets[i].imageConfig.id, {
                    // 水印路径为相对路径
                    watermarkSaveKey: "/store/" + buckets[i].name + "/" + image.name + "." + image.type,
                    watermarkGravity: obj.gravity,
                    watermarkOpacity: obj.opacity,
                    watermarkWs: obj.ws,
                    watermarkX: obj.x,
                    watermarkY: obj.y
                });
            } catch (err) {
                throw new HttpException("图片水印更新失败" + err.toString(), 410);
            }
        }
        // 删除临时文件
        await this.fileUtil.delete(file.path);
    }

    async saveAudioFormat(body: AudioFormat): Promise<any> {
        let { format } = body;
        format = format.toLowerCase();
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["audioConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        try {
            await buckets.forEach(async (bucket) => {
                await this.audioConfigRepository.updateById(bucket.audioConfig.id, { format });
            });
        } catch (err) {
            throw new HttpException("音频保存格式更新失败" + err.toString(), 410);
        }
    }

    async saveVideoFormat(body: VideoFormat): Promise<any> {
        let { format, resolution } = body;
        format = format.toLowerCase();
        resolution = resolution.toLowerCase();
        const buckets: Array<Bucket> = await this.bucketRepository.find({ relations: ["videoConfig"] });
        if (buckets.length !== 2) {
            throw new HttpException("空间配置不存在", 401);
        }
        try {
            await buckets.forEach(async (bucket) => {
                await this.videoConfigRepository.updateById(bucket.videoConfig.id, { format, resolution });
            });
        } catch (err) {
            throw new HttpException("视频保存格式更新失败" + err.toString(), 410);
        }
    }
}
