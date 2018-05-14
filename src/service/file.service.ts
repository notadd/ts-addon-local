import { Injectable, HttpException, Inject } from "@nestjs/common";
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
@Injectable()
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

    async saveUploadFile(bucket: Bucket, file: UploadFile, obj: UploadForm): Promise<any> {
        const { imagePreProcessString, contentSecret, tagsString, md5, bucketName, rawName } = obj;
        let imageProcessInfo: ImagePreProcessInfo = {} as any, tags: Array<string> = {} as any;
        try {
            if (tagsString) {
                tags = JSON.parse(tagsString);
            }
            if (imagePreProcessString) {
                imageProcessInfo = JSON.parse(imagePreProcessString);
                if (bucket.imageConfig.format === "webp_damage") {
                    (imageProcessInfo as ImagePostProcessInfo).format = "webp";
                    (imageProcessInfo as ImagePostProcessInfo).lossless = false;
                } else if (bucket.imageConfig.format === "webp_undamage") {
                    // 这样写。后面需要分号
                    (imageProcessInfo as ImagePostProcessInfo).format = "webp";
                    (imageProcessInfo as ImagePostProcessInfo).lossless = true;
                } else {
                    // 这样写。后面需要分号
                    (imageProcessInfo as ImagePostProcessInfo).format = undefined as any;
                    (imageProcessInfo as ImagePostProcessInfo).lossless = undefined as any;
                }
            }
        } catch (err) {
            throw new HttpException("JSON解析错误:" + err.toString(), 405);
        }
        // 默认情况下，上传文件都会进行处理保存，如果处理后得到的文件名(sha256)已存在，会覆盖源文件
        const metadata: ImageMetadata = await this.imageProcessUtil.processAndStore(file.path, bucket, imageProcessInfo as any);
        const type: string = rawName.substring(rawName.lastIndexOf(".") + 1);
        const kind: string = this.kindUtil.getKind(type);
        if (kind === "image") {
            const exist: Image | undefined = await this.imageRepository.findOne({ name: metadata.name, bucketId: bucket.id });
            // 如果处理后得到文件已存在，不保存，正确返回
            if (exist) {
                return "/local/file/visit/" + bucket.name + "/" + exist.name + "." + exist.type;
            }
            // 不存在，保存处理后文件
            const image: Image = new Image();
            image.bucket = bucket;
            image.rawName = file.name;
            image.name = metadata.name;
            image.size = metadata.size;
            image.type = metadata.format;
            image.width = metadata.width;
            image.height = metadata.height;
            if (tags) {
                image.tags = tags;
            }
            if (contentSecret) {
                image.contentSecret = contentSecret;
            }
            try {
                await this.imageRepository.save(image);
            } catch (err) {
                throw new HttpException("文件保存到数据库失败:" + err.toString(), 406);
            }
            return "/local/file/visit/" + bucket.name + "/" + image.name + "." + image.type;
        } else {
            // 暂时不支持其他种类文件
        }
    }

    async getAll(data: any, bucketName: string) {
        const bucket: Bucket | undefined = await this.bucketRepository.createQueryBuilder("bucket")
            .where({ name: bucketName })
            .leftJoinAndSelect("bucket.files", "file")
            .leftJoinAndSelect("bucket.images", "image")
            .leftJoinAndSelect("bucket.audios", "audio")
            .leftJoinAndSelect("bucket.videos", "video")
            .leftJoinAndSelect("bucket.documents", "document")
            .getOne();
        if (!bucket) {
            throw new HttpException("指定空间" + bucketName + "不存在", 401);
        }
        data.files = bucket.files;
        data.images = bucket.images;
        data.audios = bucket.audios;
        data.videos = bucket.videos;
        data.documents = bucket.documents;
        const tokenUtil = this.tokenUtil;
        const addUrl = value => {
            value.url = "/" + bucket.name + "/" + value.name + "." + value.type;
            if (bucket.publicOrPrivate === "private") {
                value.url += "?token=" + tokenUtil.getToken(data.baseUrl + value.url, bucket);
            }
        };
        data.files.forEach(addUrl);
        data.images.forEach(addUrl);
        data.audios.forEach(addUrl);
        data.videos.forEach(addUrl);
        data.documents.forEach(addUrl);
        return;
    }
}
