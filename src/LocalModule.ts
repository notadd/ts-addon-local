import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './controller/FileController';
import { StoreComponentProvider } from './export/StoreComponentProvider';
import { ConfigResolver } from './graphql/resolver/ConfigResolver';
import { FileResolver } from './graphql/resolver/FileResolver';
import { Audio } from './model/Audio.entity';
import { AudioConfig } from './model/AudioConfig.entity';
import { Bucket } from './model/Bucket.entity';
import { Document } from './model/Document.entity';
import { File } from './model/File.entity';
import { Image } from './model/Image.entity';
import { ImageConfig } from './model/ImageConfig.entity';
import { Video } from './model/Video.entity';
import { VideoConfig } from './model/VideoConfig.entity';
import { ConfigService } from './service/ConfigService';
import { FileService } from './service/FileService';
import { FileUtil } from './util/FileUtil';
import { ImageProcessUtil } from './util/ImageProcessUtil';
import { KindUtil } from './util/KindUtil';
import { TokenUtil } from './util/TokenUtil';

@Global()
@Module({
    modules: [
        TypeOrmModule.forFeature([
            Bucket,
            ImageConfig,
            AudioConfig,
            VideoConfig,
            File,
            Document,
            Audio,
            Video,
            Image,
        ]),
    ],
    controllers: [
        FileController,
    ],
    components: [
        ConfigResolver,
        ConfigService,
        FileResolver,
        FileService,
        KindUtil,
        FileUtil,
        TokenUtil,
        ImageProcessUtil,
        StoreComponentProvider,
    ],
    exports: [
        StoreComponentProvider,
    ],
})
export class LocalModule {
}
