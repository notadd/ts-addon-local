import { Repository } from "typeorm";
import { AudioFormat } from "../interface/config/audio.format";
import { BucketConfig } from "../interface/config/bucket.config";
import { EnableImageWatermark } from "../interface/config/enable.image.watermark";
import { ImageFormat } from "../interface/config/image.format";
import { VideoFormat } from "../interface/config/video.format";
import { AudioConfig } from "../model/audio.config.entity";
import { Bucket } from "../model/bucket.entity";
import { Image } from "../model/image.entity";
import { ImageConfig } from "../model/image.config.entity";
import { VideoConfig } from "../model/video.config.entity";
import { FileUtil } from "../util/file.util";
import { ImageProcessUtil } from "../util/image.process.util";
export declare class ConfigService {
    private readonly fileUtil;
    private readonly imageProcessUtil;
    private readonly imageRepository;
    private readonly bucketRepository;
    private readonly imageConfigRepository;
    private readonly audioConfigRepository;
    private readonly videoConfigRepository;
    constructor(fileUtil: FileUtil, imageProcessUtil: ImageProcessUtil, imageRepository: Repository<Image>, bucketRepository: Repository<Bucket>, imageConfigRepository: Repository<ImageConfig>, audioConfigRepository: Repository<AudioConfig>, videoConfigRepository: Repository<VideoConfig>);
    saveBucketConfig(body: BucketConfig): Promise<void>;
    saveImageFormat(body: ImageFormat): Promise<void>;
    saveEnableImageWatermark(body: EnableImageWatermark): Promise<void>;
    saveImageWatermark(file: any, obj: any): Promise<void>;
    saveAudioFormat(body: AudioFormat): Promise<any>;
    saveVideoFormat(body: VideoFormat): Promise<any>;
}
