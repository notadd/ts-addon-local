import { InjectRepository } from '@nestjs/typeorm'
import { BucketConfig } from '../interface/config/BucketConfig'
import { ImageFormat } from '../interface/config/ImageFormat'
import { Component } from '@nestjs/common'
import { Repository } from 'typeorm'
import { ImageConfig } from '../model/ImageConfig';
import { AudioConfig } from '../model/AudioConfig';
import { VideoConfig } from '../model/VideoConfig';
import { Bucket } from '../model/Bucket';
import { Image } from '../model/Image';
import * as  crypto from 'crypto'
import * as  path from 'path'
import * as  fs from 'fs'

@Component()
export class ConfigService {

  private readonly image_format: Set<String>
  private readonly audio_format: Set<String>
  private readonly video_format: Set<String>
  private readonly video_resolution: Set<String>

  constructor(
    @InjectRepository(Image) private readonly imageRepository: Repository<Image>,
    @InjectRepository(Bucket) private readonly bucketRepository: Repository<Bucket>,
    @InjectRepository(ImageConfig) private readonly imageConfigRepository: Repository<ImageConfig>,
    @InjectRepository(AudioConfig) private readonly audioConfigRepository: Repository<AudioConfig>,
    @InjectRepository(VideoConfig) private readonly videoConfigRepository: Repository<VideoConfig>
  ) {
    this.image_format = new Set(['raw', 'webp_damage', 'webp_undamage'])
    this.audio_format = new Set(['raw', 'mp3', 'aac'])
    this.video_format = new Set(['raw', 'vp9', 'h264', 'h265'])
    this.video_resolution = new Set(['raw', 'p1080', 'p720', 'p480'])
  }

  async saveBucketConfig(data: any, body: BucketConfig) {
    let exist: Bucket
    let newBucket: any = {
      directory: body.directory,
    }
    let directory_path = path.resolve(__dirname, '../', 'store', body.directory)
    if (body.isPublic) {
      exist = await this.bucketRepository.findOneById(1)
    } else {
      exist = await this.bucketRepository.findOneById(2)
      newBucket.token_expire = +body.token_expire
      newBucket.token_secret_key = body.token_secret_key
    }
    if (exist) {
      try {
        await this.bucketRepository.updateById(exist.id, newBucket)
        //创建新目录，暂定不删除旧目录
        if (!fs.existsSync(directory_path)) {
          fs.mkdirSync(directory_path)
        }
        data.code = 200
        data.message = '空间配置更新成功'
      } catch (err) {
        data.code = 401
        data.message = '空间配置更新失败' + err.toString()
      }
      return exist
    }
    let bucket: Bucket = new Bucket()
    let audio_config: AudioConfig = new AudioConfig()
    let video_config: VideoConfig = new VideoConfig()
    let image_config: ImageConfig = new ImageConfig()
    if (body.isPublic) {
      bucket.id = 1
      bucket.public_or_private = 'public'
    } else {
      bucket.id = 2
      bucket.public_or_private = 'private'
      bucket.token_expire = +body.token_expire
      bucket.token_secret_key = body.token_secret_key
    }
    bucket.directory = body.directory
    audio_config.id = bucket.id
    video_config.id = bucket.id
    image_config.id = bucket.id
    bucket.audio_config = audio_config
    bucket.video_config = video_config
    bucket.image_config = image_config
    try {
      await this.bucketRepository.save(bucket)
      if (!fs.existsSync(directory_path)) {
        fs.mkdirSync(directory_path)
      }
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

  async saveImageFormat(data: any, body: ImageFormat): Promise<any> {
    let { format } = body
    format = format.toLowerCase()
    if (!this.image_format.has(format)) {
      data.code = 401
      data.message = '保存格式不正确'
      return
    }
    let buckets: Bucket[] = await this.bucketRepository.find({ relations: ["image_config"] })
    if (buckets.length !== 2) {
      data.code = 402
      data.message = '空间配置不存在'
      return
    }
    try {
      await buckets.forEach(async (bucket) => {
        await this.imageConfigRepository.updateById(bucket.image_config.id, { format })
      })
      data.code = 200
      data.message = '图片保存格式配置成功'
      return
    } catch (err) {
      data.code = 403
      data.message = '图片保存格式配置失败' + err.toString()
      return
    }
  }


}