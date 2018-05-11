"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const store_component_provider_1 = require("./export/store.component.provider");
const common_1 = require("@nestjs/common");
const config_resolver_1 = require("./resolver/config.resolver");
const file_resolver_1 = require("./resolver/file.resolver");
const file_controller_1 = require("./controller/file.controller");
const image_process_util_1 = require("./util/image.process.util");
const audio_config_entity_1 = require("./model/audio.config.entity");
const image_config_entity_1 = require("./model/image.config.entity");
const video_config_entity_1 = require("./model/video.config.entity");
const config_service_1 = require("./service/config.service");
const file_service_1 = require("./service/file.service");
const document_entity_1 = require("./model/document.entity");
const typeorm_1 = require("@nestjs/typeorm");
const bucket_entity_1 = require("./model/bucket.entity");
const token_util_1 = require("./util/token.util");
const audio_entity_1 = require("./model/audio.entity");
const image_entity_1 = require("./model/image.entity");
const video_entity_1 = require("./model/video.entity");
const file_util_1 = require("./util/file.util");
const kind_util_1 = require("./util/kind.util");
const file_entity_1 = require("./model/file.entity");
const path = require("path");
let LocalModule = class LocalModule {
    constructor(fileUtil) {
        this.fileUtil = fileUtil;
    }
    onModuleInit() {
        return __awaiter(this, void 0, void 0, function* () {
            const storages = path.resolve(process.cwd(), "storages");
            const local = path.resolve(process.cwd(), "storages", "local");
            const temp = path.resolve(process.cwd(), "storages", "local", "temp");
            if (!this.fileUtil.exist(storages)) {
                yield this.fileUtil.mkdir(storages);
            }
            if (!this.fileUtil.exist(local)) {
                yield this.fileUtil.mkdir(local);
            }
            if (!this.fileUtil.exist(temp)) {
                yield this.fileUtil.mkdir(temp);
            }
        });
    }
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
    }),
    __param(0, common_1.Inject(file_util_1.FileUtil)),
    __metadata("design:paramtypes", [file_util_1.FileUtil])
], LocalModule);
exports.LocalModule = LocalModule;

//# sourceMappingURL=local.module.js.map
