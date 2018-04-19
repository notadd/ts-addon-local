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
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audio_entity_1 = require("../model/audio.entity");
const bucket_entity_1 = require("../model/bucket.entity");
const file_entity_1 = require("../model/file.entity");
const image_entity_1 = require("../model/image.entity");
const video_entity_1 = require("../model/video.entity");
const image_process_util_1 = require("../util/image.process.util");
const kind_util_1 = require("../util/kind.util");
const token_util_1 = require("../util/token.util");
let FileService = class FileService {
    constructor(kindUtil, tokenUtil, imageProcessUtil, fileRepository, imageRepository, audioRepository, videoRepository, bucketRepository) {
        this.kindUtil = kindUtil;
        this.tokenUtil = tokenUtil;
        this.imageProcessUtil = imageProcessUtil;
        this.fileRepository = fileRepository;
        this.imageRepository = imageRepository;
        this.audioRepository = audioRepository;
        this.videoRepository = videoRepository;
        this.bucketRepository = bucketRepository;
    }
    saveUploadFile(bucket, file, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const { imagePreProcessString, contentSecret, tagsString, md5, bucketName, rawName } = obj;
            let imageProcessInfo = {}, tags = {};
            try {
                if (tagsString) {
                    tags = JSON.parse(tagsString);
                }
                if (imagePreProcessString) {
                    imageProcessInfo = JSON.parse(imagePreProcessString);
                    if (bucket.imageConfig.format === "webp_damage") {
                        imageProcessInfo.format = "webp";
                        imageProcessInfo.lossless = false;
                    }
                    else if (bucket.imageConfig.format === "webp_undamage") {
                        imageProcessInfo.format = "webp";
                        imageProcessInfo.lossless = true;
                    }
                    else {
                        imageProcessInfo.format = undefined;
                        imageProcessInfo.lossless = undefined;
                    }
                }
            }
            catch (err) {
                throw new common_1.HttpException("JSON解析错误:" + err.toString(), 405);
            }
            const metadata = yield this.imageProcessUtil.processAndStore(file.path, bucket, imageProcessInfo);
            const type = rawName.substring(rawName.lastIndexOf(".") + 1);
            const kind = this.kindUtil.getKind(type);
            if (kind === "image") {
                const exist = yield this.imageRepository.findOne({ name: metadata.name, bucketId: bucket.id });
                if (exist) {
                    return "/local/file/visit/" + bucket.name + "/" + exist.name + "." + exist.type;
                }
                const image = new image_entity_1.Image();
                image.bucket = bucket;
                image.rawName = file.name;
                image.name = metadata.name;
                image.size = metadata.size;
                image.type = metadata.format;
                image.width = metadata.width;
                image.height = metadata.height;
                if (tags) {
                    image.tags = tags;
                }
                if (contentSecret) {
                    image.contentSecret = contentSecret;
                }
                try {
                    yield this.imageRepository.save(image);
                }
                catch (err) {
                    throw new common_1.HttpException("文件保存到数据库失败:" + err.toString(), 406);
                }
                return "/local/file/visit/" + bucket.name + "/" + image.name + "." + image.type;
            }
            else {
            }
        });
    }
    getAll(data, bucket) {
        return __awaiter(this, void 0, void 0, function* () {
            data.files = yield bucket.files;
            data.images = yield bucket.images;
            data.audios = yield bucket.audios;
            data.videos = yield bucket.videos;
            data.documents = yield bucket.documents;
            const tokenUtil = this.tokenUtil;
            const addUrl = (value) => __awaiter(this, void 0, void 0, function* () {
                value.url = "/" + bucket.name + "/" + value.name + "." + value.type;
                if (bucket.publicOrPrivate === "private") {
                    value.url += "?token=" + (yield tokenUtil.getToken(data.baseUrl + value.url, bucket));
                }
            });
            yield data.files.forEach(addUrl);
            yield data.images.forEach(addUrl);
            yield data.audios.forEach(addUrl);
            yield data.videos.forEach(addUrl);
            yield data.documents.forEach(addUrl);
            return;
        });
    }
};
FileService = __decorate([
    common_1.Component(),
    __param(0, common_1.Inject(kind_util_1.KindUtil)),
    __param(1, common_1.Inject(token_util_1.TokenUtil)),
    __param(2, common_1.Inject(image_process_util_1.ImageProcessUtil)),
    __param(3, typeorm_1.InjectRepository(file_entity_1.File)),
    __param(4, typeorm_1.InjectRepository(image_entity_1.Image)),
    __param(5, typeorm_1.InjectRepository(audio_entity_1.Audio)),
    __param(6, typeorm_1.InjectRepository(video_entity_1.Video)),
    __param(7, typeorm_1.InjectRepository(bucket_entity_1.Bucket)),
    __metadata("design:paramtypes", [kind_util_1.KindUtil,
        token_util_1.TokenUtil,
        image_process_util_1.ImageProcessUtil,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FileService);
exports.FileService = FileService;

//# sourceMappingURL=file.service.js.map
