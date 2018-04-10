import { Component, HttpException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ImageMetadata } from "../interface/file/image.metadata";
import { ImagePostProcessInfo, ImagePreProcessInfo } from "../interface/file/image.process.info";
import { UploadFile } from "../interface/file/upload.file";
import { UploadForm } from "../interface/file/upload.form";
import { Audio } from "../model/audio.entity";
import { Bucket } from "../model/bucket.entity";
import { File } from "../model/file.entity";
import { Image } from "../model/image.entity";
import { Video } from "../model/video.entity";
import { ImageProcessUtil } from "../util/image.process.util";
import { KindUtil } from "../util/kind.util";
import { TokenUtil } from "../util/token.util";

/* 文件Service*/
@Component()
export class FileService {

    constructor(
        @Inject(KindUtil) private readonly kindUtil: KindUtil,
        @Inject(TokenUtil) private readonly tokenUtil: TokenUtil,
        @Inject(ImageProcessUtil) private readonly imageProcessUtil: ImageProcessUtil,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Audio) private readonly audioRepository: Repository<Audio>,
        @InjectRepository(Video) private readonly videoRepository: Repository<Video>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) {
    }

    async saveUploadFile(bucket: Bucket, file: UploadFile, obj: UploadForm): Promise<string> {
        let { imagePreProcessString, contentSecret, tagsString, md5, bucketName, rawName } = obj
        let imageProcessInfo: ImagePreProcessInfo, tags: string[]
        try {
            if (tagsString) {
                tags = JSON.parse(tagsString)
            }
            if (imagePreProcessString) {
                imageProcessInfo = JSON.parse(imagePreProcessString)
                if (bucket.imageConfig.format === "webp_damage") {
                    (imageProcessInfo as ImagePostProcessInfo).format = "webp";
                    (imageProcessInfo as ImagePostProcessInfo).lossless = false
                } else if (bucket.imageConfig.format === "webp_undamage") {
                    //这样写。后面需要分号
                    (imageProcessInfo as ImagePostProcessInfo).format = "webp";
                    (imageProcessInfo as ImagePostProcessInfo).lossless = true
                } else {
                    //这样写。后面需要分号
                    (imageProcessInfo as ImagePostProcessInfo).format = undefined;
                    (imageProcessInfo as ImagePostProcessInfo).lossless = undefined
                }
            }
        } catch (err) {
            throw new HttpException("JSON解析错误:" + err.toString(), 405)
        }
        //默认情况下，上传文件都会进行处理保存，如果处理后得到的文件名(sha256)已存在，会覆盖源文件
        let metadata: ImageMetadata = await this.imageProcessUtil.processAndStore(file.path, bucket, imageProcessInfo)
        let type: string = rawName.substring(rawName.lastIndexOf(".") + 1)
        let kind: string = this.kindUtil.getKind(type)
        if (kind === "image") {
            let exist: Image = await this.imageRepository.findOne({ name: metadata.name, bucketId: bucket.id })
            //如果处理后得到文件已存在，不保存，正确返回
            if (exist) {
                return "/visit/" + bucket.name + "/" + exist.name + "." + exist.type
            }
            //不存在，保存处理后文件
            let image: Image = new Image();
            image.bucket = bucket
            image.raw_name = file.name
            image.name = metadata.name
            image.size = metadata.size
            image.type = metadata.format
            image.width = metadata.width
            image.height = metadata.height
            if (tags) {
                image.tags = tags
            }
            if (contentSecret) {
                image.content_secret = contentSecret
            }
            try {
                await this.imageRepository.save(image)
            } catch (err) {
                throw new HttpException("文件保存到数据库失败:" + err.toString(), 406)
            }
            return "/visit/" + bucket.name + "/" + image.name + "." + image.type
        } else {
            // 暂时不支持其他种类文件
        }
    }

    async getAll(data: any, bucket: Bucket) {
        data.files = await bucket.files
        data.images = await bucket.images
        data.audios = await bucket.audios
        data.videos = await bucket.videos
        data.documents = await bucket.documents

        const tokenUtil = this.tokenUtil
        const addUrl = async function (value) {
            value.url = "/" + bucket.name + "/" + value.name + "." + value.type
            if (bucket.public_or_private === "private") {
                value.url += "?token=" + await tokenUtil.getToken(data.baseUrl + value.url, bucket)
            }
        };
        await data.files.forEach(addUrl);
        await data.images.forEach(addUrl);
        await data.audios.forEach(addUrl);
        await data.videos.forEach(addUrl);
        await data.documents.forEach(addUrl);
        return;
    }
}
