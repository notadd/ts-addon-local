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
const exception_interceptor_1 = require("../interceptor/exception.interceptor");
const graphql_1 = require("@nestjs/graphql");
const config_service_1 = require("../service/config.service");
const typeorm_1 = require("@nestjs/typeorm");
const bucket_entity_1 = require("../model/bucket.entity");
const kind_util_1 = require("../util/kind.util");
const file_util_1 = require("../util/file.util");
const typeorm_2 = require("typeorm");
const express_1 = require("express");
const path = require("path");
let ConfigResolver = class ConfigResolver {
    constructor(fileUtil, kindUtil, configService, bucketRepository) {
        this.fileUtil = fileUtil;
        this.kindUtil = kindUtil;
        this.configService = configService;
        this.bucketRepository = bucketRepository;
        this._imageFormat = new Set(["raw", "webp_damage", "webp_undamage"]);
        this._audioFormat = new Set(["raw", "mp3", "aac"]);
        this._videoFormat = new Set(["raw", "vp9", "h264", "h265"]);
        this._videoResolution = new Set(["raw", "p1080", "p720", "p480"]);
        this.gravity = new Set(["northwest", "north", "northeast", "west", "center", "east", "southwest", "south", "southeast"]);
    }
    bucket(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const { isPublic, name, tokenExpire, tokenSecretKey } = body;
            if (isPublic === undefined || isPublic === null || !name) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            if (isPublic !== true && isPublic !== false) {
                throw new common_1.HttpException("isPublic参数不正确", 400);
            }
            if (!isPublic) {
                if (!tokenExpire || !tokenSecretKey) {
                    throw new common_1.HttpException("缺少参数", 400);
                }
                else if (tokenExpire < 0 || tokenExpire > 1800) {
                    throw new common_1.HttpException("token超时不正确", 400);
                }
            }
            yield this.configService.saveBucketConfig(body);
            return { code: 200, message: "空间配置保存成功" };
        });
    }
    imageFormat(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const format = body.format;
            if (format === undefined || format.length === 0) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            if (!this._imageFormat.has(format)) {
                throw new common_1.HttpException("保存格式不正确", 400);
            }
            yield this.configService.saveImageFormat(body);
            return { code: 200, message: "图片保存格式配置保存成功" };
        });
    }
    enableImageWatermark(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const enable = body.enable;
            if (enable === null || enable === undefined) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            if (enable !== true && enable !== false) {
                throw new common_1.HttpException("参数enable错误", 400);
            }
            yield this.configService.saveEnableImageWatermark(body);
            return { code: 200, message: "图片水印启用配置保存成功" };
        });
    }
    imageWatermark(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            let tempPath = "";
            try {
                const { name, gravity, opacity, x, y, ws } = body;
                if (!name || !body.base64 || !gravity || (opacity !== 0 && !opacity) || (x !== 0 && !x) || (y !== 0 && !y) || (ws !== 0 && !ws)) {
                    throw new common_1.HttpException("缺少参数", 400);
                }
                if (!this.gravity.has(gravity)) {
                    throw new common_1.HttpException("不允许的水印图片位置", 400);
                }
                if (!Number.isInteger(x)) {
                    throw new common_1.HttpException("x偏移不是整数", 400);
                }
                if (!Number.isInteger(y)) {
                    throw new common_1.HttpException("y偏移不是整数", 400);
                }
                if (!Number.isInteger(opacity)) {
                    throw new common_1.HttpException("透明度不是整数", 400);
                }
                else if (opacity <= 0) {
                    throw new common_1.HttpException("透明度小于0", 400);
                }
                else if (opacity > 100) {
                    throw new common_1.HttpException("透明度大于100", 400);
                }
                else {
                }
                if (!Number.isInteger(ws)) {
                    throw new common_1.HttpException("短边自适应比例不是整数", 400);
                }
                else if (ws <= 0) {
                    throw new common_1.HttpException("短边自适应比例不大于0", 400);
                }
                else {
                }
                tempPath = path.resolve(process.cwd(), "storages", "local", "temp", name);
                yield this.fileUtil.write(tempPath, Buffer.from(body.base64, "base64"));
                delete body.base64;
                const file = {
                    name,
                    path: tempPath
                };
                if (!this.kindUtil.isImage(file.name.substr(file.name.lastIndexOf(".") + 1))) {
                    throw new common_1.HttpException("不允许的水印图片类型", 400);
                }
                yield this.configService.saveImageWatermark(file, body);
            }
            catch (err) {
                throw err;
            }
            finally {
                if (tempPath) {
                    yield this.fileUtil.deleteIfExist(tempPath);
                }
            }
            return { code: 200, message: "图片水印配置成功" };
        });
    }
    audioFormat(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const format = body.format;
            if (!format) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            if (format !== "raw" && format !== "mp3" && format !== "aac") {
                throw new common_1.HttpException("音频保存格式不正确", 400);
            }
            yield this.configService.saveAudioFormat(body);
            return { code: 200, message: "音频保存格式配置保存成功" };
        });
    }
    videoFormat(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const { format, resolution } = body;
            if (!format || !resolution) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            if (format !== "raw" && format !== "vp9" && format !== "h264" && format !== "h265") {
                throw new common_1.HttpException("编码格式不正确", 400);
            }
            if (resolution !== "raw" && resolution !== "p1080" && resolution !== "p720" && resolution !== "p480") {
                throw new common_1.HttpException("分辨率格式不正确", 400);
            }
            yield this.configService.saveVideoFormat(body);
            return { code: 200, message: "视频保存格式配置保存成功" };
        });
    }
    buckets(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const buckets = yield this.bucketRepository.createQueryBuilder("bucket")
                .select(["bucket.id", "bucket.publicOrPrivate", "bucket.name"])
                .getMany();
            if (buckets.length !== 2) {
                throw new common_1.HttpException("空间配置不存在", 401);
            }
            return { code: 200, message: "获取空间配置成功", buckets };
        });
    }
};
__decorate([
    graphql_1.Mutation("bucket"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _a || Object, Object]),
    __metadata("design:returntype", Promise)
], ConfigResolver.prototype, "bucket", null);
__decorate([
    graphql_1.Mutation("imageFormat"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _b || Object, Object]),
    __metadata("design:returntype", Promise)
], ConfigResolver.prototype, "imageFormat", null);
__decorate([
    graphql_1.Mutation("enableImageWatermark"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _c || Object, Object]),
    __metadata("design:returntype", Promise)
], ConfigResolver.prototype, "enableImageWatermark", null);
__decorate([
    graphql_1.Mutation("imageWatermark"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _d || Object, Object]),
    __metadata("design:returntype", Promise)
], ConfigResolver.prototype, "imageWatermark", null);
__decorate([
    graphql_1.Mutation("audioFormat"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _e || Object, Object]),
    __metadata("design:returntype", Promise)
], ConfigResolver.prototype, "audioFormat", null);
__decorate([
    graphql_1.Mutation("videoFormat"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _f || Object, Object]),
    __metadata("design:returntype", Promise)
], ConfigResolver.prototype, "videoFormat", null);
__decorate([
    graphql_1.Query("buckets"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _g || Object]),
    __metadata("design:returntype", Promise)
], ConfigResolver.prototype, "buckets", null);
ConfigResolver = __decorate([
    graphql_1.Resolver("Config"),
    common_1.UseInterceptors(exception_interceptor_1.ExceptionInterceptor),
    __param(0, common_1.Inject(file_util_1.FileUtil)),
    __param(1, common_1.Inject(kind_util_1.KindUtil)),
    __param(2, common_1.Inject(config_service_1.ConfigService)),
    __param(3, typeorm_1.InjectRepository(bucket_entity_1.Bucket)),
    __metadata("design:paramtypes", [file_util_1.FileUtil,
        kind_util_1.KindUtil,
        config_service_1.ConfigService,
        typeorm_2.Repository])
], ConfigResolver);
exports.ConfigResolver = ConfigResolver;
var _a, _b, _c, _d, _e, _f, _g;

//# sourceMappingURL=config.resolver.js.map
