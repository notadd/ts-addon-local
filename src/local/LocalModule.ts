import { ConfigResolver } from './graphql/resolver/ConfigResolver';
import { StoreComponentProvider } from './export/StoreComponent';
import { FileResolver } from './graphql/resolver/FileResolver';
import { FileController } from './controller/FileController';
import { ImageProcessUtil } from './util/ImageProcessUtil';
import { ConfigService } from './service/ConfigService';
import { FileService } from './service/FileService';
import { ImageConfig } from './model/ImageConfig';
import { AudioConfig } from './model/AudioConfig';
import { VideoConfig } from './model/VideoConfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenUtil } from './util/TokenUtil';
import { Document } from './model/Document';
import { FileUtil } from './util/FileUtil';
import { KindUtil } from './util/KindUtil';
import { Module } from '@nestjs/common';
import { Bucket } from './model/Bucket';
import { Audio } from './model/Audio';
import { Video } from './model/Video';
import { Image } from './model/Image';
import { File } from './model/File';
const typeormOptions = require('./typeorm')

@Module({
  modules: [TypeOrmModule.forRoot([ImageConfig, AudioConfig, VideoConfig, Bucket, Image, File, Video, Audio, Document], typeormOptions)],
  controllers: [FileController],
  components: [ConfigResolver, ConfigService, FileResolver, FileService, KindUtil, FileUtil, TokenUtil, ImageProcessUtil, StoreComponentProvider],
  exports: [StoreComponentProvider]
})

export class LocalModule { }
