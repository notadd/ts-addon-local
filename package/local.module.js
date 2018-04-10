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
const file_controller_1 = require("./controller/file.controller");
const store_component_provider_1 = require("./export/store.component.provider");
const config_resolver_1 = require("./graphql/resolver/config.resolver");
const file_resolver_1 = require("./graphql/resolver/file.resolver");
const audio_entity_1 = require("./model/audio.entity");
const audio_config_entity_1 = require("./model/audio.config.entity");
const bucket_entity_1 = require("./model/bucket.entity");
const document_entity_1 = require("./model/document.entity");
const file_entity_1 = require("./model/file.entity");
const image_entity_1 = require("./model/image.entity");
const image_config_entity_1 = require("./model/image.config.entity");
const video_entity_1 = require("./model/video.entity");
const video_config_entity_1 = require("./model/video.config.entity");
const config_service_1 = require("./service/config.service");
const file_service_1 = require("./service/file.service");
const file_util_1 = require("./util/file.util");
const image_process_util_1 = require("./util/image.process.util");
const kind_util_1 = require("./util/kind.util");
const token_util_1 = require("./util/token.util");
let LocalModule = class LocalModule {
};
LocalModule = __decorate([
    common_1.Global(),
    common_1.Module({
        modules: [
            typeorm_1.TypeOrmModule.forFeature([
                bucket_entity_1.Bucket,
                image_config_entity_1.ImageConfig,
                audio_config_entity_1.AudioConfig,
                video_config_entity_1.VideoConfig,
                file_entity_1.File,
                document_entity_1.Document,
                audio_entity_1.Audio,
                video_entity_1.Video,
                image_entity_1.Image,
            ]),
        ],
        controllers: [
            file_controller_1.FileController,
        ],
        components: [
            config_resolver_1.ConfigResolver,
            config_service_1.ConfigService,
            file_resolver_1.FileResolver,
            file_service_1.FileService,
            kind_util_1.KindUtil,
            file_util_1.FileUtil,
            token_util_1.TokenUtil,
            image_process_util_1.ImageProcessUtil,
            store_component_provider_1.StoreComponentProvider,
        ],
        exports: [
            store_component_provider_1.StoreComponentProvider,
        ],
    })
], LocalModule);
exports.LocalModule = LocalModule;
