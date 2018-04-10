import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileController } from "./controller/file.controller";
import { StoreComponentProvider } from "./export/store.component.provider";
import { ConfigResolver } from "./graphql/resolver/config.resolver";
import { FileResolver } from "./graphql/resolver/file.resolver";
import { Audio } from "./model/audio.entity";
import { AudioConfig } from "./model/audio.config.entity";
import { Bucket } from "./model/bucket.entity";
import { Document } from "./model/document.entity";
import { File } from "./model/file.entity";
import { Image } from "./model/image.entity";
import { ImageConfig } from "./model/image.config.entity";
import { Video } from "./model/video.entity";
import { VideoConfig } from "./model/video.config.entity";
import { ConfigService } from "./service/config.service";
import { FileService } from "./service/file.service";
import { FileUtil } from "./util/file.util";
import { ImageProcessUtil } from "./util/image.process.util";
import { KindUtil } from "./util/kind.util";
import { TokenUtil } from "./util/token.util";

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
