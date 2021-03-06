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
const local_exception_filter_1 = require("../exception/local.exception.filter");
const upload_param_guard_1 = require("../guard/upload.param.guard");
const image_process_util_1 = require("../util/image.process.util");
const typeorm_1 = require("typeorm");
const file_service_1 = require("../service/file.service");
const typeorm_2 = require("@nestjs/typeorm");
const bucket_entity_1 = require("../model/bucket.entity");
const token_util_1 = require("../util/token.util");
const image_entity_1 = require("../model/image.entity");
const file_entity_1 = require("../model/file.entity");
const file_util_1 = require("../util/file.util");
const kind_util_1 = require("../util/kind.util");
const crypto = require("crypto");
const path = require("path");
const mime = require("mime");
let FileController = class FileController {
    constructor(fileUtil, kindUtil, tokenUtil, fileService, imageProcessUtil, fileRepository, imageRepository, bucketRepository) {
        this.fileUtil = fileUtil;
        this.kindUtil = kindUtil;
        this.tokenUtil = tokenUtil;
        this.fileService = fileService;
        this.imageProcessUtil = imageProcessUtil;
        this.fileRepository = fileRepository;
        this.imageRepository = imageRepository;
        this.bucketRepository = bucketRepository;
        this.baseDirectory = path.resolve(process.cwd(), "storages", "local");
    }
    download(headers, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName } = headers;
            if (!bucketName) {
                throw new common_1.HttpException("缺少参数bucketName", 400);
            }
            if (!fileName) {
                throw new common_1.HttpException("缺少参数fileName", 400);
            }
            const realPath = this.baseDirectory + "/" + bucketName + "/" + fileName;
            if (!this.fileUtil.exist(realPath)) {
                throw new common_1.HttpException("请求下载的文件不存在", 404);
            }
            const buffer = yield this.fileUtil.read(realPath);
            res.setHeader("Content-Type", mime.getType(fileName));
            res.setHeader("Content-Length", Buffer.byteLength(buffer));
            res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
            res.end(buffer);
            return;
        });
    }
    upload(body) {
        return __awaiter(this, void 0, void 0, function* () {
            const { uploadForm: obj, uploadFile: file } = body;
            let url;
            try {
                const bucket = yield this.bucketRepository.createQueryBuilder("bucket")
                    .leftJoinAndSelect("bucket.imageConfig", "imageConfig")
                    .leftJoinAndSelect("bucket.audioConfig", "audioConfig")
                    .leftJoinAndSelect("bucket.videoConfig", "videoConfig")
                    .where("bucket.name = :name", { name: obj.bucketName })
                    .getOne();
                if (!bucket) {
                    throw new common_1.HttpException("指定空间" + obj.bucketName + "不存在", 401);
                }
                if (file.name !== obj.rawName) {
                    throw new common_1.HttpException("上传文件名" + file.name + "与请求头中文件名" + obj.fileName + "不符", 411);
                }
                const { imagePreProcessString, contentSecret, tagsString, md5 } = obj;
                const buffer = yield this.fileUtil.read(file.path);
                if (!(crypto.createHash("md5").update(buffer).digest("hex") === md5)) {
                    throw new common_1.HttpException("文件md5校验失败", 411);
                }
                url = yield this.fileService.saveUploadFile(bucket, file, obj);
            }
            catch (err) {
                throw err;
            }
            finally {
                yield this.fileUtil.delete(file.path);
            }
            return {
                code: 200,
                message: "上传文件成功",
                url
            };
        });
    }
    visit(param, query, res, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName } = param;
            const { imagePostProcessString, token } = query;
            const realPath = this.baseDirectory + "/" + bucketName + "/" + fileName;
            if (!this.fileUtil.exist(realPath)) {
                throw new common_1.HttpException("指定文件不存在", 404);
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
            if (bucket.publicOrPrivate === "private") {
                if (!token) {
                    throw new common_1.HttpException("访问私有空间文件需要token", 412);
                }
                let fullUrl = decodeURI(req.protocol + "://" + req.get("host") + req.originalUrl);
                if (imagePostProcessString) {
                    fullUrl = fullUrl.substring(0, fullUrl.lastIndexOf("&token="));
                }
                else {
                    fullUrl = fullUrl.substring(0, fullUrl.lastIndexOf("?token="));
                }
                this.tokenUtil.verify(fullUrl, bucket, token);
            }
            let imagePostProcessInfo = {};
            if (imagePostProcessString) {
                try {
                    imagePostProcessInfo = JSON.parse(imagePostProcessString);
                }
                catch (err) {
                    throw new common_1.HttpException("JSON解析错误:" + err.toString(), 409);
                }
            }
            const type = fileName.substring(fileName.lastIndexOf(".") + 1);
            const kind = this.kindUtil.getKind(type);
            if (kind === "image") {
                const buffer = yield this.imageProcessUtil.processAndOutput(bucket, realPath, imagePostProcessInfo);
                const metadata = yield this.imageProcessUtil.getMetadata(buffer);
                res.setHeader("Content-Type", mime.getType(metadata.format));
                if (bucket.publicOrPrivate === "private") {
                    res.setHeader("Cache-Control", ["no-store", "no-cache"]);
                }
                res.setHeader("Content-Disposition", "inline");
                res.end(buffer);
            }
            else {
            }
        });
    }
};
__decorate([
    common_1.Get("/download"),
    __param(0, common_1.Headers()), __param(1, common_1.Response()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "download", null);
__decorate([
    common_1.Post("/upload"),
    common_1.UseGuards(upload_param_guard_1.UploadParamGuard),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "upload", null);
__decorate([
    common_1.Get("/visit/:bucketName/:fileName"),
    __param(0, common_1.Param()), __param(1, common_1.Query()), __param(2, common_1.Response()), __param(3, common_1.Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FileController.prototype, "visit", null);
FileController = __decorate([
    common_1.Controller("local/file"),
    common_1.UseFilters(new local_exception_filter_1.LocalExceptionFilter()),
    __param(0, common_1.Inject(file_util_1.FileUtil)),
    __param(1, common_1.Inject(kind_util_1.KindUtil)),
    __param(2, common_1.Inject(token_util_1.TokenUtil)),
    __param(3, common_1.Inject(file_service_1.FileService)),
    __param(4, common_1.Inject(image_process_util_1.ImageProcessUtil)),
    __param(5, typeorm_2.InjectRepository(file_entity_1.File)),
    __param(6, typeorm_2.InjectRepository(image_entity_1.Image)),
    __param(7, typeorm_2.InjectRepository(bucket_entity_1.Bucket)),
    __metadata("design:paramtypes", [file_util_1.FileUtil,
        kind_util_1.KindUtil,
        token_util_1.TokenUtil,
        file_service_1.FileService,
        image_process_util_1.ImageProcessUtil,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], FileController);
exports.FileController = FileController;

//# sourceMappingURL=file.controller.js.map
