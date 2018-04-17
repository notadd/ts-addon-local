/// <reference types="node" />
/// <reference types="sharp" />
import * as sharp from "sharp";
import { ImageMetadata } from "../interface/file/image.metadata";
import { Blur, ImagePostProcessInfo, ImagePreProcessInfo, Resize, Tailor } from "../interface/file/image.process.info";
import { Bucket } from "../model/bucket.entity";
import { FileUtil } from "./file.util";
import { KindUtil } from "./kind.util";
export declare class ImageProcessUtil {
    private readonly kindUtil;
    private readonly fileUtil;
    private readonly gravity;
    private readonly baseDirectory;
    constructor(kindUtil: KindUtil, fileUtil: FileUtil);
    getMetadata(pathOrBuffer: string | Buffer): Promise<ImageMetadata>;
    processAndStore(imagePath: string, bucket: Bucket, imageProcessInfo: ImagePostProcessInfo | ImagePreProcessInfo): Promise<ImageMetadata>;
    processAndOutput(bucket: Bucket, imagePath: string, imageProcessInfo: ImagePostProcessInfo | ImagePreProcessInfo): Promise<Buffer>;
    preProcess(imagePath: string, bucket: Bucket, imageProcessInfo: ImagePreProcessInfo): Promise<Buffer>;
    postProcess(imagePath: string, bucket: Bucket, imageProcessInfo: ImagePostProcessInfo): Promise<Buffer>;
    resize(instance: sharp.SharpInstance, resize: Resize, preWidth: number, preHeight: number): any;
    tailor(instance: sharp.SharpInstance, tailor: Tailor, preWidth: number, preHeight: number): any;
    watermark(bucket: Bucket, instance: sharp.SharpInstance, metadata: ImageMetadata, watermark: boolean, preWidth: number, preHeight: number): Promise<string>;
    rotate(instance: sharp.SharpInstance, metadata: ImageMetadata, rotate: number, width: number, height: number): Promise<string>;
    blur(instance: sharp.SharpInstance, blur: Blur): void;
    sharpen(instance: sharp.SharpInstance, sharpen: boolean): void;
    format(instance: sharp.SharpInstance, format: string): void;
    strip(instance: sharp.SharpInstance, strip: boolean): void;
    output(instance: sharp.SharpInstance, format: string, lossless: boolean, quality: number, progressive: boolean): void;
}
