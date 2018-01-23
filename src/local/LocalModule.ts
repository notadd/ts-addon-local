import { ConfigResolver } from './graphql/resolver/ConfigResolver'
import { FileResolver } from './graphql/resolver/FileResolver'
import { FileController } from './controller/FileController'
import { ImageProcessUtil } from './util/ImageProcessUtil'
import { ConfigService } from './service/ConfigService'
import { ImageConfig } from './model/ImageConfig';
import { AudioConfig } from './model/AudioConfig';
import { VideoConfig } from './model/VideoConfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KindUtil } from './util/KindUtil'
import { Module } from '@nestjs/common';
import { Document } from './model/Document'
import { Bucket } from './model/Bucket';
import { Audio } from './model/Audio'
import { Video } from './model/Video'
import { Image } from './model/Image';
import { File} from './model/File'
const typeormOptions = require('./typeorm')


@Module({
  modules: [TypeOrmModule.forRoot([ImageConfig,AudioConfig,VideoConfig,Bucket,Image,File,Video,Audio,Document],typeormOptions)],  
  controllers:[FileController],
  components: [ConfigResolver,ConfigService,FileResolver,KindUtil,ImageProcessUtil],
  exports:[ConfigResolver,ConfigService,FileResolver,KindUtil,ImageProcessUtil]
})

export class LocalModule {}
