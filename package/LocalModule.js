"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const FileController_1 = require("./controller/FileController");
const StoreComponentProvider_1 = require("./export/StoreComponentProvider");
const ConfigResolver_1 = require("./graphql/resolver/ConfigResolver");
const FileResolver_1 = require("./graphql/resolver/FileResolver");
const Audio_entity_1 = require("./model/Audio.entity");
const AudioConfig_entity_1 = require("./model/AudioConfig.entity");
const Bucket_entity_1 = require("./model/Bucket.entity");
const Document_entity_1 = require("./model/Document.entity");
const File_entity_1 = require("./model/File.entity");
const Image_entity_1 = require("./model/Image.entity");
const ImageConfig_entity_1 = require("./model/ImageConfig.entity");
const Video_entity_1 = require("./model/Video.entity");
const VideoConfig_entity_1 = require("./model/VideoConfig.entity");
const ConfigService_1 = require("./service/ConfigService");
const FileService_1 = require("./service/FileService");
const FileUtil_1 = require("./util/FileUtil");
const ImageProcessUtil_1 = require("./util/ImageProcessUtil");
const KindUtil_1 = require("./util/KindUtil");
const TokenUtil_1 = require("./util/TokenUtil");
let LocalModule = class LocalModule {
};
LocalModule = __decorate([
    common_1.Global(),
    common_1.Module({
        modules: [
            typeorm_1.TypeOrmModule.forFeature([
                Bucket_entity_1.Bucket,
                ImageConfig_entity_1.ImageConfig,
                AudioConfig_entity_1.AudioConfig,
                VideoConfig_entity_1.VideoConfig,
                File_entity_1.File,
                Document_entity_1.Document,
                Audio_entity_1.Audio,
                Video_entity_1.Video,
                Image_entity_1.Image,
            ]),
        ],
        controllers: [
            FileController_1.FileController,
        ],
        components: [
            ConfigResolver_1.ConfigResolver,
            ConfigService_1.ConfigService,
            FileResolver_1.FileResolver,
            FileService_1.FileService,
            KindUtil_1.KindUtil,
            FileUtil_1.FileUtil,
            TokenUtil_1.TokenUtil,
            ImageProcessUtil_1.ImageProcessUtil,
            StoreComponentProvider_1.StoreComponentProvider,
        ],
        exports: [
            StoreComponentProvider_1.StoreComponentProvider,
        ],
    })
], LocalModule);
exports.LocalModule = LocalModule;
