import { Injectable, HttpException } from "@nestjs/common";
import * as fs from "fs";

/* 异步操作文件的封装工具类 */
@Injectable()
export class FileUtil {

    constructor() {}

    async write(path: string, buffer: Buffer): Promise<void> {
        let ex: any = "";
        await new Promise((resolver, reject) => {
            fs.writeFile(path, buffer, (err) => {
                if (err) {
                    reject(new HttpException("文件写入磁盘错误:" + err.toString(), 405));
                }
                resolver();
            });
        }).catch(err => {
            ex = err;
        });
        if (ex) {
            throw ex;
        }
    }

    async read(path: string): Promise<Buffer> {
        let ex: any = "", result: Buffer = new Buffer(0);
        await new Promise((resolver, reject) => {
            fs.readFile(path, (err, buffer) => {
                if (err) {
                    reject(new HttpException("读取文件错误:" + err.toString(), 405));
                }
                result = buffer;
                resolver();
            });
        }).catch(err => {
            ex = err;
        });
        if (ex) {
            throw ex;
        }
        return result;
    }

    async delete(path: string): Promise<void> {
        let ex: any = "";
        await new Promise((resolver, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(new HttpException("文件删除错误:" + err.toString(), 406));
                }
                resolver();
            });
        }).catch(err => {
            ex = err;
        });
        if (ex) {
            throw ex;
        }
    }

    async deleteIfExist(path: string): Promise<void> {
        if (fs.existsSync(path)) {
            let ex: any = "";
            await new Promise((resolver, reject) => {
                fs.unlink(path, (err) => {
                    if (err) {
                        reject(new HttpException("文件删除错误:" + err.toString(), 406));
                    }
                    resolver();
                });
            }).catch(err => {
                ex = err;
            });
            if (ex) {
                throw ex;
            }
        }
    }

    // 获取文件状态，一般只有一个size能言用
    async size(path: string): Promise<any> {
        if (fs.existsSync(path)) {
            let ex: any = "";
            let size;
            await new Promise((resolver, reject) => {
                fs.stat(path, (err, stats) => {
                    if (err) {
                        reject(new HttpException("获取文件状态错误:" + err.toString(), 407));
                    }
                    size = stats.size;
                    resolver();
                });
            }).catch(err => {
                ex = err;
            });
            if (ex) {
                throw ex;
            }
            return size;
        } else {
            return undefined;
        }
    }

    exist(path: string): boolean {
        return fs.existsSync(path);
    }

    async mkdir(path: string): Promise<void> {
        let ex: any = "";
        await new Promise((resolver, reject) => {
            fs.mkdir(path, (err) => {
                if (err) {
                    reject(new HttpException("创建目录错误:" + err.toString(), 407));
                }
                resolver();
            });
        }).catch(err => {
            ex = err;
        });
        if (ex) {
            throw ex;
        }
    }
}
