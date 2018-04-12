import { Bucket } from "../model/bucket.entity";
export declare class TokenUtil {
    constructor();
    getToken(url: string, bucket: Bucket): string;
    verify(url: string, bucket: Bucket, token: string): void;
}
