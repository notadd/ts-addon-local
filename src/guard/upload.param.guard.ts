import { Injectable, CanActivate, ExecutionContext, HttpException } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context.host";
import { UploadFile } from "../interface/file/upload.file";
import { UploadForm } from "../interface/file/upload.form";
import * as formidable from "formidable";
import { Observable } from "rxjs";

@Injectable()
export class UploadParamGuard implements CanActivate {
    async canActivate(context: ExecutionContextHost): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        // 解析from-data请求，获取上传表单中文件、其他字段
        let file: UploadFile = {} as any, obj: UploadForm = {} as any;
        let ex: any = "";
        await new Promise((resolve, reject) => {
            const form = new formidable.IncomingForm();
            form.parse(req, (err, fields, files) => {
                if (err) {
                    reject(new HttpException("上传文件请求解析错误:" + err.toString(), 402));
                }
                if (!fields) {
                    reject(new HttpException("表单字段不存在", 400));
                }
                if (!fields.bucketName) {
                    reject(new HttpException("缺少参数bucketName", 400));
                }
                if (!fields.rawName) {
                    reject(new HttpException("缺少参数rawName", 400));
                }
                if (!fields.md5) {
                    reject(new HttpException("缺少参数md5", 400));
                }
                if (!files || !files.file) {
                    reject(new HttpException("文件字段不存在", 400));
                }
                file = files.file;
                obj = fields;
                resolve();
                return;
            });
        }).catch(err => {
            ex = err;
        });
        if (ex) { throw ex; }
        req.body.uploadFile = file;
        req.body.uploadForm = obj;
        return true;
    }
}
