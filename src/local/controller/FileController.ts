import { Controller, Get, Post, Request, Response, Body, Param, Headers, Query } from '@nestjs/common';
import { ImagePostProcessInfo } from '../interface/file/ImageProcessInfo';
import { ImageProcessUtil } from '../util/ImageProcessUtil';
import { UploadFile } from '../interface/file/UploadFile';
import { UploadForm } from '../interface/file/UploadForm';
import { QueryParam } from '../interface/file/QueryParam';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PathParam } from '../interface/file/PathParam';
import { FileService } from '../service/FileService';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonData } from '../interface/Common'
import { TokenUtil } from '../util/TokenUtil';
import { Document } from '../model/Document';
import { KindUtil } from '../util/KindUtil';
import * as  formidable from 'formidable';
import { Bucket } from '../model/Bucket';
import { Audio } from '../model/Audio';
import { Video } from '../model/Video';
import { Image } from '../model/Image';
import { File } from '../model/File';
import * as crypto from 'crypto';
import * as path from 'path';
import * as mime from 'mime';
import * as fs from 'fs';
import { ImageMetadata } from '../interface/file/ImageMetadata';

/*文件控制器，包含了文件下载、上传、访问功能
  访问、下载在浏览器的默认效果不同，其中访问私有空间文件需要token
*/
@Controller('local/file')
export class FileController {

    constructor(
        private readonly kindUtil: KindUtil,
        private readonly tokenUtil: TokenUtil,
        private readonly fileService: FileService,
        private readonly imageProcessUtil: ImageProcessUtil,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) {
    }

    /* 下载文件接口，文件路径在url中，文件存在直接返回，不存在返回错误码404 */
    @Get('/download/:bucket_name/:fileName')
    async download( @Param() param: PathParam, @Response() res): Promise<CommonData> {
        let { bucket_name, fileName } = param
        //验证参数
        if (!bucket_name || !fileName) {
            res.json({ code: 400, message: '缺少文件路径' })
            res.end()
            return
        }
        //文件绝对路径，这里并不查询数据库，直接从文件夹获取
        let realPath: string = path.resolve(__dirname, '../', 'store', bucket_name, fileName)
        //文件不存在，返回404
        if (!fs.existsSync(realPath)) {
            res.json({ code: 404, message: '请求文件不存在' })
            res.end()
            return
        }
        //下载文件的buffer，不进行处理，返回原始文件
        let buffer: Buffer = fs.readFileSync(realPath)
        //文件类型响应头
        res.setHeader('Content-Type', mime.getType(fileName))
        //文件大小响应头
        res.setHeader('Content-Length', Buffer.byteLength(buffer))
        //下载响应头，不管浏览器支持不支持显示文件mime，都会直接弹出下载
        res.setHeader('Content-Disposition', 'attachment; filename=' + fileName)
        //发送文件buffer
        res.end(buffer)
        return
    }


    /* 上传文件接口，空间名、文件原名在路径中，其他上传信息：md5、图片处理字符串、标签字符串、文件密钥都与文件一起使用表单上传
       小bug，如果参数中出现了@Response装饰器，那么直接使用return返回不成功，需要使用res.end
    */
    @Post('/upload/:bucket_name/:fileName')
    async upload( @Param() param: PathParam, @Request() req): Promise<CommonData> {
        let data: CommonData = {
            code: 200,
            message: ''
        }
        let { bucket_name, fileName } = param
        //验证路径中参数
        if (!bucket_name || !fileName) {
            data.code = 400
            data.message = '缺少参数'
            return data
        }
        //这里需要将图片、音频、视频配置关联查找出来，后面保存文件预处理要使用
        let bucket: Bucket = await this.bucketRepository.createQueryBuilder("bucket")
            .leftJoinAndSelect("bucket.image_config", "image_config")
            .leftJoinAndSelect("bucket.audio_config", "audio_config")
            .leftJoinAndSelect("bucket.video_config", "video_config")
            .where("bucket.name = :name", { name: bucket_name })
            .getOne()
        if (!bucket) {
            data.code = 401
            data.message = '指定空间不存在'
            return data
        }
        //解析from-data请求，获取上传表单中文件、其他字段
        let file: UploadFile, obj: UploadForm
        await new Promise((resolve, reject) => {
            let form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                if (err) {
                    data.code = 402
                    data.message = '请求解析错误'
                    resolve()
                    return
                }
                //只有文件字段、md5是必须的
                if (!fields || !files || !files.file || !fields.md5) {
                    data.code = 400
                    data.message = '缺少参数'
                    resolve()
                    return
                }
                file = files.file
                obj = fields
                resolve()
                return
            });
        })
        //缺少参数、请求解析错误
        if (data.code === 400 || data.code === 402) {
            return data
        }
        //上传文件的文件名必须与路径中文件名相同，路径中文件名是上传预处理时就确定好的
        if (file.name !== fileName) {
            data.code = 403
            data.message = '文件名不符'
            return data
        }
        let { imagePreProcessString, contentSecret, tagsString, md5 } = obj
        //对上传文件进行md5校验
        let pass: boolean = crypto.createHash('md5').update(fs.readFileSync(file.path)).digest('hex') === md5
        if (!pass) {
            data.code = 404
            data.message = '文件md5校验失败'
            return data
        }
        //保存上传文件，对文件进行处理后保存在store目录下，将文件信息保存到数据库中
        await this.fileService.saveUploadFile(data, bucket, file, param, obj)
        return data
    }

    /* 访问文件接口，文件路径在url中
       私有空间文件需要token，token与图片处理字符串都在查询字符串中
       文件存在且token正确，处理后返回，不存在返回错误 */
    @Get('/visit/:bucket_name/:fileName')
    async visit( @Param() param: PathParam, @Query() query: QueryParam, @Response() res, @Request() req): Promise<CommonData> {
        //只有错误情况下会返回错误码，正常情况下返回文件Buffer
        let data: CommonData = {
            code: 200,
            message: ''
        }
        let { bucket_name, fileName } = param
        let { imagePostProcessString, token } = query
        //验证路径参数
        if (!bucket_name || !fileName) {
            data.code = 400
            data.message = '缺少文件路径'
            //测试中遇到：参数中出现@Response，貌似只能使用res来发送响应，直接return data无效
            res.json(data)
            res.end()
            return
        }
        //判断文件是否存在
        let realPath: string = path.resolve(__dirname, '../', 'store', bucket_name, fileName)
        if (!fs.existsSync(realPath)) {
            data.code = 404
            data.message = '请求文件不存在'
            res.json(data)
            res.end()
            return
        }
        //判断空间是否存在，由于要判断公有、私有空间，这里需要查询出空间
        let bucket: Bucket = await this.bucketRepository.createQueryBuilder("bucket")
            .leftJoinAndSelect("bucket.image_config", "image_config")
            .leftJoinAndSelect("bucket.audio_config", "audio_config")
            .leftJoinAndSelect("bucket.video_config", "video_config")
            .where("bucket.name = :name", { name: bucket_name })
            .getOne()
        if (!bucket) {
            data.code = 401
            data.message = '指定空间不存在'
            res.json(data)
            res.end()
            return
        }
        //私有空间需要验证token
        if (bucket.public_or_private === 'private') {
            //token不存在
            if (!token) {
                data.code = 402
                data.message = '需要token'
                res.json(data)
                res.end()
                return
            }
            //请求的全路径，包含协议、域名、端口、查询字符串，需要URL解码
            let fullUrl: string = decodeURI(req.protocol + '://' + req.get('host') + req.originalUrl)
            //获取计算token时使用的url
            if (imagePostProcessString) {
                //存储图片处理字符串时需要包含它
                fullUrl = fullUrl.substring(0, fullUrl.lastIndexOf('&token='))
            } else {
                //不存在图片处理字符串时，包含？之前的路径
                fullUrl = fullUrl.substring(0, fullUrl.lastIndexOf('?token='))
            }
            //根据空间配置、url验证token
            let pass: boolean = this.tokenUtil.verify(fullUrl, bucket, token)
            //验证未通过，可能是生成md5不同。也可能是token过期
            if (!pass) {
                data.code = 403
                data.message = 'token不正确'
                res.json(data)
                res.end()
                return
            }
        }
        //解析图片处理字符串为对象
        let imagePostProcessInfo: ImagePostProcessInfo
        if (imagePostProcessString) {
            try {
                imagePostProcessInfo = JSON.parse(imagePostProcessString)
            } catch (err) {
                data.code = 405
                data.message = '图片处理字符串解析错误'
                res.json(data)
                res.end()
                return
            }

        }
        //获取文件种类
        let type: string = fileName.substring(fileName.lastIndexOf('.') + 1)
        let kind: string = this.kindUtil.getKind(type)
        if (kind === 'image') {
            //图片需要使用处理工具进行处理之后返回，得到处理之后的buffer
            let buffer: Buffer = await this.imageProcessUtil.processAndOutput(data, bucket, realPath, imagePostProcessInfo)
            //获取处理后图片元数据，主要为获取其类型，因为经过处理图片类型可能已经改变
            let metadata: ImageMetadata = await this.imageProcessUtil.getMetadata(buffer)
            //设置文件类型头信息
            res.setHeader('Content-Type', mime.getType(metadata.format))
            //设置文件大小头信息
            res.setHeader('Content-Length', Buffer.byteLength(buffer))
            //私有空间
            if (bucket.public_or_private === 'private') {
                //文件不缓存，因为有token，暂时这样处理，也可以设置一个缓存时间
                res.setHeader('Cache-Control', ['no-store', 'no-cache'])
            }
            //文件默认显示在浏览器中，不下载，如果浏览器不支持文件类型，还是会下载
            res.setHeader('Content-Disposition', 'inline')
            res.end(buffer)
        } else {
            //其他类型暂不支持
        }
    }



}