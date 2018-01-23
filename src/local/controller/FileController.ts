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



}