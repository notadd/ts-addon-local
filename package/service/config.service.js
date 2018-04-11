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
const path = require("path");
const typeorm_2 = require("typeorm");
const audio_config_entity_1 = require("../model/audio.config.entity");
const bucket_entity_1 = require("../model/bucket.entity");
const image_entity_1 = require("../model/image.entity");
const image_config_entity_1 = require("../model/image.config.entity");
const video_config_entity_1 = require("../model/video.config.entity");
const file_util_1 = require("../util/file.util");
const image_process_util_1 = require("../util/image.process.util");
let ConfigService = class ConfigService {
    constructor(fileUtil, imageProcessUtil, imageRepository, bucketRepository, imageConfigRepository, audioConfigRepository, videoConfigRepository) {
        this.fileUtil = fileUtil;
        this.imageProcessUtil = imageProcessUtil;
        this.imageRepository = imageRepository;
        this.bucketRepository = bucketRepository;
        this.imageConfigRepository = imageConfigRepository;
        this.audioConfigRepository = audioConfigRepository;
        this.videoConfigRepository = videoConfigRepository;
    }
    saveBucketConfig(body) {
        return __awaiter(this, void 0, void 0, function* () {
            let exist;
            const newBucket = {
                name: body.name,
            };
            const directoryPath = path.resolve(__dirname, "../", "store", body.name);
            if (body.isPublic) {
                exist = yield this.bucketRepository.findOneById(1);
            }
            else {
                exist = yield this.bucketRepository.findOneById(2);
                newBucket.tokenExpire = Number.parseInt(body.tokenExpire);
                newBucket.tokenSecretKey = body.tokenSecretKey;
            }
            if (exist) {
                try {
                    yield this.bucketRepository.updateById(exist.id, newBucket);
                    if (!this.fileUtil.exist(directoryPath)) {
                        yield this.fileUtil.mkdir(directoryPath);
                    }
                }
                catch (err) {
                    throw new common_1.HttpException("空间配置更新失败" + err.toString(), 410);
                }
                return;
            }
            const bucket = new bucket_entity_1.Bucket();
            const audioConfig = new audio_config_entity_1.AudioConfig();
            const videoConfig = new video_config_entity_1.VideoConfig();
            const imageConfig = new image_config_entity_1.ImageConfig();
            if (body.isPublic) {
                bucket.id = 1;
                bucket.publicOrPrivate = "public";
            }
            else {
                bucket.id = 2;
                bucket.publicOrPrivate = "private";
                bucket.tokenExpire = +body.tokenExpire;
                bucket.tokenSecretKey = body.tokenSecretKey;
            }
            bucket.name = body.name;
            audioConfig.id = bucket.id;
            videoConfig.id = bucket.id;
            imageConfig.id = bucket.id;
            bucket.audioConfig = audioConfig;
            bucket.videoConfig = videoConfig;
            bucket.imageConfig = imageConfig;
            try {
                yield this.bucketRepository.save(bucket);
                if (!this.fileUtil.exist(directoryPath)) {
                    yield this.fileUtil.mkdir(directoryPath);
                }
            }
            catch (err) {
                throw new common_1.HttpException("空间保存失败" + err.toString(), 410);
            }
        });
    }
    saveImageFormat(body) {
        return __awaiter(this, void 0, void 0, function* () {
            let { format } = body;
            format = format.toLowerCase();
            const buckets = yield this.bucketRepository.find({ relations: ["imageConfig"] });
            if (buckets.length !== 2) {
                throw new common_1.HttpException("空间配置不存在", 401);
            }
            try {
                yield buckets.forEach((bucket) => __awaiter(this, void 0, void 0, function* () {
                    yield this.imageConfigRepository.updateById(bucket.imageConfig.id, { format });
                }));
            }
            catch (err) {
                throw new common_1.HttpException("图片保存格式更新失败" + err.toString(), 410);
            }
        });
    }
    saveEnableImageWatermark(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const buckets = yield this.bucketRepository.find({ relations: ["imageConfig"] });
            if (buckets.length !== 2) {
                throw new common_1.HttpException("空间配置不存在", 401);
            }
            let watermarkEnable;
            if (body.enable) {
                watermarkEnable = 1;
            }
            else {
                watermarkEnable = 0;
            }
            try {
                yield buckets.forEach((bucket) => __awaiter(this, void 0, void 0, function* () {
                    yield this.imageConfigRepository.updateById(bucket.imageConfig.id, { watermarkEnable });
                }));
            }
            catch (err) {
                throw new common_1.HttpException("水印启用更新失败" + err.toString(), 410);
            }
        });
    }
    saveImageWatermark(file, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            const buckets = yield this.bucketRepository.find({ relations: ["imageConfig"] });
            if (buckets.length !== 2) {
                throw new common_1.HttpException("空间配置不存在", 401);
            }
            for (let i = 0; i < buckets.length; i++) {
                let metadata = {};
                const format = buckets[i].imageConfig.format || "raw";
                if (format === "raw") {
                    metadata = yield this.imageProcessUtil.processAndStore(file.path, buckets[i], {
                        strip: true,
                        watermark: false
                    });
                }
                else if (format === "webp_damage") {
                    metadata = yield this.imageProcessUtil.processAndStore(file.path, buckets[i], {
                        format: "webp",
                        strip: true,
                        watermark: false
                    });
                }
                else if (format === "webp_undamage") {
                    metadata = yield this.imageProcessUtil.processAndStore(file.path, buckets[i], {
                        format: "webp",
                        lossless: true,
                        strip: true,
                        watermark: false
                    });
                }
                const image = new image_entity_1.Image();
                image.bucket = buckets[i];
                image.rawName = file.name;
                image.name = metadata.name;
                image.type = metadata.format;
                image.width = metadata.width;
                image.height = metadata.height;
                image.size = metadata.size;
                const isExist = yield this.imageRepository.findOne({ name: metadata.name, bucketId: buckets[i].id });
                if (!isExist) {
                    try {
                        yield this.imageRepository.save(image);
                    }
                    catch (err) {
                        yield this.fileUtil.delete(path.resolve(__dirname, "../", "store", buckets[i].name, image.name + "." + image.type));
                        throw new common_1.HttpException("水印图片保存失败" + err.toString(), 410);
                    }
                }
                try {
                    yield this.imageConfigRepository.updateById(buckets[i].imageConfig.id, {
                        watermarkSaveKey: "/store/" + buckets[i].name + "/" + image.name + "." + image.type,
                        watermarkGravity: obj.gravity,
                        watermarkOpacity: obj.opacity,
                        watermarkWs: obj.ws,
                        watermarkX: obj.x,
                        watermarkY: obj.y
                    });
                }
                catch (err) {
                    throw new common_1.HttpException("图片水印更新失败" + err.toString(), 410);
                }
            }
            yield this.fileUtil.delete(file.path);
        });
    }
    saveAudioFormat(body) {
        return __awaiter(this, void 0, void 0, function* () {
            let { format } = body;
            format = format.toLowerCase();
            const buckets = yield this.bucketRepository.find({ relations: ["audioConfig"] });
            if (buckets.length !== 2) {
                throw new common_1.HttpException("空间配置不存在", 401);
            }
            try {
                yield buckets.forEach((bucket) => __awaiter(this, void 0, void 0, function* () {
                    yield this.audioConfigRepository.updateById(bucket.audioConfig.id, { format });
                }));
            }
            catch (err) {
                throw new common_1.HttpException("音频保存格式更新失败" + err.toString(), 410);
            }
        });
    }
    saveVideoFormat(body) {
        return __awaiter(this, void 0, void 0, function* () {
            let { format, resolution } = body;
            format = format.toLowerCase();
            resolution = resolution.toLowerCase();
            const buckets = yield this.bucketRepository.find({ relations: ["videoConfig"] });
            if (buckets.length !== 2) {
                throw new common_1.HttpException("空间配置不存在", 401);
            }
            try {
                yield buckets.forEach((bucket) => __awaiter(this, void 0, void 0, function* () {
                    yield this.videoConfigRepository.updateById(bucket.videoConfig.id, { format, resolution });
                }));
            }
            catch (err) {
                throw new common_1.HttpException("视频保存格式更新失败" + err.toString(), 410);
            }
        });
    }
};
ConfigService = __decorate([
    common_1.Component(),
    __param(0, common_1.Inject(file_util_1.FileUtil)),
    __param(1, common_1.Inject(image_process_util_1.ImageProcessUtil)),
    __param(2, typeorm_1.InjectRepository(image_entity_1.Image)),
    __param(3, typeorm_1.InjectRepository(bucket_entity_1.Bucket)),
    __param(4, typeorm_1.InjectRepository(image_config_entity_1.ImageConfig)),
    __param(5, typeorm_1.InjectRepository(audio_config_entity_1.AudioConfig)),
    __param(6, typeorm_1.InjectRepository(video_config_entity_1.VideoConfig)),
    __metadata("design:paramtypes", [file_util_1.FileUtil,
        image_process_util_1.ImageProcessUtil,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ConfigService);
exports.ConfigService = ConfigService;
