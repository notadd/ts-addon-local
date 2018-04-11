/// <reference types="node" />
import { EnableImageWatermark } from "../../interface/config/enable.image.watermark";
import { ImageWatermark } from "../../interface/config/image.watermark";
import { BucketConfig } from "../../interface/config/bucket.config";
import { BucketsData } from "../../interface/config/buckets.data";
import { ImageFormat } from "../../interface/config/image.format";
import { AudioFormat } from "../../interface/config/audio.format";
import { VideoFormat } from "../../interface/config/video.format";
import { ConfigService } from "../../service/config.service";
import { IncomingMessage } from "http";
import { CommonData } from "../../interface/common";
import { Bucket } from "../../model/bucket.entity";
import { KindUtil } from "../../util/kind.util";
import { FileUtil } from "../../util/file.util";
import { Repository } from "typeorm";
export declare class ConfigResolver {
    private readonly fileUtil;
    private readonly kindUtil;
    private readonly configService;
    private readonly bucketRepository;
    private readonly gravity;
    private readonly _imageFormat;
    private readonly _audioFormat;
    private readonly _videoFormat;
    private readonly _videoResolution;
    constructor(fileUtil: FileUtil, kindUtil: KindUtil, configService: ConfigService, bucketRepository: Repository<Bucket>);
    bucket(req: IncomingMessage, body: BucketConfig): Promise<CommonData>;
    imageFormat(req: IncomingMessage, body: ImageFormat): Promise<CommonData>;
    enableImageWatermark(req: IncomingMessage, body: EnableImageWatermark): Promise<CommonData>;
    imageWatermark(req: IncomingMessage, body: ImageWatermark): Promise<CommonData>;
    audioFormat(req: IncomingMessage, body: AudioFormat): Promise<CommonData>;
    videoFormat(req: IncomingMessage, body: VideoFormat): Promise<CommonData>;
    buckets(req: IncomingMessage): Promise<BucketsData>;
}
