"use strict";
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
const image_process_util_1 = require("../util/image.process.util");
const typeorm_1 = require("@nestjs/typeorm");
const bucket_entity_1 = require("../model/bucket.entity");
const image_entity_1 = require("../model/image.entity");
const token_util_1 = require("../util/token.util");
const file_util_1 = require("../util/file.util");
const kind_util_1 = require("../util/kind.util");
const path = require("path");
class StoreComponent {
    constructor(kindUtil, fileUtil, tokenUtil, imageProcessUtil, imageRepository, bucketRepository) {
        this.kindUtil = kindUtil;
        this.fileUtil = fileUtil;
        this.tokenUtil = tokenUtil;
        this.imageProcessUtil = imageProcessUtil;
        this.imageRepository = imageRepository;
        this.bucketRepository = bucketRepository;
        this.baseDirectory = path.resolve(process.cwd(), "storages", "local");
    }
    delete(bucketName, name, type) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const realPath = this.baseDirectory + "/" + bucketName + "/" + name + "." + type;
            if (!this.fileUtil.exist(realPath)) {
                throw new common_1.HttpException("要删除的文件不存在", 404);
            }
            yield this.fileUtil.delete(realPath);
        });
    }
    upload(bucketName, rawName, base64, imagePreProcessInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const tempPath = this.baseDirectory + "/temp" + ((+new Date()) + "") + rawName;
            if (!bucketName || !rawName || !base64) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            imagePreProcessInfo = !imagePreProcessInfo ? {} : imagePreProcessInfo;
            const bucket = yield this.bucketRepository.createQueryBuilder("bucket")
                .leftJoinAndSelect("bucket.imageConfig", "imageConfig")
                .where("bucket.name = :name", { name: bucketName })
                .getOne();
            if (!bucket) {
                throw new common_1.HttpException("指定空间" + bucketName + "不存在", 401);
            }
            yield this.fileUtil.write(tempPath, Buffer.from(base64, "base64"));
            let metadata = {};
            const type = rawName.substring(rawName.lastIndexOf(".") + 1);
            const kind = this.kindUtil.getKind(type);
            try {
                if (kind === "image") {
                    const imagePostProcessInfo = imagePreProcessInfo;
                    const format = bucket.imageConfig.format || "raw";
                    if (format === "raw") {
                        imagePostProcessInfo.strip = true;
                        imagePostProcessInfo.watermark = false;
                    }
                    else if (format === "webp_damage") {
                        imagePostProcessInfo.format = "webp";
                        imagePostProcessInfo.strip = true;
                        imagePostProcessInfo.watermark = false;
                    }
                    else if (format === "webp_undamage") {
                        imagePostProcessInfo.format = "webp";
                        imagePostProcessInfo.lossless = true;
                        imagePostProcessInfo.strip = true;
                        imagePostProcessInfo.watermark = false;
                    }
                    metadata = yield this.imageProcessUtil.processAndStore(tempPath, bucket, imagePostProcessInfo);
                    const image = new image_entity_1.Image();
                    image.bucket = bucket;
                    image.rawName = rawName;
                    image.name = metadata.name;
                    image.type = metadata.format;
                    image.width = metadata.width;
                    image.height = metadata.height;
                    image.size = metadata.size;
                    const isExist = yield this.imageRepository.findOne({ name: metadata.name, bucketId: bucket.id });
                    if (!isExist) {
                        try {
                            yield this.imageRepository.save(image);
                        }
                        catch (err) {
                            yield this.fileUtil.delete(this.baseDirectory + "/" + bucket.name + "/" + image.name + "." + image.type);
                            throw new common_1.HttpException("上传图片保存失败" + err.toString(), 410);
                        }
                    }
                }
                else {
                }
            }
            catch (err) {
                throw err;
            }
            finally {
                yield this.fileUtil.deleteIfExist(tempPath);
            }
            return { bucketName, name: metadata.name, type: metadata.format };
        });
    }
    getUrl(req, bucketName, name, type, imagePostProcessInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bucketName || !name || !type || !req || !req.protocol || !req.get("host")) {
                throw new common_1.HttpException("缺少参数", 400);
            }
            const bucket = yield this.bucketRepository.findOne({ name: bucketName });
            if (!bucket) {
                throw new common_1.HttpException("指定空间" + bucketName + "不存在", 401);
            }
            let url = req.protocol + "://" + req.get("host") + "/local/file/visit";
            const kind = this.kindUtil.getKind(type);
            if (kind === "image") {
                const image = yield this.imageRepository.findOne({ name, bucketId: bucket.id });
                if (!image) {
                    throw new common_1.HttpException("指定图片" + name + "." + type + "不存在", 404);
                }
                url += "/" + bucketName + "/" + name + "." + type;
                if (imagePostProcessInfo) {
                    url += "?imagePostProcessString=" + JSON.stringify(imagePostProcessInfo);
                    if (bucket.publicOrPrivate === "private") {
                        url += "&token=" + this.tokenUtil.getToken(url, bucket);
                    }
                }
                else {
                    if (bucket.publicOrPrivate === "private") {
                        url += "?token=" + this.tokenUtil.getToken(url, bucket);
                    }
                }
            }
            else {
            }
            return url;
        });
    }
}
exports.StoreComponent = StoreComponent;
exports.StoreComponentToken = "StoreComponentToken";
exports.StoreComponentProvider = {
    provide: exports.StoreComponentToken,
    useFactory: (kindUtil, fileUtil, tokenUtil, imageProcessUtil, imageRepository, bucketRepository) => {
        return new StoreComponent(kindUtil, fileUtil, tokenUtil, imageProcessUtil, imageRepository, bucketRepository);
    },
    inject: [kind_util_1.KindUtil, file_util_1.FileUtil, token_util_1.TokenUtil, image_process_util_1.ImageProcessUtil, typeorm_1.getRepositoryToken(image_entity_1.Image), typeorm_1.getRepositoryToken(bucket_entity_1.Bucket)]
};

//# sourceMappingURL=store.component.provider.js.map
