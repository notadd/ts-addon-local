import { ImageProcessUtil } from "../util/image.process.util";
import { HeaderParam } from "../interface/file/header.param";
import { QueryParam } from "../interface/file/query.param";
import { Repository } from "typeorm";
import { PathParam } from "../interface/file/path.param";
import { FileService } from "../service/file.service";
import { CommonData } from "../interface/common";
import { Bucket } from "../model/bucket.entity";
import { TokenUtil } from "../util/token.util";
import { Image } from "../model/image.entity";
import { File } from "../model/file.entity";
import { FileUtil } from "../util/file.util";
import { KindUtil } from "../util/kind.util";
export declare class FileController {
    private readonly fileUtil;
    private readonly kindUtil;
    private readonly tokenUtil;
    private readonly fileService;
    private readonly imageProcessUtil;
    private readonly fileRepository;
    private readonly imageRepository;
    private readonly bucketRepository;
    private readonly baseDirectory;
    constructor(fileUtil: FileUtil, kindUtil: KindUtil, tokenUtil: TokenUtil, fileService: FileService, imageProcessUtil: ImageProcessUtil, fileRepository: Repository<File>, imageRepository: Repository<Image>, bucketRepository: Repository<Bucket>);
    download(headers: HeaderParam, res: any): Promise<any>;
    upload(body: any): Promise<CommonData & {
        url: string;
    }>;
    visit(param: PathParam, query: QueryParam, res: any, req: any): Promise<any>;
}
