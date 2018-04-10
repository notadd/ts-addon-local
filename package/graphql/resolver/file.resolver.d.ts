/// <reference types="node" />
import { DownloadProcessData } from "../../interface/file/download.process.data";
import { UploadProcessBody } from "../../interface/file/upload.process.body";
import { UploadProcessData } from "../../interface/file/upload.process.data";
import { FileLocationBody } from "../../interface/file/file.location.body";
import { Repository } from "typeorm";
import { FileService } from "../../service/file.service";
import { AllBody } from "../../interface/file/all.body";
import { AllData } from "../../interface/file/all.data";
import { OneBody } from "../../interface/file/one.body";
import { OneData } from "../../interface/file/one.data";
import { CommonData } from "../../interface/common";
import { Bucket } from "../../model/bucket.entity";
import { TokenUtil } from "../../util/token.util";
import { Image } from "../../model/image.entity";
import { File } from "../../model/file.entity";
import { KindUtil } from "../../util/kind.util";
import { FileUtil } from "../../util/file.util";
import { IncomingMessage } from "http";
export declare class FileResolver {
    private readonly fileUtil;
    private readonly kindUtil;
    private readonly tokenUtil;
    private readonly fileService;
    private readonly fileRepository;
    private readonly imageRepository;
    private readonly bucketRepository;
    constructor(fileUtil: FileUtil, kindUtil: KindUtil, tokenUtil: TokenUtil, fileService: FileService, fileRepository: Repository<File>, imageRepository: Repository<Image>, bucketRepository: Repository<Bucket>);
    downloadProcess(req: any, body: FileLocationBody): Promise<DownloadProcessData>;
    uploadProcess(req: any, body: UploadProcessBody): Promise<UploadProcessData>;
    getOne(req: any, body: OneBody): Promise<OneData>;
    files(req: any, body: AllBody): Promise<AllData>;
    deleteFile(req: IncomingMessage, body: FileLocationBody): Promise<CommonData>;
}
