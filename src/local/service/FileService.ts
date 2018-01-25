import { ImagePostProcessInfo, ImagePreProcessInfo } from '../interface/file/ImageProcessInfo';
import { ImageMetadata } from '../interface/file/ImageMetadata';
import { Component, Inject, forwardRef } from '@nestjs/common';
import { ImageProcessUtil } from '../util/ImageProcessUtil';
import { UploadFile } from '../interface/file/UploadFile';
import { UploadForm } from '../interface/file/UploadForm';
import { PathParam } from '../interface/file/PathParam';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonData } from '../interface/Common';
import { ConfigService } from './ConfigService';
import { TokenUtil } from '../util/TokenUtil';
import { Document } from '../model/Document';
import { KindUtil } from '../util/KindUtil';
import { Bucket } from '../model/Bucket';
import { Audio } from '../model/Audio';
import { Video } from '../model/Video';
import { Image } from '../model/Image';
import { Repository } from 'typeorm';
import { File } from '../model/File';
import * as crypto from 'crypto';
import { isArray } from 'util';
import * as path from 'path';


/* 文件Service*/
@Component()
export class FileService {

    constructor(
        private readonly kindUtil: KindUtil,
        private readonly tokenUtil: TokenUtil,
        private readonly imageProcessUtil: ImageProcessUtil,
        @InjectRepository(File) private readonly fileRepository: Repository<File>,
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Audio) private readonly audioRepository: Repository<Audio>,
        @InjectRepository(Video) private readonly videoRepository: Repository<Video>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>) { }


    async saveUploadFile(data: CommonData, bucket: Bucket, file: UploadFile, obj: UploadForm): Promise<void> {
        let { imagePreProcessString, contentSecret, tagsString, md5 ,bucket_name, fileName} = obj
        let imageProcessInfo: ImagePreProcessInfo, tags: string[]
        try {
            if (tagsString) {
                tags = JSON.parse(tagsString)
            }
            if (imagePreProcessString) {
                imageProcessInfo = JSON.parse(imagePreProcessString)
                if (bucket.image_config.format === 'webp_damage') {
                    (imageProcessInfo as ImagePostProcessInfo).format = 'webp'
                } else if (bucket.image_config.format === 'webp_undamage') {
                    //这样写。后面需要分号
                    (imageProcessInfo as ImagePostProcessInfo).format = 'webp';
                    (imageProcessInfo as ImagePostProcessInfo).lossless = true
                } else {
                    //原图情况下不管
                }
            }
        } catch (err) {
            data.code = 406
            data.message = 'JSON解析错误' + err.toString()
            return
        }
        //默认情况下，上传文件都会进行处理保存，如果处理后得到的文件名(sha256)已存在，会覆盖源文件
        let metadata: ImageMetadata = await this.imageProcessUtil.processAndStore(data, file.path, bucket, imageProcessInfo)
        let type: string = fileName.substring(fileName.lastIndexOf('.') + 1)
        let kind: string = this.kindUtil.getKind(type)
        if (kind === 'image') {
            let exist: Image = await this.imageRepository.findOne({ name: metadata.name, bucketId: bucket.id })
            //如果处理后得到文件已存在，不保存，正确返回
            if (exist) {
                data.code = 200
                data.message = '文件已经存在'
                return
            }
            //不存在，保存处理后文件
            let image: Image = new Image()
            image.bucket = bucket
            image.raw_name = file.name
            image.name = metadata.name
            image.size = metadata.size
            image.type = metadata.format
            image.width = metadata.width
            image.height = metadata.height
            image.absolute_path = path.resolve(__dirname, '../', 'store', bucket.name, metadata.name + '.' + metadata.format)
            if (tags) {
                image.tags = tags
            }
            if (contentSecret) {
                image.content_secret = contentSecret
            }
            try {
                await this.imageRepository.save(image)
                data.code = 200
                data.message = '上传图片保存成功'
            } catch (err) {
                data.code = 405
                data.message = '上传文件保存失败'
            }
            return
        } else {
            //暂时不支持其他种类文件
        }
    }

    async getAll(data:any,bucket:Bucket){
        data.files = await bucket.files
        data.images = await bucket.images
        data.audios  = await bucket.audios
        data.videos = await bucket.videos
        data.documents = await bucket.documents
       
        let tokenUtil = this.tokenUtil
        let addUrl = async function (value){
          value.url = '/'+bucket.name+'/'+value.name+'.'+value.type
          if(bucket.public_or_private==='private'){
            value.url+='?token='+await tokenUtil.getToken(data.baseUrl+value.url,bucket)
          }
        }
        await data.files.forEach(addUrl)
        await data.images.forEach(addUrl)
        await data.audios.forEach(addUrl)
        await data.videos.forEach(addUrl)
        await data.documents.forEach(addUrl)
        return 
      }
}