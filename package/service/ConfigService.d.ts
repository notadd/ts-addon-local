import { Repository } from 'typeorm';
import { AudioFormat } from '../interface/config/AudioFormat';
import { BucketConfig } from '../interface/config/BucketConfig';
import { EnableImageWatermark } from '../interface/config/EnableImageWatermark';
import { ImageFormat } from '../interface/config/ImageFormat';
import { VideoFormat } from '../interface/config/VideoFormat';
import { AudioConfig } from '../model/AudioConfig.entity';
import { Bucket } from '../model/Bucket.entity';
import { Image } from '../model/Image.entity';
import { ImageConfig } from '../model/ImageConfig.entity';
import { VideoConfig } from '../model/VideoConfig.entity';
import { FileUtil } from '../util/FileUtil';
import { ImageProcessUtil } from '../util/ImageProcessUtil';
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
