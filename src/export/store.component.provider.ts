import { ImagePostProcessInfo, ImagePreProcessInfo } from "../interface/file/image.process.info";
import { HttpException, Component, Inject } from "@nestjs/common";
import { ImageMetadata } from "../interface/file/image.metadata";
import { ImageProcessUtil } from "../util/image.process.util";
import { Repository, Connection } from "typeorm";
import { Bucket } from "../model/bucket.entity";
import { Image } from "../model/image.entity";
import { TokenUtil } from "../util/token.util";
import { FileUtil } from "../util/file.util";
import { KindUtil } from "../util/kind.util";
import * as path from "path";

export class StoreComponent {

    private readonly baseDirectory = path.resolve(process.cwd(), "storages", "local");

    constructor(
        @Inject(KindUtil) private readonly kindUtil: KindUtil,
        @Inject(FileUtil) private readonly fileUtil: FileUtil,
        @Inject(TokenUtil) private readonly tokenUtil: TokenUtil,
        @Inject(ImageProcessUtil) private readonly imageProcessUtil: ImageProcessUtil,
        @Inject("LocalModule.ImageRepository") private readonly imageRepository: Repository<Image>,
        @Inject("LocalModule.BucketRepository") private readonly bucketRepository: Repository<Bucket>
    ) {
    }

    async delete(bucketName: string, name: string, type: string): Promise<void> {
        // 验证参数
        if (!bucketName || !name || !type) {
            throw new HttpException("缺少参数", 400);
        }
        const bucket: Bucket | undefined = await this.bucketRepository.findOne({ name: bucketName });
        if (!bucket) {
            throw new HttpException("指定空间" + bucketName + "不存在", 401);
        }
        // 根据文件种类，查找、删除数据库
        const kind = this.kindUtil.getKind(type);
        if (kind === "image") {
            const image: Image | undefined = await this.imageRepository.findOne({ name, bucketId: bucket.id });
            if (!image) {
                throw new HttpException("文件" + name + "不存在于数据库中", 404);
            }
            await this.imageRepository.delete({ name, bucketId: bucket.id });
        } else {
            // 其他类型暂不支持
        }
        // 删除目录下存储文件
        const realPath = this.baseDirectory + "/" + bucketName + "/" + name + "." + type;
        if (!this.fileUtil.exist(realPath)) {
            throw new HttpException("要删除的文件不存在", 404);
        }
        await this.fileUtil.delete(realPath);
    }

    async upload(bucketName: string, rawName: string, base64: string, imagePreProcessInfo: ImagePreProcessInfo): Promise<{ bucketName: string, name: string, type: string }> {
        const tempPath: string = this.baseDirectory + "/temp" + ((+new Date()) + "") + rawName;
        if (!bucketName || !rawName || !base64) {
            throw new HttpException("缺少参数", 400);
        }
        imagePreProcessInfo = !imagePreProcessInfo ? {} as any : imagePreProcessInfo;
        const bucket: any = await this.bucketRepository.createQueryBuilder("bucket")
            .leftJoinAndSelect("bucket.imageConfig", "imageConfig")
            .where("bucket.name = :name", { name: bucketName })
            .getOne();
        if (!bucket) {
            throw new HttpException("指定空间" + bucketName + "不存在", 401);
        }
        await this.fileUtil.write(tempPath, Buffer.from(base64, "base64"));
        let metadata: ImageMetadata = {} as any;
        const type: string = rawName.substring(rawName.lastIndexOf(".") + 1);
        // 根据文件种类
        const kind: string = this.kindUtil.getKind(type);
        try {
            if (kind === "image") {
                const imagePostProcessInfo: ImagePostProcessInfo = imagePreProcessInfo as any;
                const format = bucket.imageConfig.format || "raw";
                // 根据不同的图片保存类型，处理并且存储图片，返回处理后元数据
                if (format === "raw") {
                    imagePostProcessInfo.strip = true;
                    imagePostProcessInfo.watermark = false;
                } else if (format === "webp_damage") {
                    imagePostProcessInfo.format = "webp";
                    imagePostProcessInfo.strip = true;
                    imagePostProcessInfo.watermark = false;
                } else if (format === "webp_undamage") {
                    imagePostProcessInfo.format = "webp";
                    imagePostProcessInfo.lossless = true;
                    imagePostProcessInfo.strip = true;
                    imagePostProcessInfo.watermark = false;
                }
                metadata = await this.imageProcessUtil.processAndStore(tempPath, bucket, imagePostProcessInfo);
                const image: Image = new Image();
                image.bucket = bucket;
                image.rawName = rawName;
                image.name = metadata.name;
                image.type = metadata.format;
                image.width = metadata.width;
                image.height = metadata.height;
                image.size = metadata.size;
                const isExist: Image | undefined = await this.imageRepository.findOne({ name: metadata.name, bucketId: bucket.id });
                // 只有指定路径图片不存在时才会保存
                if (!isExist) {
                    try {
                        await this.imageRepository.save(image);
                    } catch (err) {
                        // 保存图片出现错误，要删除存储图片
                        await this.fileUtil.delete(this.baseDirectory + "/" + bucket.name + "/" + image.name + "." + image.type);)
                        throw new HttpException("上传图片保存失败" + err.toString(), 410);
                    }
                }
            } else {
                // 其他类型暂不支持
            }
        } catch (err) {
            throw err;
        } finally {
            // 如果中间过程抛出了异常，要保证删除临时图片
            await this.fileUtil.deleteIfExist(tempPath);
        }
        return { bucketName, name: metadata.name, type: metadata.format };
    }

    async getUrl(req: any, bucketName: string, name: string, type: string, imagePostProcessInfo: ImagePostProcessInfo): Promise<string> {
        // 验证参数
        if (!bucketName || !name || !type || !req || !req.protocol || !req.get("host")) {
            throw new HttpException("缺少参数", 400);
        }
        const bucket: Bucket | undefined = await this.bucketRepository.findOne({ name: bucketName });
        if (!bucket) {
            throw new HttpException("指定空间" + bucketName + "不存在", 401);
        }
        let url: string = req.protocol + "://" + req.get("host") + "/local/file/visit";
        // 根据文件种类，查找、删除数据库
        const kind = this.kindUtil.getKind(type);
        if (kind === "image") {
            const image: Image | undefined = await this.imageRepository.findOne({ name, bucketId: bucket.id });
            if (!image) {
                throw new HttpException("指定图片" + name + "." + type + "不存在", 404);
            }
            // 所有文件调用统一的拼接Url方法
            url += "/" + bucketName + "/" + name + "." + type;
            // 存储图片处理信息时
            if (imagePostProcessInfo) {
                // 拼接图片处理的查询字符串
                url += "?imagePostProcessString=" + JSON.stringify(imagePostProcessInfo);
                // 私有空间要拼接token，token使用它之前的完整路径计算
                if (bucket.publicOrPrivate === "private") {
                    url += "&token=" + this.tokenUtil.getToken(url, bucket);
                }
            } else {
                if (bucket.publicOrPrivate === "private") {
                    url += "?token=" + this.tokenUtil.getToken(url, bucket);
                }
            }
        } else {
            // 其他类型暂不支持
        }
        return url;
    }
}

export const StoreComponentProvider = {
    provide: "StoreComponentToken",
    useFactory: (kindUtil: KindUtil, fileUtil: FileUtil, tokenUtil: TokenUtil, imageProcessUtil: ImageProcessUtil, imageRepository: Repository<Image>, bucketRepository: Repository<Bucket>) => {
        return new StoreComponent(kindUtil, fileUtil, tokenUtil, imageProcessUtil, imageRepository, bucketRepository);
    },
    inject: [KindUtil, FileUtil, TokenUtil, ImageProcessUtil, "ImageRepository", "BucketRepository"]

};
