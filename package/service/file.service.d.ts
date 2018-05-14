import { Repository } from "typeorm";
import { UploadFile } from "../interface/file/upload.file";
import { UploadForm } from "../interface/file/upload.form";
import { Audio } from "../model/audio.entity";
import { Bucket } from "../model/bucket.entity";
import { File } from "../model/file.entity";
import { Image } from "../model/image.entity";
import { Video } from "../model/video.entity";
import { ImageProcessUtil } from "../util/image.process.util";
import { KindUtil } from "../util/kind.util";
import { TokenUtil } from "../util/token.util";
export declare class FileService {
    private readonly kindUtil;
    private readonly tokenUtil;
    private readonly imageProcessUtil;
    private readonly fileRepository;
    private readonly imageRepository;
    private readonly audioRepository;
    private readonly videoRepository;
    private readonly bucketRepository;
    constructor(kindUtil: KindUtil, tokenUtil: TokenUtil, imageProcessUtil: ImageProcessUtil, fileRepository: Repository<File>, imageRepository: Repository<Image>, audioRepository: Repository<Audio>, videoRepository: Repository<Video>, bucketRepository: Repository<Bucket>);
    saveUploadFile(bucket: Bucket, file: UploadFile, obj: UploadForm): Promise<any>;
    getAll(data: any, bucketName: string): Promise<void>;
}
