import { Controller, Get, Post, Request, Response, Body, Param, Headers, Query } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FileService } from '../service/FileService'
import { Document } from '../model/Document'
import { KindUtil } from '../util/KindUtil'
import * as  formidable from 'formidable'
import { Bucket } from '../model/Bucket';
import { Audio } from '../model/Audio'
import { Video } from '../model/Video'
import { Image } from '../model/Image';
import { File } from '../model/File'

import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs'
/*文件控制器，包含了文件下载、上传、访问功能
*/
@Controller('local/file')
export class FileController {

    constructor(
        private readonly kindUtil: KindUtil,
        private readonly fileService: FileService,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) {
    }

    /* 下载文件接口，文件路径在url中，文件存在直接返回，不存在返回错误码404 */
    @Get('/download/:bucket_name/:fileName')
    async download( @Param() param, @Response() res) {
        let { bucket_name, fileName } = param
        if (!bucket_name || !fileName) {
            return {
                code: 400,
                message: '缺少文件路径'
            }
        }
        let realPath = path.resolve(__dirname, '../', 'store', bucket_name, fileName)
        if (fs.existsSync(realPath)) {
            res.download(realPath, fileName)
            return
        }
        return {
            code: 404,
            message: '请求文件不存在'
        }
    }


    /* 上传文件接口，空间名、文件原名在路径中*/
    @Post('/download/:bucket_name/:fileName')
    async upload( @Param() param, @Response() res, @Request() req) {
        let data = {
            code: 200,
            message: ''
        }
        let { bucket_name, fileName } = param
        if(!bucket_name || !fileName){
            data.code = 400
            data.message = '缺少参数'
        }
        let bucket:Bucket = await this.bucketRepository.createQueryBuilder("bucket")
                .leftJoinAndSelect("bucket.image_config", "image_config")
                .leftJoinAndSelect("bucket.audio_config", "audio_config")
                .leftJoinAndSelect("bucket.video_config", "video_config")
                .where("bucket.name = :name", { name: bucket_name })
                .getOne()
        if(!bucket){
            data.code = 401
            data.message = '指定空间不存在'
            return data
        }
        let file, obj
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
        if(data.code===400||data.code===402){
            return data
        }
        let { imagePreProcessString ,contentSecret , tagsString , md5  } = obj
        //对上传文件进行md5校验
        let pass = crypto.createVerify('md5').update(fs.readFileSync(file.path)).verify(null,md5)
        if(!pass){
            data.code = 403
            data.message = '文件md5校验失败'
            return data
        }
        await this.fileService.saveUploadFile(data,bucket,param,obj)

        return data
    }

}