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
const exception_interceptor_1 = require("../interceptor/exception.interceptor");
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const file_service_1 = require("../service/file.service");
const bucket_entity_1 = require("../model/bucket.entity");
const typeorm_2 = require("@nestjs/typeorm");
const token_util_1 = require("../util/token.util");
const image_entity_1 = require("../model/image.entity");
const file_entity_1 = require("../model/file.entity");
const kind_util_1 = require("../util/kind.util");
const file_util_1 = require("../util/file.util");
const express_1 = require("express");
const path = require("path");
let FileResolver = class FileResolver {
    constructor(fileUtil, kindUtil, tokenUtil, fileService, fileRepository, imageRepository, bucketRepository) {
        this.fileUtil = fileUtil;
        this.kindUtil = kindUtil;
        this.tokenUtil = tokenUtil;
        this.fileService = fileService;
        this.fileRepository = fileRepository;
        this.imageRepository = imageRepository;
        this.bucketRepository = bucketRepository;
    }
    downloadProcess(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                code: 200,
                message: "下载预处理成功",
                method: "get",
                headers: {
                    bucketName: "",
                    fileName: ""
                },
                url: req.protocol + "://" + req.get("host") + "/local/file/download"
            };
            const { bucketName, name, type } = body;
            if (!bucketName || !name || !type) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            const bucket = yield this.bucketRepository.findOne({ name: bucketName });
            if (!bucket) {
                throw new common_1.HttpException("指定空间" + bucketName + "不存在", 401);
            }
            let file = {};
            if (this.kindUtil.isImage(type)) {
                file = yield this.imageRepository.findOne({ name, type, bucketId: bucket.id });
            }
            else {
            }
            if (!file) {
                throw new common_1.HttpException("指定文件" + name + "不存在", 404);
            }
            data.headers.bucketName = bucket.name;
            data.headers.fileName = file.name + "." + file.type;
            return data;
        });
    }
    uploadProcess(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                code: 200,
                message: "",
                method: "post",
                url: req.protocol + "://" + req.get("host") + "/local/file/upload",
                baseUrl: req.protocol + "://" + req.get("host"),
                form: {
                    md5: "",
                    rawName: "",
                    bucketName: "",
                    tagsString: undefined,
                    contentSecret: undefined,
                    imagePreProcessString: undefined,
                }
            };
            const { bucketName, md5, contentName, contentSecret, tags, imagePreProcessInfo } = body;
            if (!bucketName || !contentName) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            const bucket = yield this.bucketRepository.findOne({ name: bucketName });
            if (!bucket) {
                throw new common_1.HttpException("指定空间" + bucketName + "不存在", 401);
            }
            data.form.md5 = md5;
            data.form.rawName = contentName;
            data.form.bucketName = bucket.name;
            data.form.contentSecret = contentSecret;
            try {
                data.form.tagsString = JSON.stringify(tags);
                data.form.imagePreProcessString = JSON.stringify(imagePreProcessInfo);
            }
            catch (err) {
                throw new common_1.HttpException("JSON解析错误" + err.toString(), 409);
            }
            return data;
        });
    }
    getOne(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                code: 200,
                message: "获取文件url成功",
                url: req.protocol + "://" + req.get("host") + "/local/file/visit"
            };
            const { bucketName, name, type, imagePostProcessInfo } = body;
            if (!bucketName || !name || !type) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            const bucket = yield this.bucketRepository.createQueryBuilder("bucket")
                .leftJoinAndSelect("bucket.imageConfig", "imageConfig")
                .leftJoinAndSelect("bucket.audioConfig", "audioConfig")
                .leftJoinAndSelect("bucket.videoConfig", "videoConfig")
                .where("bucket.name = :name", { name: bucketName })
                .getOne();
            if (!bucket) {
                throw new common_1.HttpException("指定空间" + bucketName + "不存在", 401);
            }
            const kind = this.kindUtil.getKind(type);
            if (kind === "image") {
                const image = yield this.imageRepository.findOne({ name, bucketId: bucket.id });
                if (!image) {
                    throw new common_1.HttpException("指定图片" + name + "." + type + "不存在", 404);
                }
                data.url += "/" + bucketName + "/" + name + "." + type;
                if (imagePostProcessInfo) {
                    data.url += "?imagePostProcessString=" + JSON.stringify(imagePostProcessInfo);
                    if (bucket.publicOrPrivate === "private") {
                        data.url += "&token=" + this.tokenUtil.getToken(data.url, bucket);
                    }
                }
                else {
                    if (bucket.publicOrPrivate === "private") {
                        data.url += "?token=" + this.tokenUtil.getToken(data.url, bucket);
                    }
                }
            }
            else {
            }
            return data;
        });
    }
    files(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                code: 200,
                message: "获取空间下所有文件成功",
                baseUrl: req.protocol + "://" + req.get("host") + "/local/file/visit",
                files: [],
                images: [],
                audios: [],
                videos: [],
                documents: []
            };
            const { bucketName } = body;
            if (!bucketName) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            yield this.fileService.getAll(data, bucketName);
            return data;
        });
    }
    deleteFile(req, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, type, name } = body;
            if (!bucketName || !name || !type) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            const bucket = yield this.bucketRepository.findOne({ name: bucketName });
            if (!bucket) {
                throw new common_1.HttpException("指定空间" + bucketName + "不存在", 401);
            }
            const kind = this.kindUtil.getKind(type);
            if (kind === "image") {
                const image = yield this.imageRepository.findOne({ name, bucketId: bucket.id });
                if (!image) {
                    throw new common_1.HttpException("文件" + name + "不存在于数据库中", 404);
                }
                yield this.imageRepository.delete({ name, bucketId: bucket.id });
            }
            else {
            }
            const realPath = path.resolve(__dirname, "../../", "store", bucketName, name + "." + type);
            if (!this.fileUtil.exist(realPath)) {
                throw new common_1.HttpException("要删除的文件不存在", 404);
            }
            yield this.fileUtil.delete(realPath);
            return { code: 200, message: "删除成功" };
        });
    }
};
__decorate([
    graphql_1.Query("downloadProcess"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FileResolver.prototype, "downloadProcess", null);
__decorate([
    graphql_1.Mutation("uploadProcess"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FileResolver.prototype, "uploadProcess", null);
__decorate([
    graphql_1.Query("one"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FileResolver.prototype, "getOne", null);
__decorate([
    graphql_1.Query("all"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FileResolver.prototype, "files", null);
__decorate([
    graphql_1.Mutation("deleteFile"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof express_1.Request !== "undefined" && express_1.Request) === "function" && _a || Object, Object]),
    __metadata("design:returntype", Promise)
], FileResolver.prototype, "deleteFile", null);
FileResolver = __decorate([
    graphql_1.Resolver("File"),
    common_1.UseInterceptors(exception_interceptor_1.ExceptionInterceptor),
    __param(0, common_1.Inject(file_util_1.FileUtil)),
    __param(1, common_1.Inject(kind_util_1.KindUtil)),
    __param(2, common_1.Inject(token_util_1.TokenUtil)),
    __param(3, common_1.Inject(file_service_1.FileService)),
    __param(4, typeorm_2.InjectRepository(file_entity_1.File)),
    __param(5, typeorm_2.InjectRepository(image_entity_1.Image)),
    __param(6, typeorm_2.InjectRepository(bucket_entity_1.Bucket)),
    __metadata("design:paramtypes", [file_util_1.FileUtil,
        kind_util_1.KindUtil,
        token_util_1.TokenUtil,
        file_service_1.FileService,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], FileResolver);
exports.FileResolver = FileResolver;
var _a;

//# sourceMappingURL=file.resolver.js.map
