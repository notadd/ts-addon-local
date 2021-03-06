"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
const formidable = require("formidable");
let UploadParamGuard = class UploadParamGuard {
    canActivate(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = context.switchToHttp().getRequest();
            let file = {}, obj = {};
            let ex = "";
            yield new Promise((resolve, reject) => {
                const form = new formidable.IncomingForm();
                form.parse(req, (err, fields, files) => {
                    if (err) {
                        reject(new common_1.HttpException("上传文件请求解析错误:" + err.toString(), 402));
                    }
                    if (!fields) {
                        reject(new common_1.HttpException("表单字段不存在", 400));
                    }
                    if (!fields.bucketName) {
                        reject(new common_1.HttpException("缺少参数bucketName", 400));
                    }
                    if (!fields.rawName) {
                        reject(new common_1.HttpException("缺少参数rawName", 400));
                    }
                    if (!fields.md5) {
                        reject(new common_1.HttpException("缺少参数md5", 400));
                    }
                    if (!files || !files.file) {
                        reject(new common_1.HttpException("文件字段不存在", 400));
                    }
                    file = files.file;
                    obj = fields;
                    resolve();
                    return;
                });
            }).catch(err => {
                ex = err;
            });
            if (ex) {
                throw ex;
            }
            req.body.uploadFile = file;
            req.body.uploadForm = obj;
            return true;
        });
    }
};
UploadParamGuard = __decorate([
    common_1.Injectable()
], UploadParamGuard);
exports.UploadParamGuard = UploadParamGuard;

//# sourceMappingURL=upload.param.guard.js.map
