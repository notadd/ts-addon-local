import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileResolver } from './graphql/resolver/FileResolver'
import { ConfigResolver } from './graphql/resolver/ConfigResolver'
import { ConfigService } from './service/ConfigService'
import { ImageProcessUtil } from './util/ImageProcessUtil'
import { KindUtil } from './util/KindUtil'
import { ImageConfig } from './model/ImageConfig';
import { AudioConfig } from './model/AudioConfig';
import { VideoConfig } from './model/VideoConfig';
import { Document } from './model/Document'
import { Bucket } from './model/Bucket';
import { Audio } from './model/Audio'
import { Video } from './model/Video'
import { Image } from './model/Image';
import { File} from './model/File'
const typeormOptions = require('./typeorm')

@Module({
  modules: [TypeOrmModule.forRoot([ImageConfig,AudioConfig,VideoConfig,Bucket,Image,File,Video,Audio,Document],typeormOptions)],  
  components: [ConfigResolver,ConfigService,FileResolver,KindUtil,ImageProcessUtil],
  exports:[]
})

export class LocalModule {}
