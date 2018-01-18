import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from './model/Document'
import { ImageConfig } from './model/ImageConfig';
import { AudioConfig } from './model/AudioConfig';
import { VideoConfig } from './model/VideoConfig';
import { Bucket } from './model/Bucket';
import { Audio } from './model/Audio'
import { Video } from './model/Video'
import { Image } from './model/Image';
import { File} from './model/File'
const typeormOptions = require('./typeorm')

@Module({
  modules: [TypeOrmModule.forRoot([ImageConfig,AudioConfig,VideoConfig,Bucket,Image,File,Video,Audio,Document],typeormOptions)],  
  controllers: [],
  components: [],
  exports:[]
})

export class LocalModule {}
