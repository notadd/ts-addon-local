/// <reference types="node" />
/// <reference types="sharp" />
import { SharpInstance } from "sharp";
import { ImageMetadata } from "../interface/file/image.metadata";
import { Blur, ImagePostProcessInfo, ImagePreProcessInfo, Resize, Tailor } from "../interface/file/image.process.info";
import { Bucket } from "../model/bucket.entity";
import { FileUtil } from "./file.util";
import { KindUtil } from "./kind.util";
export declare class ImageProcessUtil {
    private readonly kindUtil;
    private readonly fileUtil;
    private readonly gravity;
    constructor(kindUtil: KindUtil, fileUtil: FileUtil);
    getMetadata(pathOrBuffer: string | Buffer): Promise<ImageMetadata>;
    processAndStore(imagePath: string, bucket: Bucket, imageProcessInfo: ImagePostProcessInfo | ImagePreProcessInfo): Promise<ImageMetadata>;
    processAndOutput(bucket: Bucket, imagePath: string, imageProcessInfo: ImagePostProcessInfo | ImagePreProcessInfo): Promise<Buffer>;
    preProcess(imagePath: string, bucket: Bucket, imageProcessInfo: ImagePreProcessInfo): Promise<Buffer>;
    postProcess(imagePath: string, bucket: Bucket, imageProcessInfo: ImagePostProcessInfo): Promise<Buffer>;
    resize(instance: SharpInstance, resize: Resize, preWidth: number, preHeight: number): any;
    tailor(instance: SharpInstance, tailor: Tailor, preWidth: number, preHeight: number): any;
    watermark(bucket: Bucket, instance: SharpInstance, metadata: ImageMetadata, watermark: boolean, preWidth: number, preHeight: number): Promise<string>;
    rotate(instance: SharpInstance, metadata: ImageMetadata, rotate: number, width: number, height: number): Promise<string>;
    blur(instance: SharpInstance, blur: Blur): void;
    sharpen(instance: SharpInstance, sharpen: boolean): void;
    format(instance: SharpInstance, format: string): void;
    strip(instance: SharpInstance, strip: boolean): void;
    output(instance: SharpInstance, format: string, lossless: boolean, quality: number, progressive: boolean): void;
}
