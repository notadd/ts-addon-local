import { InjectRepository } from '@nestjs/typeorm'
import { Component } from '@nestjs/common'
import { Repository } from 'typeorm'
import { ImageConfig } from '../model/ImageConfig';
import { AudioConfig } from '../model/AudioConfig';
import { VideoConfig } from '../model/VideoConfig';
import { Bucket } from '../model/Bucket';
import { Image } from '../model/Image';
import * as  crypto from  'crypto'
import * as  fs   from 'fs'

@Component()
export class ConfigService{

    constructor(
        @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
        @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>,
        @InjectRepository(ImageConfig) private readonly imageConfigRepository: Repository<ImageConfig>,
        @InjectRepository(AudioConfig) private readonly audioConfigRepository: Repository<AudioConfig>,
        @InjectRepository(VideoConfig) private readonly videoConfigRepository: Repository<VideoConfig>
    ){}

    async saveBucketConfig(data,body){
        let exist: Bucket, newBucket:any = {
            directory: body.directory,
          }
          if (body.isPublic) {
            exist = await this.bucketRepository.findOneById(1)
          } else {
            exist = await this.bucketRepository.findOneById(2)
            newBucket.token_expire = +body.token_expire
            newBucket.token_secret_key = body.token_secret_key    }
          if (exist) {
            try {
              await this.bucketRepository.updateById(exist.id,newBucket)
              data.code = 200
              data.message = '空间配置更新成功'
            } catch (err) {
              data.code = 401
              data.message = '空间配置更新失败' + err.toString()
            }
            return exist
          }
          let bucket: Bucket = new Bucket()
          bucket.directory = body.directory
          let audio_config = new AudioConfig()
          let video_config = new VideoConfig()
          let image_config = new ImageConfig()
          if (body.isPublic) {
            bucket.id = 1
            bucket.public_or_private = 'public'
          } else {
            bucket.id = 2
            bucket.public_or_private = 'private'
            bucket.token_expire = +body.token_expire
            bucket.token_secret_key = body.token_secret_key
          }
          audio_config.id = bucket.id
          video_config.id = bucket.id
          image_config.id = bucket.id
          bucket.audio_config = audio_config
          bucket.video_config = video_config
          bucket.image_config = image_config
          try {
            await this.bucketRepository.save(bucket)
            data.code = 200
            data.message = '空间保存成功'
            return bucket
          } catch (err) {
            console.log(err)
            data.code = 401
            data.message = '空间保存失败' + err.toString()
            return null
          }
    }


}