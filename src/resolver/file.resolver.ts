import { DownloadProcessData } from "../interface/file/download.process.data";
import { ExceptionInterceptor } from "../interceptor/exception.interceptor";
import { Query, Resolver, ResolveProperty, Mutation } from "@nestjs/graphql";
import { UploadProcessBody } from "../interface/file/upload.process.body";
import { UploadProcessData } from "../interface/file/upload.process.data";
import { FileLocationBody } from "../interface/file/file.location.body";
import { HttpException, Inject, UseInterceptors } from "@nestjs/common";
import { Repository, SelectQueryBuilder } from "typeorm";
import { FileService } from "../service/file.service";
import { AllBody } from "../interface/file/all.body";
import { AllData } from "../interface/file/all.data";
import { OneBody } from "../interface/file/one.body";
import { OneData } from "../interface/file/one.data";
import { Document } from "../model/document.entity";
import { CommonData } from "../interface/common";
import { Bucket } from "../model/bucket.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { TokenUtil } from "../util/token.util";
import { Audio } from "../model/audio.entity";
import { Video } from "../model/video.entity";
import { Image } from "../model/image.entity";
import { File } from "../model/file.entity";
import { KindUtil } from "../util/kind.util";
import { FileUtil } from "../util/file.util";
import { Request } from "express";
import * as path from "path";

/*文件Resolver，包含了文件下载预处理、上传预处理
  获取单个文件url、获取多个文件信息以及url、删除文件等接口
*/
@Resolver("File")
@UseInterceptors(ExceptionInterceptor)
export class FileResolver {

    constructor(
        @Inject(FileUtil) private readonly fileUtil: FileUtil,
        @Inject(KindUtil) private readonly kindUtil: KindUtil,
        @Inject(TokenUtil) private readonly tokenUtil: TokenUtil,
        @Inject(FileService) private readonly fileService: FileService,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) {
    }

    /* 文件下载预处理接口
     当客户端需要下载某个文件时使用
     返回下载文件的方法、url、头信息
     @Param bucketName：文件所属空间名
     @Param type：       上传文件扩展名，即文件类型
     @Param name：       文件名
     @Return data.code：状态码，200为成功，其他为错误
             data.message：响应信息
             data.url：下载时的url
             data.method： 下载方法
             data.headers:下载文件头信息，这里其实不需要，但是为了与又拍云统一，返回null
    */
    @Query("downloadProcess")
    async downloadProcess(req: any, body: FileLocationBody): Promise<DownloadProcessData> {
        const data: DownloadProcessData = {
            code: 200,
            message: "下载预处理成功",
            method: "get",
            headers: {
                bucketName: "",
                fileName: ""
            },
            url: req.protocol + "://" + req.get("host") + "/local/file/download"
        };
        // 验证参数存在
        const { bucketName, name, type } = body;
        if (!bucketName || !name || !type) {
            throw new HttpException("缺少参数", 400);
        }
        const bucket: any = await this.bucketRepository.findOne({ name: bucketName });
        // 指定空间不存在
        if (!bucket) {
            throw new HttpException("指定空间" + bucketName + "不存在", 401);
        }
        // 根据文件种类获取文件实例
        let file: any = {} as any;
        if (this.kindUtil.isImage(type)) {
            file = await this.imageRepository.findOne({ name, type, bucketId: bucket.id });
        } else {
            // 其他类型暂不支持
        }
        if (!file) {
            throw new HttpException("指定文件" + name + "不存在", 404);
        }
        data.headers.bucketName = bucket.name;
        data.headers.fileName = file.name + "." + file.type;
        return data;
    }

    /*文件表单上传预处理接口
    @Param tags:文件标签数组
    @Param contentName：文件名
    @Param bucketName：上传空间名
    @Param md5：文件md5,在本地存储中可以用于校验文件
    @Param contentSecret：文件密钥，暂时不支持这个功能
    @Param imagePreProcessInfo：图片预处理信息
    @Return data.code：状态码，200为成功，其他为错误
            data.message：响应信息
            data.url：上传时的url
            data.method： 上传方法
            data.form：   表单上传的字段对象，包含了imagePreProcessInfo、md5、contentSecret、tags字段，上传时需要加上file字段
    */
    @Mutation("uploadProcess")
    async uploadProcess(req: any, body: UploadProcessBody): Promise<UploadProcessData> {
        const data: UploadProcessData = {
            code: 200,
            message: "",
            method: "post",
            url: req.protocol + "://" + req.get("host") + "/local/file/upload",
            baseUrl: req.protocol + "://" + req.get("host"),
            form: {
                md5: "",
                rawName: "",
                bucketName: "",
                tagsString: undefined,
                contentSecret: undefined,
                imagePreProcessString: undefined,
            }
        };
        // 可以根据md5对文件内容进行校验
        const { bucketName, md5, contentName, contentSecret, tags, imagePreProcessInfo } = body;
        if (!bucketName || !contentName) {
            throw new HttpException("缺少参数", 400);
        }
        const bucket: Bucket | undefined = await this.bucketRepository.findOne({ name: bucketName });
        if (!bucket) {
            throw new HttpException("指定空间" + bucketName + "不存在", 401);
        }
        data.form.md5 = md5;
        data.form.rawName = contentName;
        data.form.bucketName = bucket.name;
        data.form.contentSecret = contentSecret;
        try {
            data.form.tagsString = JSON.stringify(tags);
            data.form.imagePreProcessString = JSON.stringify(imagePreProcessInfo);
        } catch (err) {
            throw new HttpException("JSON解析错误" + err.toString(), 409);
        }
        return data;
    }

    /* 获取访问单个文件url方法 ，从后台获取
       @Param bucketName：空间名
       @Param name：       文件名，不包括扩展名
       @Param type:        文件类型
       @Param imagePostProcessInfo 图片后处理信息，转化为JSON字符串
       @Return data.code：状态码，200为成功，其他为错误
               data.message：响应信息
               data.url：访问文件的全部url，包括域名、目录、文件名、扩展名、token、处理字符串,访问图片方法必须是get，不说明
    */
    @Query("one")
    async getOne(req: any, body: OneBody): Promise<OneData> {
        const data: OneData = {
            code: 200,
            message: "获取文件url成功",
            url: req.protocol + "://" + req.get("host") + "/local/file/visit"
        };
        // 验证参数存在，图片后处理信息可选
        const { bucketName, name, type, imagePostProcessInfo } = body;
        if (!bucketName || !name || !type) {
            throw new HttpException("缺少参数", 400);
        }
        const bucket: Bucket | undefined = await this.bucketRepository.createQueryBuilder("bucket")
            .leftJoinAndSelect("bucket.imageConfig", "imageConfig")
            .leftJoinAndSelect("bucket.audioConfig", "audioConfig")
            .leftJoinAndSelect("bucket.videoConfig", "videoConfig")
            .where("bucket.name = :name", { name: bucketName })
            .getOne();
        if (!bucket) {
            throw new HttpException("指定空间" + bucketName + "不存在", 401);
        }
        // 根据文件种类处理
        const kind = this.kindUtil.getKind(type);
        if (kind === "image") {
            const image: Image | undefined = await this.imageRepository.findOne({ name, bucketId: bucket.id });
            if (!image) {
                throw new HttpException("指定图片" + name + "." + type + "不存在", 404);
            }
            // 所有文件调用统一的拼接Url方法
            data.url += "/" + bucketName + "/" + name + "." + type;
            // 存储图片处理信息时
            if (imagePostProcessInfo) {
                // 拼接图片处理的查询字符串
                data.url += "?imagePostProcessString=" + JSON.stringify(imagePostProcessInfo);
                // 私有空间要拼接token，token使用它之前的完整路径计算
                if (bucket.publicOrPrivate === "private") {
                    data.url += "&token=" + this.tokenUtil.getToken(data.url, bucket);
                }
            } else {
                if (bucket.publicOrPrivate === "private") {
                    data.url += "?token=" + this.tokenUtil.getToken(data.url, bucket);
                }
            }
        } else {
            // 暂不支持
        }
        return data;
    }

    /* 获取指定空间下文件信息以及相关访问url
       @Param bucketName：文件所属空间
       @Return data.code： 状态码，200为成功，其他为错误
              data.message：响应信息
              data.baseUrl：访问文件的基本url
              data.files    分页后的文件信息数组，里面添加了访问文件url信息，url不包含域名，包含了文件密钥、token
              data.imges：   图片信息数组
              data.audios:  音频信息数组
              data.videos:  视频信息数组
              data.documents: 文档信息数组
    */
    @Query("all")
    async files(req: any, body: AllBody): Promise<AllData> {
        const data: AllData = {
            code: 200,
            message: "获取空间下所有文件成功",
            baseUrl: req.protocol + "://" + req.get("host") + "/local/file/visit",
            files: [],
            images: [],
            audios: [],
            videos: [],
            documents: []
        };
        const { bucketName } = body;
        if (!bucketName) {
            throw new HttpException("缺少参数", 400);
        }
        await this.fileService.getAll(data, bucketName);
        return data;
    }

    /* 文件删除接口
       当客户端需要删除某个文件时使用，
       @Param bucketName：文件所属空间名
       @Param type：       文件扩展名，即文件类型
       @Param name：       文件名
       @Return data.code：状态码，200为成功，其他为错误
               data.message：响应信息
    */
    @Mutation("deleteFile")
    async deleteFile(req: Request, body: FileLocationBody): Promise<CommonData> {
        // 验证参数
        const { bucketName, type, name } = body;
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
        const realPath = path.resolve(__dirname, "../../", "store", bucketName, name + "." + type);
        if (!this.fileUtil.exist(realPath)) {
            throw new HttpException("要删除的文件不存在", 404);
        }
        await this.fileUtil.delete(realPath);
        return { code: 200, message: "删除成功" };
    }
}
