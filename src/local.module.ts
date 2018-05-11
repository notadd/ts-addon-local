import { StoreComponentProvider } from "./export/store.component.provider";
import { Global, Module, OnModuleInit, Inject } from "@nestjs/common";
import { ConfigResolver } from "./resolver/config.resolver";
import { FileResolver } from "./resolver/file.resolver";
import { FileController } from "./controller/file.controller";
import { ImageProcessUtil } from "./util/image.process.util";
import { AudioConfig } from "./model/audio.config.entity";
import { ImageConfig } from "./model/image.config.entity";
import { VideoConfig } from "./model/video.config.entity";
import { ConfigService } from "./service/config.service";
import { FileService } from "./service/file.service";
import { Document } from "./model/document.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Bucket } from "./model/bucket.entity";
import { TokenUtil } from "./util/token.util";
import { Audio } from "./model/audio.entity";
import { Image } from "./model/image.entity";
import { Video } from "./model/video.entity";
import { FileUtil } from "./util/file.util";
import { KindUtil } from "./util/kind.util";
import { File } from "./model/file.entity";
import * as path from "path";

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
export class LocalModule implements OnModuleInit {

    constructor(@Inject(FileUtil) private readonly fileUtil: FileUtil) { }

    async onModuleInit() {
        const storages: string = path.resolve(process.cwd(), "storages");
        const local: string = path.resolve(process.cwd(), "storages", "local");
        const temp: string = path.resolve(process.cwd(), "storages", "local", "temp");
        if (!this.fileUtil.exist(storages)) {
            await this.fileUtil.mkdir(storages);
        }
        if (!this.fileUtil.exist(local)) {
            await this.fileUtil.mkdir(local);
        }
        if (!this.fileUtil.exist(temp)) {
            await this.fileUtil.mkdir(temp);
        }
    }
}
