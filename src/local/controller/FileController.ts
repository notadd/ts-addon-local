import { Controller, Get, Post, Request, Response, Body, Param, Headers, Query } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { KindUtil } from '../util/KindUtil'
import { Document } from '../model/Document'
import { Bucket } from '../model/Bucket';
import { Audio } from '../model/Audio'
import { Video } from '../model/Video'
import { Image } from '../model/Image';
import { File } from '../model/File'
import * as  formidable from 'formidable'
import * as  path from 'path'
import * as fs from 'fs'
/*文件控制器，包含了文件下载、上传、访问功能
*/
@Controller('local/file')
export class FileController {

    constructor(
        private readonly kindUtil: KindUtil,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) {
    }

    /* 下载文件接口，文件路径在url中，文件存在直接返回，不存在返回错误码404 */
    @Get('/download/:bucket_name/:fileName')
    download( @Param() param , @Response() res){
        let {bucket_name , fileName} = param
        if(!bucket_name || !fileName){
            return {
                code:400,
                message:'缺少文件路径'
            }
        }
        let realPath = path.resolve(__dirname,'../','store',bucket_name,fileName)
        if(fs.existsSync(realPath)){
            res.download(realPath,fileName)
            return
        }
        return {
            code:404,
            message:'请求文件不存在'
        } 
    }

}