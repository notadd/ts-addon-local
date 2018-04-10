import { Component, HttpException } from "@nestjs/common";
import * as crypto from "crypto";
import { Bucket } from "../model/bucket.entity";

@Component()
export class TokenUtil {

    constructor() {
    }

    getToken(url: string, bucket: Bucket): string {
        if (bucket.publicOrPrivate === "public") {
            throw new Error("公有空间不需要token");
        }
        // 获取超时GMT时间戳，单位为秒
        const expire: number = Math.floor((+new Date()) / 1000) + bucket.tokenExpire;
        // 拼接要签名的字符串
        const str = url + expire + bucket.tokenSecretKey;
        const md5 = crypto.createHash("md5").update(str).digest("hex");
        return md5 + expire;
    }

    verify(url: string, bucket: Bucket, token: string): void {
        const expire: number = parseInt(token.substring(32));
        const md5: string = token.substring(0, 32);
        const str = url + expire + bucket.tokenSecretKey;
        const generateMd5 = crypto.createHash("md5").update(str).digest("hex");
        if (md5 !== generateMd5) {
            throw new HttpException("token验证错误", 413);
        }
        // 当前时间
        const now = Math.floor(+new Date() / 1000);
        if (now > expire) {
            throw new HttpException("token超时", 414);
        }
    }
}
