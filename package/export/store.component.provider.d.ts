import { ImagePostProcessInfo, ImagePreProcessInfo } from "../interface/file/image.process.info";
import { ImageProcessUtil } from "../util/image.process.util";
import { Repository } from "typeorm";
import { Bucket } from "../model/bucket.entity";
import { Image } from "../model/image.entity";
import { TokenUtil } from "../util/token.util";
import { FileUtil } from "../util/file.util";
import { KindUtil } from "../util/kind.util";
export declare class StoreComponent {
    private readonly kindUtil;
    private readonly fileUtil;
    private readonly tokenUtil;
    private readonly imageProcessUtil;
    private readonly imageRepository;
    private readonly bucketRepository;
    private readonly baseDirectory;
    constructor(kindUtil: KindUtil, fileUtil: FileUtil, tokenUtil: TokenUtil, imageProcessUtil: ImageProcessUtil, imageRepository: Repository<Image>, bucketRepository: Repository<Bucket>);
    delete(bucketName: string, name: string, type: string): Promise<void>;
    upload(bucketName: string, rawName: string, base64: string, imagePreProcessInfo: ImagePreProcessInfo): Promise<{
        bucketName: string;
        name: string;
        type: string;
    }>;
    getUrl(req: any, bucketName: string, name: string, type: string, imagePostProcessInfo: ImagePostProcessInfo): Promise<string>;
}
export declare const StoreComponentProvider: {
    provide: string;
    useFactory: (kindUtil: KindUtil, fileUtil: FileUtil, tokenUtil: TokenUtil, imageProcessUtil: ImageProcessUtil, imageRepository: Repository<Image>, bucketRepository: Repository<Bucket>) => StoreComponent;
    inject: (string | typeof FileUtil | typeof KindUtil | typeof ImageProcessUtil | typeof TokenUtil)[];
};
