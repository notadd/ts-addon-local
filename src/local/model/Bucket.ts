import { Entity, Column, PrimaryColumn, Index, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { ImageConfig } from './ImageConfig'
import { AudioConfig } from './AudioConfig'
import { VideoConfig } from './VideoConfig'
import { Document } from './Document'
import { Image } from './Image'
import { Video } from './Video'
import { Audio } from './Audio'
import { File } from './File'

@Entity({
  name: 'bucket'
})
export class Bucket {

  //主键，需要设置插入，1默认为公有空间配置，2默认为私有空间配置
  @PrimaryColumn({
    name: 'id',
    type: 'int'
  })
  id: number;

  //公有还是私有空间，值为public、private
  @Column({
    name: 'public_or_private',
    type: 'varchar',
    length: 20,
    nullable: false,
    unique: true
  })
  public_or_private: string;


  //此空间下所有文件都存储于这个目录里,与虚拟目录无关
  @Column({
    name: 'directory',
    type: 'varchar',
    length: 20,
    nullable: false
  })
  directory: string;

  //token密钥
  @Column({
    name: 'token_secret_key',
    type: 'varchar',
    length: 250,
    nullable: true
  })
  token_secret_key: string;

  //token过期时间，单位秒
  @Column({
    name: 'token_expire',
    type: 'int',
    nullable: true
  })
  token_expire: number;

  @OneToOne(type => ImageConfig,{
    cascadeInsert: true,
    cascadeUpdate: true,
    cascadeRemove: true,
    lazy: false
  })
  @JoinColumn()
  image_config: ImageConfig;

  @OneToOne(type =>AudioConfig,audioConfig=>audioConfig.bucket,{
    cascadeInsert: true,
    cascadeUpdate: true,
    cascadeRemove: true,
    lazy: false
  })
  @JoinColumn()
  audio_config: AudioConfig;

  @OneToOne(type => VideoConfig,{
    cascadeInsert: true,
    cascadeUpdate: true,
    cascadeRemove: true,
    lazy: false
  })
  @JoinColumn()
  video_config: VideoConfig;


  @OneToMany(type => File, file => file.bucket, {
    cascadeInsert: true,
    cascadeUpdate: true,
    lazy: true
  })
  files: Promise<File[]>;

  @OneToMany(type => Image, image => image.bucket, {
    cascadeInsert: true,
    cascadeUpdate: true,
    lazy: true
  })
  images: Promise<Image[]>;

  @OneToMany(type => Audio, audio=> audio.bucket, {
    cascadeInsert: true,
    cascadeUpdate: true,
    lazy: true
  })
  audios: Promise<Audio[]>;

  @OneToMany(type => Video, video => video.bucket, {
    cascadeInsert: true,
    cascadeUpdate: true,
    lazy: true
  })
  videos:Promise<Video[]>;

  @OneToMany(type => Document, document => document.bucket, {
    cascadeInsert: true,
    cascadeUpdate: true,
    lazy: true
  })
  documents:Promise<Document[]>;
}