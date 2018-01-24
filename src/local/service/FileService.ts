import { Component, Inject, forwardRef } from '@nestjs/common';
import { ImageProcessUtil } from '../util/ImageProcessUtil';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from './ConfigService'
import { Document } from '../model/Document'
import { KindUtil } from '../util/KindUtil'
import { Bucket } from '../model/Bucket';
import { Audio } from '../model/Audio';
import { Video } from '../model/Video';
import { Image } from '../model/Image';
import { Repository } from 'typeorm';
import { File } from '../model/File';
import * as crypto from 'crypto';
import { isArray } from 'util';


/* 文件Service*/
@Component()
export class FileService {

  constructor(
    private readonly kindUtil:KindUtil,
    private readonly imageProcessUtil:ImageProcessUtil,
    @InjectRepository(File) private readonly fileRepository: Repository<File>,
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
    @InjectRepository(Audio) private readonly audioRepository: Repository<Audio>,
    @InjectRepository(Video) private readonly videoRepository: Repository<Video>,   
    @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>){}


    saveUploadFile(data:{code:number,message:string},bucket:Bucket,param:any,obj:any){
        
    }
  }