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
        let realPath:string = path.resolve(__dirname, '../', 'store', bucket_name, fileName)
        //文件不存在，返回404
        if (!fs.existsSync(realPath)) {
            res.json({ code: 404, message: '请求文件不存在' })
            res.end()
            return
        }
        //下载文件的buffer，不进行处理，返回原始文件
        let buffer:Buffer = fs.readFileSync(realPath)
        //文件类型响应头
        res.setHeader('Content-Type', mime.getType(fileName))
        //文件大小响应头
        res.setHeader('Content-Length', Buffer.byteLength(buffer))
        //下载响应头，不管浏览器支持不支持显示文件mime，都会直接弹出下载
        res.setHeader('Content-Disposition','attachment; filename='+fileName)
        //发送文件buffer
        res.end(buffer)
        return
    }


    /* 上传文件接口，空间名、文件原名在路径中
       小bug，如果参数中出现了@Response装饰器，那么直接使用return返回不成功，需要使用res.end
    */
    @Post('/upload/:bucket_name/:fileName')
    async upload( @Param() param: PathParam, @Request() req): Promise<CommonData> {
        let data: CommonData = {
            code: 200,
            message: ''
        }
        let { bucket_name, fileName } = param
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
        if (data.code === 400 || data.code === 402) {
            return data
        }
        if (file.name !== fileName) {
            data.code = 403
            data.message = '文件名不符'
            return data
        }
        let { imagePreProcessString, contentSecret, tagsString, md5 } = obj
        //对上传文件进行md5校验
        let pass:boolean = crypto.createHash('md5').update(fs.readFileSync(file.path)).digest('hex') === md5
        if (!pass) {
            data.code = 404
            data.message = '文件md5校验失败'
            return data
        }
        await this.fileService.saveUploadFile(data, bucket, file, param, obj)
        return data
    }

    /* 访问文件接口，文件路径在url中，文件存在且token正确，处理后返回，不存在返回错误 */
    @Get('/visit/:bucket_name/:fileName')
    async visit( @Param() param: PathParam, @Query() query:QueryParam, @Response() res, @Request() req): Promise<CommonData> {
        let data:CommonData = {
            code: 200,
            message: ''
        }
        let { bucket_name, fileName } = param
        let { imagePostProcessString, token } = query
        //判断路径参数
        if (!bucket_name || !fileName) {
            data.code = 400
            data.message = '缺少文件路径'
            res.json(data)
            res.end()
            return
        }
        //判断文件是否存在
        let realPath:string = path.resolve(__dirname, '../', 'store', bucket_name, fileName)
        if (!fs.existsSync(realPath)) {
            data.code = 404
            data.message = '请求文件不存在'
            res.json(data)
            res.end()
            return
        }
        //判断空间是否存在
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
        //判断token是否正确且未超时
        if (bucket.public_or_private === 'private') {
            if (!token) {
                data.code = 402
                data.message = '需要token'
                res.json(data)
                res.end()
                return
            }
            let fullUrl:string =  decodeURI(req.protocol + '://' + req.get('host') + req.originalUrl)
            if (imagePostProcessString) {
                fullUrl= fullUrl.substring(0,fullUrl.lastIndexOf('&token='))
            }else{
                fullUrl= fullUrl.substring(0,fullUrl.lastIndexOf('?token='))
            }
            let pass:boolean = this.tokenUtil.verify(fullUrl, bucket, token)
            if (!pass) {
                data.code = 403
                data.message = 'token不正确'
                res.json(data)
                res.end()
                return
            }
        }
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
        let type: string = fileName.substring(fileName.lastIndexOf('.') + 1)
        let kind: string = this.kindUtil.getKind(type)
        if (kind === 'image') {
            let buffer = await this.imageProcessUtil.processAndOutput(data, bucket, realPath, imagePostProcessInfo)
            res.setHeader('Content-Type', mime.getType(fileName))
            res.setHeader('Content-Length', Buffer.byteLength(buffer))
            res.setHeader('Cache-Control', ['no-store', 'no-cache'])
            res.setHeader('Content-Disposition','inline')
            res.end(buffer)
        } else {
            //其他类型暂不支持
        }
    }



}